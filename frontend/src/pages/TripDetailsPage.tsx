import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import {
  ArrowLeft, Send, CheckCircle, XCircle, Play, Eye, AlertTriangle
} from 'lucide-react';

interface Vehicle { id: string; registration_number: string; max_load_capacity: number; odometer: number; fuel_type: string; }
interface Driver { id: string; name: string; contact_number: string; license_category: string; safety_score: number; status: string; }
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
  remarks: string | null;
  priority: string;
  special_instructions: string | null;

  // Pickup Customer Details
  pickup_customer_name: string | null;
  pickup_company_name: string | null;
  pickup_gst_number: string | null;
  pickup_contact_person: string | null;
  pickup_mobile: string | null;
  pickup_alt_mobile: string | null;
  pickup_email: string | null;
  pickup_street: string | null;
  pickup_area: string | null;
  pickup_city: string | null;
  pickup_state: string | null;
  pickup_country: string | null;
  pickup_pincode: string | null;
  pickup_maps_link: string | null;

  // Delivery Customer Details
  delivery_customer_name: string | null;
  delivery_company_name: string | null;
  delivery_gst_number: string | null;
  delivery_contact_person: string | null;
  delivery_mobile: string | null;
  delivery_alt_mobile: string | null;
  delivery_email: string | null;
  delivery_street: string | null;
  delivery_area: string | null;
  delivery_city: string | null;
  delivery_state: string | null;
  delivery_country: string | null;
  delivery_pincode: string | null;
  delivery_maps_link: string | null;

  // Goods Info
  goods_name: string | null;
  goods_quantity: number | null;
  goods_volume: number | null;
  goods_package_count: number | null;
  is_fragile: boolean;
  is_perishable: boolean;
  is_hazardous: boolean;
  special_handling_notes: string | null;

  // Route Info
  loading_start_time: string | null;
  loading_end_time: string | null;
  departure_time: string | null;
  estimated_duration: number | null;
  stops_count: number;
  route_notes: string | null;

  // Financial details
  driver_allowance: number;
  loading_charges: number;
  unloading_charges: number;
  toll_estimate: number;
  misc_estimate: number;
  expected_revenue: number;

  // Attachments
  invoice_file_path: string | null;
  challan_file_path: string | null;
  eway_bill_file_path: string | null;
  purchase_order_file_path: string | null;
  other_doc_file_path: string | null;

  // Delivery completion
  receiver_name: string | null;
  receiver_mobile: string | null;
  customer_signature_path: string | null;
  start_odometer: number | null;
  final_odometer: number | null;
  actual_distance: number | null;
  fuel_consumed: number | null;
  fuel_cost: number | null;
  createdAt: string;
  final_proof_path: string | null;

  vehicle: Vehicle;
  driver: Driver;
}

const STEPS = ['DRAFT', 'SCHEDULED', 'DISPATCHED', 'IN_PROGRESS', 'COMPLETED'];

