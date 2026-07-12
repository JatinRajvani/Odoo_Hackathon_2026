import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Eye, Edit, Trash2, Search, FileText, AlertCircle } from 'lucide-react';

interface Vehicle {
  id: string;
  registration_number: string;
  name_model: string;
  manufacturer: string;
  type: string;
  fuel_type: string;
  acquisition_date: string | null;
  acquisition_cost: number;
  odometer: number;
  max_load_capacity: number;
  status: string;
  insurance_expiry_date: string | null;
  assigned_driver: string;
  current_trip: string;
  rc_number: string;
  rc_file_path: string;
  insurance_company: string | null;
  insurance_policy_num: string | null;
  insurance_type: string | null;
  insurance_start_date: string | null;
  insurance_file_path: string;
  puc_number: string | null;
  puc_expiry_date: string | null;
  puc_file_path: string;
  permit_number: string | null;
  permit_expiry_date: string | null;
  permit_file_path: string | null;
  description: string | null;
  internal_remarks: string | null;
}

const STATUS_BADGE: Record<string, string> = {
  AVAILABLE: 'badge-success',
  ON_TRIP: 'badge-info',
  IN_SHOP: 'badge-warning',
  RETIRED: 'badge-neutral',
};

const FORM_SECTIONS = [
  { id: 'basic', label: 'Basic Information' },
  { id: 'docs', label: 'Documents' },
  { id: 'status', label: 'Vehicle Status' },
  { id: 'notes', label: 'Additional Notes' }
];

