import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Calendar, Eye, Send, XCircle } from 'lucide-react';

interface Vehicle { id: string; registration_number: string; max_load_capacity: number; status: string; }
interface Driver { id: string; name: string; status: string; }
interface Trip {
  id: string;
  source: string;
  destination: string;
  cargo_weight: number;
  planned_distance: number;
  status: string;
  start_time: string | null;
  end_time: string | null;
  expected_delivery: string | null;
  trip_type: string;
  reason: string | null;
  pickup_customer_name: string | null;
  delivery_customer_name: string | null;
  vehicle_id: string | null;
  driver_id: string | null;
  vehicle?: Vehicle;
  driver?: Driver;
  createdAt: string;
}

const STATUS_BADGE: Record<string, string> = {
  DRAFT: 'badge-neutral',
  SCHEDULED: 'badge-warning',
  DISPATCHED: 'badge-info',
  IN_PROGRESS: 'badge-primary',
  COMPLETED: 'badge-success',
  CANCELLED: 'badge-danger',
};

export default function TripsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterVehicle, setFilterVehicle] = useState('');
  const [filterDriver, setFilterDriver] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Dropdown states
  const [showCreateDropdown, setShowCreateDropdown] = useState(false);

  const fetchAll = async () => {
    try {
      const [t, v, d] = await Promise.all([
        api.get('/trips'),
        api.get('/vehicles'),
        api.get('/drivers')
      ]);
      setTrips(t);
      setVehicles(v);
      setDrivers(d);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleDispatch = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.put(`/trips/${id}/dispatch`);
      fetchAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCancel = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to cancel this trip?')) return;
    try {
      await api.put(`/trips/${id}/cancel`);
      fetchAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const isManager = user?.role === 'FLEET_MANAGER';

  // Apply filters in Memory
  const filteredTrips = trips.filter((t) => {
    // Search filter (Origin, Destination, Customer names)
    if (search) {
      const query = search.toLowerCase();
      const matchSource = t.source.toLowerCase().includes(query);
      const matchDest = t.destination.toLowerCase().includes(query);
      const matchPickupCust = t.pickup_customer_name?.toLowerCase().includes(query) || false;
      const matchDeliveryCust = t.delivery_customer_name?.toLowerCase().includes(query) || false;
      if (!matchSource && !matchDest && !matchPickupCust && !matchDeliveryCust) return false;
    }

    // Dropdown filters
    if (filterStatus && t.status !== filterStatus) return false;
    if (filterType && t.trip_type !== filterType) return false;
    if (filterVehicle && t.vehicle_id !== filterVehicle) return false;
    if (filterDriver && t.driver_id !== filterDriver) return false;

    // Date range filter
    if (startDate) {
      const startLimit = new Date(startDate);
      if (new Date(t.createdAt) < startLimit) return false;
    }
    if (endDate) {
      const endLimit = new Date(endDate);
      endLimit.setHours(23, 59, 59, 999);
      if (new Date(t.createdAt) > endLimit) return false;
    }

    return true;
  });

  return (
    <>
      <div className="topbar">
        <h1>Trip Management</h1>
      </div>

      <div className="page-content animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {/* Header section with Create dropdown */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Dispatch Control Board</h2>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Manage customer dispatches, vehicle transfers, transit timelines and financial balances.
            </p>
          </div>

          {isManager && (
            <div style={{ position: 'relative' }}>
              <button 
                className="btn btn-primary" 
                onClick={() => setShowCreateDropdown(!showCreateDropdown)}
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Plus size={16} /> Create Trip
              </button>
              {showCreateDropdown && (
                <div 
                  className="card shadow-lg"
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '2.5rem',
                    width: '200px',
                    zIndex: 10,
                    padding: '0.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    border: '1px solid var(--border)'
                  }}
                >
                  <button 
                    className="btn btn-neutral text-left font-medium" 
                    style={{ fontSize: '0.8rem', padding: '0.5rem', justifyContent: 'flex-start' }}
                    onClick={() => { setShowCreateDropdown(false); navigate('/trips/create-delivery'); }}
                  >
                    🚚 Delivery Trip (Customer)
                  </button>
                  <button 
                    className="btn btn-neutral text-left font-medium" 
                    style={{ fontSize: '0.8rem', padding: '0.5rem', justifyContent: 'flex-start' }}
                    onClick={() => { setShowCreateDropdown(false); navigate('/trips/create-internal'); }}
                  >
                    🔧 Internal Move (Reposition)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Filter Ledger */}
        <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            
            {/* Search */}
            <div className="form-group" style={{ flex: 1, minWidth: '220px' }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-secondary)' }} />
                <input 
                  className="form-input" 
                  style={{ paddingLeft: '32px' }} 
                  placeholder="Search routes or customers..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Trip status filter */}
            <div className="form-group" style={{ width: '150px' }}>
              <select className="form-input" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="DISPATCHED">Dispatched</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            {/* Trip Type filter */}
            <div className="form-group" style={{ width: '150px' }}>
              <select className="form-input" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="">All Types</option>
                <option value="DELIVERY">Delivery Trip</option>
                <option value="INTERNAL">Internal Move</option>
              </select>
            </div>

            {/* Vehicle filter */}
            <div className="form-group" style={{ width: '150px' }}>
              <select className="form-input" value={filterVehicle} onChange={(e) => setFilterVehicle(e.target.value)}>
                <option value="">All Vehicles</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.registration_number}</option>)}
              </select>
            </div>

            {/* Driver filter */}
            <div className="form-group" style={{ width: '150px' }}>
              <select className="form-input" value={filterDriver} onChange={(e) => setFilterDriver(e.target.value)}>
                <option value="">All Drivers</option>
                {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>

          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', borderTop: '1px solid #F1F5F9', paddingTop: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={14} /> Created Date Range:
            </span>
            <input type="date" className="form-input" style={{ width: '140px', padding: '0.25rem 0.5rem' }} value={startDate} onChange={e => setStartDate(e.target.value)} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>to</span>
            <input type="date" className="form-input" style={{ width: '140px', padding: '0.25rem 0.5rem' }} value={endDate} onChange={e => setEndDate(e.target.value)} />
            {(startDate || endDate) && (
              <button 
                className="btn btn-neutral btn-sm" 
                style={{ padding: '0.25rem 0.5rem' }} 
                onClick={() => { setStartDate(''); setEndDate(''); }}
              >
                Clear Dates
              </button>
            )}
          </div>
        </div>

        {/* Trips Table */}
        {loading ? <p>Loading trips data...</p> : (
          <div className="table-wrapper card" style={{ padding: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Trip ID</th>
                  <th>Type</th>
                  <th>Route / Purpose</th>
                  <th>Customer</th>
                  <th>Vehicle</th>
                  <th>Driver</th>
                  <th>Status</th>
                  <th>Expected Delivery</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrips.length === 0 ? (
                  <tr>
                    <td colSpan={9}>
                      <div className="empty-state" style={{ padding: '2.5rem' }}>
                        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>No dispatches match the selected filters.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTrips.map((t) => (
                    <tr 
                      key={t.id} 
                      className="hover-row" 
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/trips/${t.id}`)}
                    >
                      <td style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                        #{t.id.substring(0, 8).toUpperCase()}
                      </td>
                      <td>
                        <span className={`badge ${t.trip_type === 'INTERNAL' ? 'badge-warning' : 'badge-primary'}`} style={{ fontSize: '0.65rem' }}>
                          {t.trip_type === 'INTERNAL' ? 'Internal' : 'Delivery'}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{t.source} → {t.destination}</div>
                        {t.trip_type === 'INTERNAL' && t.reason && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>({t.reason})</div>
                        )}
                      </td>
                      <td style={{ fontSize: '0.78rem' }}>
                        {t.trip_type === 'DELIVERY' ? (t.delivery_customer_name || '—') : 'Yard reposition'}
                      </td>
                      <td style={{ fontSize: '0.78rem', fontWeight: 600 }}>
                        {t.vehicle?.registration_number || '—'}
                      </td>
                      <td style={{ fontSize: '0.78rem' }}>
                        {t.driver?.name || '—'}
                      </td>
                      <td>
                        <span className={`badge ${STATUS_BADGE[t.status]}`} style={{ fontSize: '0.65rem' }}>
                          {t.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {t.expected_delivery ? new Date(t.expected_delivery).toLocaleString() : '—'}
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="btn-group">
                          <button className="btn btn-sm btn-secondary" onClick={() => navigate(`/trips/${t.id}`)} title="View Detail">
                            <Eye size={13} />
                          </button>
                          
                          {isManager && t.status === 'DRAFT' && (
                            <button className="btn btn-sm btn-success" onClick={(e) => handleDispatch(t.id, e)} title="Dispatch">
                              <Send size={13} />
                            </button>
                          )}

                          {isManager && (t.status === 'DRAFT' || t.status === 'SCHEDULED' || t.status === 'DISPATCHED' || t.status === 'IN_PROGRESS') && (
                            <button className="btn btn-sm btn-danger" onClick={(e) => handleCancel(t.id, e)} title="Cancel">
                              <XCircle size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </>
  );
}