export default function TripDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Sub-logs states (for logs matching the vehicle/trip)
  const [fuelLogs, setFuelLogs] = useState<any[]>([]);

  // Completion modal state
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completeSubmitting, setCompleteSubmitting] = useState(false);
  const [completeForm, setCompleteForm] = useState({
    final_odometer: '',
    fuel_consumed: '',
    fuel_cost: '',
    receiver_name: '',
    receiver_mobile: '',
    remarks: ''
  });
  const [completeFile, setCompleteFile] = useState<File | null>(null);
  const [completeError, setCompleteError] = useState('');

  const fetchTripDetails = async () => {
    try {
      const res = await api.get(`/trips/${id}`);
      setTrip(res);

      // Fetch all fuel logs for this vehicle
      const allFuel = await api.get('/fuel');
      setFuelLogs(allFuel.filter((f: any) => f.vehicle_id === res.vehicle_id));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTripDetails();
  }, [id]);

  const handleDispatch = async () => {
    if (!confirm('Are you sure you want to dispatch this run?')) return;
    try {
      await api.put(`/trips/${id}/dispatch`);
      fetchTripDetails();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleLoadingStart = async () => {
    try {
      await api.put(`/trips/${id}/loading/start`);
      fetchTripDetails();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleLoadingEnd = async () => {
    try {
      await api.put(`/trips/${id}/loading/end`);
      fetchTripDetails();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleTransitStart = async () => {
    try {
      await api.put(`/trips/${id}/transit/start`);
      fetchTripDetails();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Cancel this dispatch run?')) return;
    try {
      await api.put(`/trips/${id}/cancel`);
      fetchTripDetails();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCompleteError('');
    
    if (!completeForm.receiver_name) {
      setCompleteError('Receiver Name is required.');
      return;
    }

    const currentOdo = trip?.start_odometer || trip?.vehicle.odometer || 0;
    if (Number(completeForm.final_odometer) < currentOdo) {
      setCompleteError(`Final odometer cannot be less than start odometer (${currentOdo} km).`);
      return;
    }

    setCompleteSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('final_odometer', completeForm.final_odometer);
      formData.append('fuel_consumed', completeForm.fuel_consumed);
      formData.append('fuel_cost', completeForm.fuel_cost);
      formData.append('receiver_name', completeForm.receiver_name);
      formData.append('receiver_mobile', completeForm.receiver_mobile);
      formData.append('remarks', completeForm.remarks);
      if (completeFile) formData.append('proof', completeFile);

      await api.put(`/trips/${id}/complete`, formData);
      setShowCompleteModal(false);
      fetchTripDetails();
    } catch (err: any) {
      setCompleteError(err.message || 'Failed to complete trip');
    } finally {
      setCompleteSubmitting(false);
    }
  };

  if (loading) return <div className="page-content"><p>Loading trip inspector...</p></div>;
  if (!trip) return <div className="page-content"><p>Trip not found.</p></div>;

  const currentStepIndex = STEPS.indexOf(trip.status);

  // Financial operational costs
  const estTotalExpenses = 
    trip.driver_allowance + 
    trip.loading_charges + 
    trip.unloading_charges + 
    trip.toll_estimate + 
    trip.misc_estimate + 
    (trip.fuel_cost || 0);

  const profit = trip.expected_revenue - estTotalExpenses;

  return (
    <div className="page-content animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Top Header details */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/trips')} style={{ padding: '0.4rem' }}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              Trip #{trip.id.substring(0, 8).toUpperCase()}{' '}
              <span className={`badge ${trip.trip_type === 'INTERNAL' ? 'badge-warning' : 'badge-primary'}`} style={{ fontSize: '0.65rem' }}>
                {trip.trip_type}
              </span>
            </h1>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Created on {new Date(trip.createdAt).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Dispatch Controls triggers */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {trip.status === 'DRAFT' && (
            <button className="btn btn-primary" onClick={handleDispatch} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Send size={14} /> Dispatch Run
            </button>
          )}

          {trip.status === 'DISPATCHED' && !trip.loading_start_time && (
            <button className="btn btn-secondary" onClick={handleLoadingStart}>
              ⏳ Start Loading Goods
            </button>
          )}

          {trip.status === 'DISPATCHED' && trip.loading_start_time && !trip.loading_end_time && (
            <button className="btn className=btn-secondary" onClick={handleLoadingEnd} style={{ background: 'var(--warning-light)', color: 'var(--warning)' }}>
              📦 Complete Loading Goods
            </button>
          )}

          {trip.status === 'DISPATCHED' && trip.loading_end_time && (
            <button className="btn btn-primary" onClick={handleTransitStart} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Play size={14} /> Start Transit Out
            </button>
          )}

          {trip.status === 'IN_PROGRESS' && (
            <button className="btn btn-success" onClick={() => {
              setCompleteForm({
                final_odometer: String(trip.vehicle.odometer || ''),
                fuel_consumed: '',
                fuel_cost: '',
                receiver_name: trip.delivery_customer_name || '',
                receiver_mobile: trip.delivery_mobile || '',
                remarks: ''
              });
              setCompleteFile(null);
              setCompleteError('');
              setShowCompleteModal(true);
            }} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle size={14} /> Complete Run
            </button>
          )}

          {trip.status !== 'COMPLETED' && trip.status !== 'CANCELLED' && (
            <button className="btn btn-danger" onClick={handleCancel} title="Cancel trip">
              <XCircle size={14} /> Cancel
            </button>
          )}
        </div>
      </div>

      {/* Stepper Timeline Tracker */}
      {trip.status !== 'CANCELLED' ? (
        <div className="card" style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '12px' }}>
          {STEPS.map((step, idx) => {
            const isCompleted = idx <= currentStepIndex;
            const isActive = idx === currentStepIndex;
            return (
              <React.Fragment key={step}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: isCompleted ? 'var(--primary)' : 'var(--border)',
                    color: isCompleted ? 'white' : 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    border: isActive ? '3px solid var(--primary-light)' : 'none',
                    zIndex: 2
                  }}>
                    {idx + 1}
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: isCompleted ? 700 : 500, color: isCompleted ? 'var(--text)' : 'var(--text-secondary)', marginTop: '4px' }}>
                    {step}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div style={{
                    flex: 1,
                    height: '3px',
                    background: idx < currentStepIndex ? 'var(--primary)' : 'var(--border)',
                    position: 'relative',
                    top: '-10px',
                    zIndex: 1
                  }} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      ) : (
        <div className="card" style={{ padding: '0.75rem 1rem', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '8px' }}>
          <XCircle size={16} /> Trip Dispatch Cancelled
        </div>
      )}

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid var(--border)', gap: '1.25rem' }}>
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'customer', label: 'Route & Customer' },
          { id: 'financials', label: 'Fuel & Expenses' },
          { id: 'timeline', label: 'Timeline Milestones' },
          { id: 'documents', label: 'Verification Docs' },
          { id: 'summary', label: 'Summary Report' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '0.6rem 0',
              fontWeight: activeTab === tab.id ? 700 : 500,
              color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === tab.id ? '3px solid var(--primary)' : 'none',
              background: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              borderTop: 'none',
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div>
        
        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              
              {/* Resources Card */}
              <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: '4px', margin: 0 }}>
                  Assigned Resources
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Vehicle Plate:</span>{' '}
                    <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--primary)', marginTop: '2px' }}>
                      {trip.vehicle.registration_number}
                    </strong>
                  </div>
                  <div style={{ borderTop: '1px dashed var(--border)', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Assigned Driver:</span>
                    <strong style={{ display: 'block', fontSize: '0.85rem', marginTop: '2px' }}>{trip.driver.name}</strong>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Ph: {trip.driver.contact_number}</span>
                  </div>
                </div>
              </div>

              {/* Status Details */}
              <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: '4px', margin: 0 }}>
                  Run Metadata
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
                  <div><span style={{ color: 'var(--text-secondary)' }}>Trip Priority:</span> <span className={`badge ${trip.priority === 'EMERGENCY' ? 'badge-danger' : 'badge-neutral'}`} style={{ marginLeft: '4px' }}>{trip.priority}</span></div>
                  <div><span style={{ color: 'var(--text-secondary)' }}>Target Delivery:</span> <strong>{trip.expected_delivery ? new Date(trip.expected_delivery).toLocaleString() : '—'}</strong></div>
                  <div><span style={{ color: 'var(--text-secondary)' }}>Cargo Loading weight:</span> <strong>{trip.cargo_weight} kg</strong></div>
                  <div><span style={{ color: 'var(--text-secondary)' }}>Odometer Readings:</span> <strong>{trip.start_odometer || '—'} km (Start) → {trip.final_odometer || '—'} km (End)</strong></div>
                </div>
              </div>

            </div>

            {/* Timings log overview */}
            <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: '4px', margin: 0 }}>
                Operations Milestones summary
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.8rem' }}>
                <div><span style={{ color: 'var(--text-secondary)' }}>Loading Started:</span> <strong style={{ display: 'block', marginTop: '2px' }}>{trip.loading_start_time ? new Date(trip.loading_start_time).toLocaleString() : 'Not started'}</strong></div>
                <div><span style={{ color: 'var(--text-secondary)' }}>Loading Ended:</span> <strong style={{ display: 'block', marginTop: '2px' }}>{trip.loading_end_time ? new Date(trip.loading_end_time).toLocaleString() : 'Not completed'}</strong></div>
                <div><span style={{ color: 'var(--text-secondary)' }}>Departure transit:</span> <strong style={{ display: 'block', marginTop: '2px' }}>{trip.departure_time ? new Date(trip.departure_time).toLocaleString() : 'Not dispatched'}</strong></div>
                <div><span style={{ color: 'var(--text-secondary)' }}>Completion:</span> <strong style={{ display: 'block', marginTop: '2px' }}>{trip.end_time ? new Date(trip.end_time).toLocaleString() : 'Not completed'}</strong></div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Route & Customer */}
        {activeTab === 'customer' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Cargo Goods Card */}
            <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: '4px', margin: 0 }}>
                Cargo Specifications
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.8rem' }}>
                <div>
                  <div><span style={{ color: 'var(--text-secondary)' }}>Item description:</span> <strong>{trip.goods_name || '—'}</strong></div>
                  <div><span style={{ color: 'var(--text-secondary)' }}>Weight:</span> <strong>{trip.cargo_weight} kg</strong></div>
                  <div><span style={{ color: 'var(--text-secondary)' }}>Volume:</span> <strong>{trip.goods_volume ? `${trip.goods_volume} m³` : '—'}</strong></div>
                </div>
                <div>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
                    <span className={`badge ${trip.is_fragile ? 'badge-danger' : 'badge-neutral'}`} style={{ fontSize: '0.65rem' }}>Fragile</span>
                    <span className={`badge ${trip.is_perishable ? 'badge-warning' : 'badge-neutral'}`} style={{ fontSize: '0.65rem' }}>Perishable</span>
                    <span className={`badge ${trip.is_hazardous ? 'badge-danger' : 'badge-neutral'}`} style={{ fontSize: '0.65rem' }}>Hazardous</span>
                  </div>
                  <div style={{ marginTop: '0.5rem' }}><span style={{ color: 'var(--text-secondary)' }}>Special handling:</span> <strong style={{ display: 'block', marginTop: '2px' }}>{trip.special_handling_notes || '—'}</strong></div>
                </div>
              </div>
            </div>

            {/* Addresses ledger */}
            {trip.trip_type === 'DELIVERY' ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
                
                {/* Pickup customer */}
                <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.8rem' }}>
                  <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary)', margin: '0 0 4px 0' }}>Pickup Customer Point</h4>
                  <div><span style={{ color: 'var(--text-secondary)' }}>Name:</span> <strong>{trip.pickup_customer_name}</strong></div>
                  {trip.pickup_company_name && <div><span style={{ color: 'var(--text-secondary)' }}>Company:</span> <strong>{trip.pickup_company_name}</strong></div>}
                  {trip.pickup_gst_number && <div><span style={{ color: 'var(--text-secondary)' }}>GSTIN:</span> <strong>{trip.pickup_gst_number}</strong></div>}
                  <div><span style={{ color: 'var(--text-secondary)' }}>Phone:</span> <strong>{trip.pickup_mobile}</strong></div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Address:</span>
                    <strong style={{ display: 'block', marginTop: '2px', color: 'var(--text)' }}>
                      {trip.pickup_street}, {trip.pickup_area}, {trip.pickup_city}, {trip.pickup_state} - {trip.pickup_pincode}
                    </strong>
                  </div>
                </div>

                {/* Delivery customer */}
                <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.8rem' }}>
                  <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary)', margin: '0 0 4px 0' }}>Delivery Customer Point</h4>
                  <div><span style={{ color: 'var(--text-secondary)' }}>Receiver Name:</span> <strong>{trip.delivery_customer_name}</strong></div>
                  {trip.delivery_company_name && <div><span style={{ color: 'var(--text-secondary)' }}>Company:</span> <strong>{trip.delivery_company_name}</strong></div>}
                  {trip.delivery_gst_number && <div><span style={{ color: 'var(--text-secondary)' }}>GSTIN:</span> <strong>{trip.delivery_gst_number}</strong></div>}
                  <div><span style={{ color: 'var(--text-secondary)' }}>Receiver Phone:</span> <strong>{trip.delivery_mobile}</strong></div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Address:</span>
                    <strong style={{ display: 'block', marginTop: '2px', color: 'var(--text)' }}>
                      {trip.delivery_street}, {trip.delivery_area}, {trip.delivery_city}, {trip.delivery_state} - {trip.delivery_pincode}
                    </strong>
                  </div>
                </div>

              </div>
            ) : (
              <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, margin: 0 }}>Yard Movement Parameters</h4>
                <div><span style={{ color: 'var(--text-secondary)' }}>Reason:</span> <strong>{trip.reason}</strong></div>
                <div><span style={{ color: 'var(--text-secondary)' }}>Source Terminal:</span> <strong>{trip.source}</strong></div>
                <div><span style={{ color: 'var(--text-secondary)' }}>Destination terminal:</span> <strong>{trip.destination}</strong></div>
                <div><span style={{ color: 'var(--text-secondary)' }}>Remarks:</span> <strong>{trip.remarks || '—'}</strong></div>
              </div>
            )}

          </div>
        )}

        {/* Tab 3: Fuel & Expenses */}
        {activeTab === 'financials' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Costs calculation panel */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
              <div className="card" style={{ padding: '1rem' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 500 }}>ESTIMATED EXPENSES</div>
                <strong style={{ fontSize: '1.2rem', color: 'var(--text)', display: 'block', marginTop: '4px' }}>
                  ₹{(estTotalExpenses - (trip.fuel_cost || 0)).toLocaleString()}
                </strong>
              </div>
              <div className="card" style={{ padding: '1rem' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 500 }}>ACTUAL FUEL COST LOGGED</div>
                <strong style={{ fontSize: '1.2rem', color: 'var(--warning)', display: 'block', marginTop: '4px' }}>
                  ₹{(trip.fuel_cost || 0).toLocaleString()}
                </strong>
              </div>
              <div className="card" style={{ padding: '1rem' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 500 }}>EXPECTED REVENUE</div>
                <strong style={{ fontSize: '1.2rem', color: 'var(--secondary)', display: 'block', marginTop: '4px' }}>
                  ₹{trip.expected_revenue.toLocaleString()}
                </strong>
              </div>
            </div>

            {/* Fuel Logs list */}
            <div className="card" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: '4px', margin: '0 0 0.5rem 0' }}>
                Fuel Refilling logs for vehicle during trip
              </h3>
              {fuelLogs.length === 0 ? (
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>No fuel refilling entries found for this run.</p>
              ) : (
                <div className="table-wrapper" style={{ padding: 0, border: 'none', boxShadow: 'none' }}>
                  <table style={{ minWidth: '100%' }}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Station</th>
                        <th>Liters</th>
                        <th>Cost (₹)</th>
                        <th>Odometer</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fuelLogs.map((f: any) => (
                        <tr key={f.id}>
                          <td>{new Date(f.date).toLocaleDateString()}</td>
                          <td>{f.fuel_station}</td>
                          <td>{f.liters} L</td>
                          <td>₹{f.cost.toLocaleString()}</td>
                          <td>{f.odometer || '—'} km</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

        {/* Tab 4: Timeline */}
        {activeTab === 'timeline' && (
          <div className="card" style={{ padding: '1.5rem 1.25rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1.25rem', margin: 0 }}>
              Chronological Dispatch Audit Logs
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative', paddingLeft: '1.5rem', borderLeft: '2px solid var(--border)' }}>
              
              {/* Created */}
              <div style={{ position: 'relative' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary)', position: 'absolute', left: '-29px', top: '4px' }}></span>
                <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>Trip Request Created</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{new Date(trip.createdAt).toLocaleString()}</div>
              </div>

              {/* Dispatched */}
              {trip.start_time && (
                <div style={{ position: 'relative' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary)', position: 'absolute', left: '-29px', top: '4px' }}></span>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>Trip Dispatched & Locked</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{new Date(trip.start_time).toLocaleString()}</div>
                </div>
              )}

              {/* Loading Start */}
              {trip.loading_start_time && (
                <div style={{ position: 'relative' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary)', position: 'absolute', left: '-29px', top: '4px' }}></span>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>Loading Cargo Initiated</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{new Date(trip.loading_start_time).toLocaleString()}</div>
                </div>
              )}

              {/* Loading End */}
              {trip.loading_end_time && (
                <div style={{ position: 'relative' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary)', position: 'absolute', left: '-29px', top: '4px' }}></span>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>Loading Cargo Completed & sealed</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{new Date(trip.loading_end_time).toLocaleString()}</div>
                </div>
              )}

              {/* Departure */}
              {trip.departure_time && (
                <div style={{ position: 'relative' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary)', position: 'absolute', left: '-29px', top: '4px' }}></span>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>Departed Origin Terminal (In Transit)</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{new Date(trip.departure_time).toLocaleString()}</div>
                </div>
              )}

              {/* Completed */}
              {trip.end_time && (
                <div style={{ position: 'relative' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--success)', position: 'absolute', left: '-29px', top: '4px' }}></span>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--success)' }}>Delivery Completed & Signed Off</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{new Date(trip.end_time).toLocaleString()}</div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* Tab 5: Documents */}
        {activeTab === 'documents' && (
          <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: '4px', margin: 0 }}>
              Dispatch Attachments Ledger
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {[
                { name: 'Customer Invoice', path: trip.invoice_file_path },
                { name: 'Delivery Challan', path: trip.challan_file_path },
                { name: 'E-Way Bill document', path: trip.eway_bill_file_path },
                { name: 'Purchase Order (PO)', path: trip.purchase_order_file_path },
                { name: 'Customer Signature / POD Proof', path: trip.customer_signature_path || trip.final_proof_path }
              ].map((doc, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', padding: '0.5rem 0', borderBottom: '1px solid #F1F5F9' }}>
                  <strong>{doc.name}</strong>
                  {doc.path ? (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <a 
                        href={`http://localhost:5000/${doc.path}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '0.3rem 0.6rem' }}
                      >
                        <Eye size={12} /> View File
                      </a>
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Missing</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 6: Summary */}
        {activeTab === 'summary' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
              
              <div className="card" style={{ padding: '1rem' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>ACTUAL DISTANCE TRAVELED</div>
                <strong style={{ fontSize: '1.2rem', marginTop: '4px', display: 'block' }}>
                  {trip.actual_distance ? `${trip.actual_distance} km` : '—'}
                </strong>
              </div>

              <div className="card" style={{ padding: '1rem' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>TOTAL REVENUE</div>
                <strong style={{ fontSize: '1.2rem', color: 'var(--secondary)', marginTop: '4px', display: 'block' }}>
                  ₹{trip.expected_revenue.toLocaleString()}
                </strong>
              </div>

              <div className="card" style={{ padding: '1rem' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>TOTAL EXPENSES</div>
                <strong style={{ fontSize: '1.2rem', color: 'var(--danger)', marginTop: '4px', display: 'block' }}>
                  ₹{estTotalExpenses.toLocaleString()}
                </strong>
              </div>

              <div className="card" style={{ padding: '1rem', background: profit >= 0 ? 'var(--success-light)' : 'var(--danger-light)' }}>
                <div style={{ fontSize: '0.72rem', color: profit >= 0 ? '#065F46' : '#991B1B' }}>NET PROFIT</div>
                <strong style={{ fontSize: '1.2rem', color: profit >= 0 ? 'var(--success)' : 'var(--danger)', marginTop: '4px', display: 'block' }}>
                  ₹{profit.toLocaleString()}
                </strong>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* COMPLETE TRIP MODAL */}
      {showCompleteModal && (
        <div className="modal-overlay" onClick={() => setShowCompleteModal(false)}>
          <div className="modal" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Complete Dispatch Run</h2>
              <button className="modal-close" onClick={() => setShowCompleteModal(false)}><XCircle size={16} /></button>
            </div>

            {completeError && (
              <div className="card" style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '0.5rem 0.75rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '0.75rem' }}>
                <AlertTriangle size={14} /> {completeError}
              </div>
            )}

            <form onSubmit={handleCompleteSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              
              <div className="form-group">
                <label className="form-label">Final Odometer Reading (km) *</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={completeForm.final_odometer} 
                  onChange={e => setCompleteForm({ ...completeForm, final_odometer: e.target.value })} 
                  required 
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                  Must be greater than start odometer: <strong>{trip.start_odometer || trip.vehicle.odometer} km</strong>
                </span>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Total Fuel Liters Refilled</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="e.g. 45" 
                    value={completeForm.fuel_consumed} 
                    onChange={e => setCompleteForm({ ...completeForm, fuel_consumed: e.target.value })} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Total Fuel Cost (₹)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="e.g. 4200" 
                    value={completeForm.fuel_cost} 
                    onChange={e => setCompleteForm({ ...completeForm, fuel_cost: e.target.value })} 
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Customer Receiver Name *</label>
                  <input 
                    className="form-input" 
                    value={completeForm.receiver_name} 
                    onChange={e => setCompleteForm({ ...completeForm, receiver_name: e.target.value })} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Receiver Contact Phone</label>
                  <input 
                    className="form-input" 
                    value={completeForm.receiver_mobile} 
                    onChange={e => setCompleteForm({ ...completeForm, receiver_mobile: e.target.value })} 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Upload Customer Signature / POD image</label>
                <input 
                  type="file" 
                  className="form-input" 
                  accept="image/*,.pdf" 
                  onChange={e => setCompleteFile(e.target.files?.[0] || null)} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Driver Remarks</label>
                <textarea 
                  className="form-input" 
                  rows={2} 
                  value={completeForm.remarks} 
                  onChange={e => setCompleteForm({ ...completeForm, remarks: e.target.value })} 
                />
              </div>

              <div className="modal-actions" style={{ marginTop: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCompleteModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-success" disabled={completeSubmitting}>
                  {completeSubmitting ? 'Submitting...' : 'Mark Completed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