export default function VehiclesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal control
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editId, setEditId] = useState<string | null>(null);
  const [activeFormTab, setActiveFormTab] = useState('basic');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [form, setForm] = useState({
    registration_number: '',
    name_model: '',
    manufacturer: '',
    type: 'Truck',
    fuel_type: 'Diesel',
    acquisition_date: '',
    acquisition_cost: '',
    odometer: '',
    max_load_capacity: '',
    rc_number: '',
    insurance_company: '',
    insurance_policy_num: '',
    insurance_type: 'Comprehensive',
    insurance_start_date: '',
    insurance_expiry_date: '',
    puc_number: '',
    puc_expiry_date: '',
    permit_number: '',
    permit_expiry_date: '',
    status: 'AVAILABLE',
    description: '',
    internal_remarks: '',
  });

  // File Upload State
  const [rcFile, setRcFile] = useState<File | null>(null);
  const [insuranceFile, setInsuranceFile] = useState<File | null>(null);
  const [pucFile, setPucFile] = useState<File | null>(null);
  const [permitFile, setPermitFile] = useState<File | null>(null);

  const fetchVehicles = () => {
    setLoading(true);
    // Build query params
    const queryParts = [];
    if (search) queryParts.push(`search=${encodeURIComponent(search)}`);
    if (typeFilter) queryParts.push(`type=${encodeURIComponent(typeFilter)}`);
    if (statusFilter) queryParts.push(`status=${encodeURIComponent(statusFilter)}`);
    
    const query = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    
    api.get(`/vehicles${query}`)
      .then(setVehicles)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchVehicles();
  }, [search, typeFilter, statusFilter]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditId(null);
    setForm({
      registration_number: '',
      name_model: '',
      manufacturer: '',
      type: 'Truck',
      fuel_type: 'Diesel',
      acquisition_date: '',
      acquisition_cost: '',
      odometer: '',
      max_load_capacity: '',
      rc_number: '',
      insurance_company: '',
      insurance_policy_num: '',
      insurance_type: 'Comprehensive',
      insurance_start_date: '',
      insurance_expiry_date: '',
      puc_number: '',
      puc_expiry_date: '',
      permit_number: '',
      permit_expiry_date: '',
      status: 'AVAILABLE',
      description: '',
      internal_remarks: '',
    });
    setRcFile(null);
    setInsuranceFile(null);
    setPucFile(null);
    setPermitFile(null);
    setActiveFormTab('basic');
    setError('');
    setShowModal(true);
  };

  const handleOpenEdit = (vehicle: Vehicle) => {
    setModalMode('edit');
    setEditId(vehicle.id);
    setForm({
      registration_number: vehicle.registration_number,
      name_model: vehicle.name_model,
      manufacturer: vehicle.manufacturer,
      type: vehicle.type,
      fuel_type: vehicle.fuel_type,
      acquisition_date: vehicle.acquisition_date ? vehicle.acquisition_date.split('T')[0] : '',
      acquisition_cost: vehicle.acquisition_cost.toString(),
      odometer: vehicle.odometer.toString(),
      max_load_capacity: vehicle.max_load_capacity.toString(),
      rc_number: vehicle.rc_number || '',
      insurance_company: vehicle.insurance_company || '',
      insurance_policy_num: vehicle.insurance_policy_num || '',
      insurance_type: vehicle.insurance_type || 'Comprehensive',
      insurance_start_date: vehicle.insurance_start_date ? vehicle.insurance_start_date.split('T')[0] : '',
      insurance_expiry_date: vehicle.insurance_expiry_date ? vehicle.insurance_expiry_date.split('T')[0] : '',
      puc_number: vehicle.puc_number || '',
      puc_expiry_date: vehicle.puc_expiry_date ? vehicle.puc_expiry_date.split('T')[0] : '',
      permit_number: vehicle.permit_number || '',
      permit_expiry_date: vehicle.permit_expiry_date ? vehicle.permit_expiry_date.split('T')[0] : '',
      status: vehicle.status,
      description: vehicle.description || '',
      internal_remarks: vehicle.internal_remarks || '',
    });
    setRcFile(null);
    setInsuranceFile(null);
    setPucFile(null);
    setPermitFile(null);
    setActiveFormTab('basic');
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    // Pre-validations for create mode
    if (modalMode === 'create') {
      if (!rcFile) {
        setError('Registration Certificate (RC) upload is mandatory.');
        setActiveFormTab('docs');
        setSubmitting(false);
        return;
      }
      if (!insuranceFile) {
        setError('Insurance policy copy upload is mandatory.');
        setActiveFormTab('docs');
        setSubmitting(false);
        return;
      }
      if (!pucFile) {
        setError('PUC certificate upload is mandatory.');
        setActiveFormTab('docs');
        setSubmitting(false);
        return;
      }
    }

    try {
      const formData = new FormData();
      // Append all textual keys
      Object.entries(form).forEach(([key, val]) => {
        formData.append(key, val);
      });

      // Append files
      if (rcFile) formData.append('rc_file', rcFile);
      if (insuranceFile) formData.append('insurance_file', insuranceFile);
      if (pucFile) formData.append('puc_file', pucFile);
      if (permitFile) formData.append('permit_file', permitFile);

      if (modalMode === 'create') {
        await api.post('/vehicles', formData);
      } else {
        await api.put(`/vehicles/${editId}`, formData);
      }

      setShowModal(false);
      fetchVehicles();
    } catch (err: any) {
      setError(err.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, reg: string) => {
    if (!window.confirm(`Are you sure you want to completely delete vehicle ${reg}? This will remove all its logs and trips.`)) return;
    try {
      await api.delete(`/vehicles/${id}`);
      fetchVehicles();
    } catch (err: any) {
      alert(err.message || 'Deletion failed');
    }
  };

  const isManager = user?.role === 'FLEET_MANAGER';

  return (
    <>
      <div className="topbar">
        <h1>Vehicle Management</h1>
      </div>
      <div className="page-content">
        
        {/* Top filter section */}
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
              <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} size={16} />
              <input 
                type="text" 
                className="form-input" 
                placeholder="Search by registration number, model, manufacturer..." 
                style={{ paddingLeft: '36px' }}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            
            <div style={{ width: '180px' }}>
              <select className="form-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                <option value="">All Vehicle Types</option>
                <option value="Truck">Truck</option>
                <option value="Van">Van</option>
                <option value="Bus">Bus</option>
                <option value="Car">Car</option>
              </select>
            </div>

            <div style={{ width: '180px' }}>
              <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="AVAILABLE">Available</option>
                <option value="ON_TRIP">On Trip</option>
                <option value="IN_SHOP">In Shop</option>
                <option value="RETIRED">Retired</option>
              </select>
            </div>

            {isManager && (
              <button className="btn btn-primary" onClick={handleOpenCreate} style={{ marginLeft: 'auto' }}>
                <Plus size={16} /> Add Vehicle
              </button>
            )}
          </div>
        </div>

        {/* Vehicle table */}
        {loading ? <p>Loading vehicles...</p> : (
          <div className="table-wrapper animate-in">
            <table>
              <thead>
                <tr>
                  <th>Reg. Number</th>
                  <th>Manufacturer & Model</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Assigned Driver</th>
                  <th>Current Odometer</th>
                  <th>Insurance Expiry</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="empty-state">
                        <p>No vehicles registered in fleet inventory.</p>
                      </div>
                    </td>
                  </tr>
                ) : vehicles.map(v => (
                  <tr key={v.id}>
                    <td>
                      <strong style={{ color: 'var(--primary)', cursor: 'pointer' }} onClick={() => navigate(`/vehicles/${v.id}`)}>
                        {v.registration_number}
                      </strong>
                    </td>
                    <td>
                      <div><strong>{v.manufacturer}</strong></div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{v.name_model}</div>
                    </td>
                    <td>{v.type}</td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[v.status] || 'badge-neutral'}`}>
                        {v.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td>{v.assigned_driver}</td>
                    <td>{v.odometer.toLocaleString()} km</td>
                    <td>{v.insurance_expiry_date ? new Date(v.insurance_expiry_date).toLocaleDateString() : '—'}</td>
                    <td>
                      <div className="btn-group" style={{ justifyContent: 'center' }}>
                        <button className="btn btn-sm btn-secondary" onClick={() => navigate(`/vehicles/${v.id}`)} title="View Detail Dashboard">
                          <Eye size={14} />
                        </button>
                        {isManager && (
                          <>
                            <button className="btn btn-sm btn-warning" onClick={() => handleOpenEdit(v)} title="Edit Vehicle">
                              <Edit size={14} />
                            </button>
                            <button className="btn btn-sm btn-danger" onClick={() => handleDelete(v.id, v.registration_number)} title="Delete Vehicle">
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" style={{ maxWidth: '650px', width: '95%' }} onClick={e => e.stopPropagation()}>
              <div className="modal-header" style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                <h2>{modalMode === 'create' ? 'Add New Vehicle' : 'Edit Vehicle Details'}</h2>
                <button className="modal-close" onClick={() => setShowModal(false)}><X size={16} /></button>
              </div>

              {/* Form Navigation Tabs inside modal */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', margin: '1rem 0' }}>
                {FORM_SECTIONS.map(sec => (
                  <button
                    key={sec.id}
                    type="button"
                    style={{
                      padding: '0.5rem 1rem',
                      border: 'none',
                      background: 'none',
                      borderBottom: activeFormTab === sec.id ? '2px solid var(--primary)' : 'none',
                      color: activeFormTab === sec.id ? 'var(--primary)' : 'var(--text-secondary)',
                      fontWeight: activeFormTab === sec.id ? 600 : 500,
                      cursor: 'pointer'
                    }}
                    onClick={() => setActiveFormTab(sec.id)}
                  >
                    {sec.label}
                  </button>
                ))}
              </div>

              {error && (
                <div className="card" style={{ background: 'var(--danger-light)', color: '#991B1B', border: '1px solid #FCA5A5', padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <AlertCircle size={16} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                
                {/* TAB 1: Basic Info */}
                {activeFormTab === 'basic' && (
                  <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Registration Number *</label>
                        <input className="form-input" placeholder="e.g. MH-12-AB-1234" value={form.registration_number} onChange={e => setForm({ ...form, registration_number: e.target.value })} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Model Name *</label>
                        <input className="form-input" placeholder="e.g. FH16" value={form.name_model} onChange={e => setForm({ ...form, name_model: e.target.value })} required />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Manufacturer / Company *</label>
                        <input className="form-input" placeholder="e.g. Volvo" value={form.manufacturer} onChange={e => setForm({ ...form, manufacturer: e.target.value })} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Vehicle Type</label>
                        <select className="form-select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                          <option>Truck</option>
                          <option>Van</option>
                          <option>Bus</option>
                          <option>Car</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Fuel Type</label>
                        <select className="form-select" value={form.fuel_type} onChange={e => setForm({ ...form, fuel_type: e.target.value })}>
                          <option>Petrol</option>
                          <option>Diesel</option>
                          <option>CNG</option>
                          <option>Electric</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Acquisition Date</label>
                        <input className="form-input" type="date" value={form.acquisition_date} onChange={e => setForm({ ...form, acquisition_date: e.target.value })} />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Acquisition Cost ($) *</label>
                        <input className="form-input" type="number" placeholder="Acquisition Price" value={form.acquisition_cost} onChange={e => setForm({ ...form, acquisition_cost: e.target.value })} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Current Odometer (km) *</label>
                        <input className="form-input" type="number" placeholder="Starting odometer reading" value={form.odometer} onChange={e => setForm({ ...form, odometer: e.target.value })} required disabled={modalMode === 'edit'} />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Maximum Load Capacity (kg) *</label>
                      <input className="form-input" type="number" placeholder="e.g. 15000" value={form.max_load_capacity} onChange={e => setForm({ ...form, max_load_capacity: e.target.value })} required />
                    </div>
                  </div>
                )}

                {/* TAB 2: Documents */}
                {activeFormTab === 'docs' && (
                  <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '4px' }}>
                    
                    {/* RC Details */}
                    <div style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem' }}>
                      <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.9rem', color: 'var(--primary)' }}>
                        <FileText size={16} /> Registration Certificate (RC)
                      </h4>
                      <div className="form-row">
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">RC Number *</label>
                          <input className="form-input" placeholder="RC Number" value={form.rc_number} onChange={e => setForm({ ...form, rc_number: e.target.value })} required />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">RC PDF/Image Upload {modalMode === 'create' && '*'}</label>
                          <input type="file" className="form-input" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setRcFile(e.target.files?.[0] || null)} required={modalMode === 'create'} />
                        </div>
                      </div>
                    </div>

                    {/* Insurance Details */}
                    <div style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem' }}>
                      <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.9rem', color: 'var(--primary)' }}>
                        <FileText size={16} /> Insurance Policy Details
                      </h4>
                      <div className="form-row" style={{ marginBottom: '0.75rem' }}>
                        <div className="form-group">
                          <label className="form-label">Insurance Company</label>
                          <input className="form-input" placeholder="Company Name" value={form.insurance_company} onChange={e => setForm({ ...form, insurance_company: e.target.value })} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Policy Number</label>
                          <input className="form-input" placeholder="Policy Number" value={form.insurance_policy_num} onChange={e => setForm({ ...form, insurance_policy_num: e.target.value })} />
                        </div>
                      </div>
                      <div className="form-row" style={{ marginBottom: '0.75rem' }}>
                        <div className="form-group">
                          <label className="form-label">Insurance Type</label>
                          <select className="form-select" value={form.insurance_type} onChange={e => setForm({ ...form, insurance_type: e.target.value })}>
                            <option>Third Party</option>
                            <option>Comprehensive</option>
                            <option>Own Damage</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Insurance Policy PDF {modalMode === 'create' && '*'}</label>
                          <input type="file" className="form-input" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setInsuranceFile(e.target.files?.[0] || null)} required={modalMode === 'create'} />
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Start Date</label>
                          <input className="form-input" type="date" value={form.insurance_start_date} onChange={e => setForm({ ...form, insurance_start_date: e.target.value })} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Expiry Date</label>
                          <input className="form-input" type="date" value={form.insurance_expiry_date} onChange={e => setForm({ ...form, insurance_expiry_date: e.target.value })} />
                        </div>
                      </div>
                    </div>

                    {/* PUC Details */}
                    <div style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem' }}>
                      <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.9rem', color: 'var(--primary)' }}>
                        <FileText size={16} /> PUC (Pollution Check) Details
                      </h4>
                      <div className="form-row">
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">PUC Number</label>
                          <input className="form-input" placeholder="PUC Number" value={form.puc_number} onChange={e => setForm({ ...form, puc_number: e.target.value })} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Expiry Date</label>
                          <input className="form-input" type="date" value={form.puc_expiry_date} onChange={e => setForm({ ...form, puc_expiry_date: e.target.value })} />
                        </div>
                      </div>
                      <div className="form-group" style={{ marginTop: '0.75rem', marginBottom: 0 }}>
                        <label className="form-label">PUC Certificate PDF/Image {modalMode === 'create' && '*'}</label>
                        <input type="file" className="form-input" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setPucFile(e.target.files?.[0] || null)} required={modalMode === 'create'} />
                      </div>
                    </div>

                    {/* Permit Details */}
                    <div style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem', background: '#F8FAFC' }}>
                      <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text)' }}>
                        <FileText size={16} /> National / State Permit (Optional)
                      </h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <AlertCircle size={14} style={{ color: 'var(--accent)' }} /> 
                        Permit can be uploaded later after vehicle registration.
                      </p>
                      <div className="form-row">
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Permit Number</label>
                          <input className="form-input" placeholder="Permit Number" value={form.permit_number} onChange={e => setForm({ ...form, permit_number: e.target.value })} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Expiry Date</label>
                          <input className="form-input" type="date" value={form.permit_expiry_date} onChange={e => setForm({ ...form, permit_expiry_date: e.target.value })} />
                        </div>
                      </div>
                      <div className="form-group" style={{ marginTop: '0.75rem', marginBottom: 0 }}>
                        <label className="form-label">Permit Document PDF/Image</label>
                        <input type="file" className="form-input" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setPermitFile(e.target.files?.[0] || null)} />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: Vehicle Status */}
                {activeFormTab === 'status' && (
                  <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Status</label>
                      <select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                        <option value="AVAILABLE">Available</option>
                        <option value="ON_TRIP">On Trip</option>
                        <option value="IN_SHOP">In Shop</option>
                        <option value="RETIRED">Retired</option>
                      </select>
                      <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Note: Active maintenance automatically flags vehicles as "In Shop". Completed trips return vehicle status back to "Available".
                      </p>
                    </div>
                  </div>
                )}

                {/* TAB 4: Additional Notes */}
                {activeFormTab === 'notes' && (
                  <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Vehicle Description</label>
                      <textarea className="form-input" style={{ minHeight: '80px', fontFamily: 'inherit' }} placeholder="Provide general details about the vehicle..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}></textarea>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Internal Remarks (ERP Private)</label>
                      <textarea className="form-input" style={{ minHeight: '80px', fontFamily: 'inherit' }} placeholder="Private comments for fleet managers only..." value={form.internal_remarks} onChange={e => setForm({ ...form, internal_remarks: e.target.value })}></textarea>
                    </div>
                  </div>
                )}

                <div className="modal-actions" style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Saving...' : modalMode === 'create' ? 'Register Vehicle' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
