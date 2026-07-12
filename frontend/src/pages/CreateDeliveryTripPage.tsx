import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Truck, ArrowLeft, Save, AlertTriangle, FileText } from 'lucide-react';

interface Vehicle {
  id: string;
  registration_number: string;
  max_load_capacity: number;
  odometer: number;
  fuel_type: string;
  status: string;
}

interface Driver {
  id: string;
  name: string;
  license_category: string;
  license_expiry_date: string;
  safety_score: number;
  status: string;
}

export default function CreateDeliveryTripPage() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Selected resources details
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

  // Form Fields
  const [form, setForm] = useState({
    source: '',
    destination: '',
    cargo_weight: '',
    planned_distance: '',
    priority: 'MEDIUM',
    expected_delivery: '',
    special_instructions: '',
    remarks: '',

    // Pickup Customer
    pickup_customer_name: '',
    pickup_company_name: '',
    pickup_gst_number: '',
    pickup_contact_person: '',
    pickup_mobile: '',
    pickup_alt_mobile: '',
    pickup_email: '',
    pickup_street: '',
    pickup_area: '',
    pickup_city: '',
    pickup_state: '',
    pickup_country: 'India',
    pickup_pincode: '',
    pickup_maps_link: '',

    // Delivery Customer
    delivery_customer_name: '',
    delivery_company_name: '',
    delivery_gst_number: '',
    delivery_contact_person: '',
    delivery_mobile: '',
    delivery_alt_mobile: '',
    delivery_email: '',
    delivery_street: '',
    delivery_area: '',
    delivery_city: '',
    delivery_state: '',
    delivery_country: 'India',
    delivery_pincode: '',
    delivery_maps_link: '',

    // Goods
    goods_name: '',
    goods_quantity: '',
    goods_volume: '',
    goods_package_count: '',
    is_fragile: false,
    is_perishable: false,
    is_hazardous: false,
    special_handling_notes: '',

    // Route
    estimated_duration: '',
    stops_count: '0',
    route_notes: '',

    // Financial
    driver_allowance: '0',
    loading_charges: '0',
    unloading_charges: '0',
    toll_estimate: '0',
    misc_estimate: '0',
    expected_revenue: '0',
  });

  // Attachments
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [challanFile, setChallanFile] = useState<File | null>(null);
  const [ewayFile, setEwayFile] = useState<File | null>(null);
  const [poFile, setPoFile] = useState<File | null>(null);
  const [otherFile, setOtherFile] = useState<File | null>(null);

  useEffect(() => {
    Promise.all([api.get('/vehicles'), api.get('/drivers')])
      .then(([vRes, dRes]) => {
        setVehicles(vRes);
        setDrivers(dRes);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleVehicleChange = (vehicleId: string) => {
    const v = vehicles.find((x) => x.id === vehicleId) || null;
    setSelectedVehicle(v);
  };

  const handleDriverChange = (driverId: string) => {
    const d = drivers.find((x) => x.id === driverId) || null;
    setSelectedDriver(d);
  };

  const checkLicenseExpiry = (expiryStr: string) => {
    const exp = new Date(expiryStr);
    return exp < new Date();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedVehicle) {
      setErrorMsg('Please select a vehicle.');
      return;
    }
    if (!selectedDriver) {
      setErrorMsg('Please select a driver.');
      return;
    }

    // Capacity validation
    const weight = Number(form.cargo_weight) || 0;
    if (weight > selectedVehicle.max_load_capacity) {
      setErrorMsg(`Validation Error: Cargo weight (${weight} kg) exceeds maximum capacity of vehicle (${selectedVehicle.max_load_capacity} kg).`);
      return;
    }

    // Driver eligibility validations
    if (selectedDriver.status !== 'AVAILABLE') {
      setErrorMsg(`Validation Error: Selected driver is currently ${selectedDriver.status} (Must be Available).`);
      return;
    }
    if (checkLicenseExpiry(selectedDriver.license_expiry_date)) {
      setErrorMsg('Validation Error: Selected driver has an expired license.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('trip_type', 'DELIVERY');

      // Append all form texts/numbers
      Object.entries(form).forEach(([key, val]) => {
        formData.append(key, String(val));
      });

      formData.append('vehicle_id', selectedVehicle.id);
      formData.append('driver_id', selectedDriver.id);

      // Append files
      if (invoiceFile) formData.append('invoice', invoiceFile);
      if (challanFile) formData.append('challan', challanFile);
      if (ewayFile) formData.append('eway_bill', ewayFile);
      if (poFile) formData.append('purchase_order', poFile);
      if (otherFile) formData.append('other_documents', otherFile);

      await api.post('/trips', formData);
      navigate('/trips');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create trip');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="page-content"><p>Loading form assets...</p></div>;

  const availableVehicles = vehicles.filter((v) => v.status === 'AVAILABLE');
  const availableDrivers = drivers.filter(
    (d) => d.status === 'AVAILABLE' && !checkLicenseExpiry(d.license_expiry_date)
  );

  return (
    <div className="page-content animate-in" style={{ maxWidth: '960px', margin: '0 auto' }}>
      
      {/* Header section */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/trips')} style={{ padding: '0.4rem' }}>
            <ArrowLeft size={16} />
          </button>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
            <Truck size={20} style={{ color: 'var(--primary)' }} /> Dispatch New Delivery Trip
          </h1>
        </div>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Save size={16} /> {submitting ? 'Dispatching...' : 'Dispatch Trip'}
        </button>
      </div>

      {errorMsg && (
        <div className="card" style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <AlertTriangle size={16} />
          <strong>{errorMsg}</strong>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Section 1: General Info */}
        <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.4rem' }}>
            1. Trip & Scheduling Details
          </h3>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Dispatch Origin / Pickup Source *</label>
              <input 
                className="form-input" 
                placeholder="e.g. Mumbai Yard Terminal" 
                value={form.source} 
                onChange={(e) => setForm({ ...form, source: e.target.value })} 
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Delivery Destination address *</label>
              <input 
                className="form-input" 
                placeholder="e.g. Pune Central Depot" 
                value={form.destination} 
                onChange={(e) => setForm({ ...form, destination: e.target.value })} 
                required 
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Planned Distance (km) *</label>
              <input 
                type="number" 
                className="form-input" 
                placeholder="e.g. 180" 
                value={form.planned_distance} 
                onChange={(e) => setForm({ ...form, planned_distance: e.target.value })} 
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Expected Delivery Date & Time *</label>
              <input 
                type="datetime-local" 
                className="form-input" 
                value={form.expected_delivery} 
                onChange={(e) => setForm({ ...form, expected_delivery: e.target.value })} 
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Priority Level</label>
              <select 
                className="form-input" 
                value={form.priority} 
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                <option value="LOW">Low Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="HIGH">High Priority</option>
                <option value="EMERGENCY">Emergency (High Alert)</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Special Instructions</label>
            <textarea 
              className="form-input" 
              placeholder="e.g. Deliver before sunset, fragile glass containers..." 
              value={form.special_instructions} 
              onChange={(e) => setForm({ ...form, special_instructions: e.target.value })} 
            />
          </div>
        </div>

        {/* Section 2 & 3: Customers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          
          {/* Pickup Customer */}
          <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.4rem' }}>
              2. Pickup Customer Details
            </h3>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Customer / Contact Name *</label>
                <input 
                  className="form-input" 
                  value={form.pickup_customer_name} 
                  onChange={(e) => setForm({ ...form, pickup_customer_name: e.target.value })} 
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Company Name</label>
                <input 
                  className="form-input" 
                  value={form.pickup_company_name} 
                  onChange={(e) => setForm({ ...form, pickup_company_name: e.target.value })} 
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">GSTIN Number</label>
                <input 
                  className="form-input" 
                  placeholder="e.g. 27AAAAA0000A1Z" 
                  value={form.pickup_gst_number} 
                  onChange={(e) => setForm({ ...form, pickup_gst_number: e.target.value })} 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Mobile Number *</label>
                <input 
                  className="form-input" 
                  value={form.pickup_mobile} 
                  onChange={(e) => setForm({ ...form, pickup_mobile: e.target.value })} 
                  required 
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input 
                type="email" 
                className="form-input" 
                value={form.pickup_email} 
                onChange={(e) => setForm({ ...form, pickup_email: e.target.value })} 
              />
            </div>
            <div className="form-row">
              <div className="form-group" style={{ flex: 2 }}>
                <label className="form-label">Street Address *</label>
                <input 
                  className="form-input" 
                  value={form.pickup_street} 
                  onChange={(e) => setForm({ ...form, pickup_street: e.target.value })} 
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Area / Landmark</label>
                <input 
                  className="form-input" 
                  value={form.pickup_area} 
                  onChange={(e) => setForm({ ...form, pickup_area: e.target.value })} 
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">City *</label>
                <input 
                  className="form-input" 
                  value={form.pickup_city} 
                  onChange={(e) => setForm({ ...form, pickup_city: e.target.value })} 
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">State *</label>
                <input 
                  className="form-input" 
                  value={form.pickup_state} 
                  onChange={(e) => setForm({ ...form, pickup_state: e.target.value })} 
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Pincode *</label>
                <input 
                  className="form-input" 
                  value={form.pickup_pincode} 
                  onChange={(e) => setForm({ ...form, pickup_pincode: e.target.value })} 
                  required 
                />
              </div>
            </div>
          </div>

          {/* Delivery Customer */}
          <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.4rem' }}>
              3. Delivery Customer Details
            </h3>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Receiver / Contact Name *</label>
                <input 
                  className="form-input" 
                  value={form.delivery_customer_name} 
                  onChange={(e) => setForm({ ...form, delivery_customer_name: e.target.value })} 
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Company Name</label>
                <input 
                  className="form-input" 
                  value={form.delivery_company_name} 
                  onChange={(e) => setForm({ ...form, delivery_company_name: e.target.value })} 
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">GSTIN Number</label>
                <input 
                  className="form-input" 
                  placeholder="e.g. 27BBBBB1111B1Z" 
                  value={form.delivery_gst_number} 
                  onChange={(e) => setForm({ ...form, delivery_gst_number: e.target.value })} 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Mobile Number *</label>
                <input 
                  className="form-input" 
                  value={form.delivery_mobile} 
                  onChange={(e) => setForm({ ...form, delivery_mobile: e.target.value })} 
                  required 
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input 
                type="email" 
                className="form-input" 
                value={form.delivery_email} 
                onChange={(e) => setForm({ ...form, delivery_email: e.target.value })} 
              />
            </div>
            <div className="form-row">
              <div className="form-group" style={{ flex: 2 }}>
                <label className="form-label">Street Address *</label>
                <input 
                  className="form-input" 
                  value={form.delivery_street} 
                  onChange={(e) => setForm({ ...form, delivery_street: e.target.value })} 
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Area / Landmark</label>
                <input 
                  className="form-input" 
                  value={form.delivery_area} 
                  onChange={(e) => setForm({ ...form, delivery_area: e.target.value })} 
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">City *</label>
                <input 
                  className="form-input" 
                  value={form.delivery_city} 
                  onChange={(e) => setForm({ ...form, delivery_city: e.target.value })} 
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">State *</label>
                <input 
                  className="form-input" 
                  value={form.delivery_state} 
                  onChange={(e) => setForm({ ...form, delivery_state: e.target.value })} 
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Pincode *</label>
                <input 
                  className="form-input" 
                  value={form.delivery_pincode} 
                  onChange={(e) => setForm({ ...form, delivery_pincode: e.target.value })} 
                  required 
                />
              </div>
            </div>
          </div>

        </div>

        {/* Section 4: Goods Spec */}
        <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.4rem' }}>
            4. Goods & Cargo Description
          </h3>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Goods Description (Free text) *</label>
              <input 
                className="form-input" 
                placeholder="e.g. Steel Pipes, Electronics, Food boxes" 
                value={form.goods_name} 
                onChange={(e) => setForm({ ...form, goods_name: e.target.value })} 
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Cargo Weight (kg) *</label>
              <input 
                type="number" 
                className="form-input" 
                placeholder="e.g. 1500" 
                value={form.cargo_weight} 
                onChange={(e) => setForm({ ...form, cargo_weight: e.target.value })} 
                required 
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Quantity / Amount</label>
              <input 
                type="number" 
                className="form-input" 
                placeholder="e.g. 50" 
                value={form.goods_quantity} 
                onChange={(e) => setForm({ ...form, goods_quantity: e.target.value })} 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Cargo Volume (m³)</label>
              <input 
                type="number" 
                className="form-input" 
                placeholder="e.g. 12.5" 
                value={form.goods_volume} 
                onChange={(e) => setForm({ ...form, goods_volume: e.target.value })} 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Packages count</label>
              <input 
                type="number" 
                className="form-input" 
                placeholder="e.g. 120" 
                value={form.goods_package_count} 
                onChange={(e) => setForm({ ...form, goods_package_count: e.target.value })} 
              />
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '2rem', marginTop: '0.25rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={form.is_fragile} 
                onChange={(e) => setForm({ ...form, is_fragile: e.target.checked })} 
              />
              Is Fragile
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={form.is_perishable} 
                onChange={(e) => setForm({ ...form, is_perishable: e.target.checked })} 
              />
              Is Perishable
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={form.is_hazardous} 
                onChange={(e) => setForm({ ...form, is_hazardous: e.target.checked })} 
              />
              Is Hazardous
            </label>
          </div>
        </div>

        {/* Section 5: Vehicle & Driver Selection */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          
          {/* Vehicle Assignment */}
          <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.4rem' }}>
              5. Vehicle Assignment
            </h3>
            <div className="form-group">
              <label className="form-label">Select Available Vehicle *</label>
              <select 
                className="form-input" 
                value={selectedVehicle?.id || ''} 
                onChange={(e) => handleVehicleChange(e.target.value)}
                required
              >
                <option value="">-- Choose available fleet --</option>
                {availableVehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.registration_number} (Max Cap: {v.max_load_capacity} kg)
                  </option>
                ))}
              </select>
            </div>

            {selectedVehicle && (
              <div className="card" style={{ background: '#F8FAFC', padding: '0.75rem', fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div><span style={{ color: 'var(--text-secondary)' }}>Registration Number:</span> <strong>{selectedVehicle.registration_number}</strong></div>
                <div><span style={{ color: 'var(--text-secondary)' }}>Current Odometer:</span> <strong>{selectedVehicle.odometer} km</strong></div>
                <div><span style={{ color: 'var(--text-secondary)' }}>Max Payload Capacity:</span> <strong>{selectedVehicle.max_load_capacity} kg</strong></div>
                <div><span style={{ color: 'var(--text-secondary)' }}>Fuel Type:</span> <strong style={{ textTransform: 'uppercase' }}>{selectedVehicle.fuel_type}</strong></div>
              </div>
            )}
          </div>

          {/* Driver Assignment */}
          <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.4rem' }}>
              6. Driver Assignment
            </h3>
            <div className="form-group">
              <label className="form-label">Select Available Driver *</label>
              <select 
                className="form-input" 
                value={selectedDriver?.id || ''} 
                onChange={(e) => handleDriverChange(e.target.value)}
                required
              >
                <option value="">-- Choose available driver --</option>
                {availableDrivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} (License: {d.license_category})
                  </option>
                ))}
              </select>
            </div>

            {selectedDriver && (
              <div className="card" style={{ background: '#F8FAFC', padding: '0.75rem', fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div><span style={{ color: 'var(--text-secondary)' }}>License Type:</span> <strong>{selectedDriver.license_category}</strong></div>
                <div><span style={{ color: 'var(--text-secondary)' }}>License Expiration:</span> <strong>{new Date(selectedDriver.license_expiry_date).toLocaleDateString()}</strong></div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Safety Score:</span>{' '}
                  <strong style={{ color: selectedDriver.safety_score >= 90 ? 'var(--success)' : 'var(--warning)' }}>
                    {selectedDriver.safety_score} / 100
                  </strong>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Section 6 & 7: Financials & Routing */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          
          {/* Routing Estimates */}
          <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.4rem' }}>
              7. Dispatch Estimations
            </h3>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Est. Duration (hours)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={form.estimated_duration} 
                  onChange={(e) => setForm({ ...form, estimated_duration: e.target.value })} 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Number of Stops</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={form.stops_count} 
                  onChange={(e) => setForm({ ...form, stops_count: e.target.value })} 
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Optional Route Notes</label>
              <textarea 
                className="form-input" 
                rows={2} 
                placeholder="Describe planned route or stop coordinates..." 
                value={form.route_notes} 
                onChange={(e) => setForm({ ...form, route_notes: e.target.value })} 
              />
            </div>
          </div>

          {/* Financials */}
          <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.4rem' }}>
              8. Estimated Financial Budget (₹)
            </h3>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Driver Allowance (₹)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={form.driver_allowance} 
                  onChange={(e) => setForm({ ...form, driver_allowance: e.target.value })} 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Toll estimate (₹)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={form.toll_estimate} 
                  onChange={(e) => setForm({ ...form, toll_estimate: e.target.value })} 
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Loading charges (₹)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={form.loading_charges} 
                  onChange={(e) => setForm({ ...form, loading_charges: e.target.value })} 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Unloading charges (₹)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={form.unloading_charges} 
                  onChange={(e) => setForm({ ...form, unloading_charges: e.target.value })} 
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Misc expenses (₹)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={form.misc_estimate} 
                  onChange={(e) => setForm({ ...form, misc_estimate: e.target.value })} 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Expected Revenue (₹)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={form.expected_revenue} 
                  onChange={(e) => setForm({ ...form, expected_revenue: e.target.value })} 
                />
              </div>
            </div>
          </div>

        </div>

        {/* Section 8: Attachments */}
        <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <FileText size={16} /> 9. Dispatch Verification Documents
          </h3>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Invoice Attachment</label>
              <input type="file" className="form-input" accept=".pdf,image/*" onChange={(e) => setInvoiceFile(e.target.files?.[0] || null)} />
            </div>
            <div className="form-group">
              <label className="form-label">Delivery Challan</label>
              <input type="file" className="form-input" accept=".pdf,image/*" onChange={(e) => setChallanFile(e.target.files?.[0] || null)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">E-Way Bill</label>
              <input type="file" className="form-input" accept=".pdf,image/*" onChange={(e) => setEwayFile(e.target.files?.[0] || null)} />
            </div>
            <div className="form-group">
              <label className="form-label">Customer Purchase Order (PO)</label>
              <input type="file" className="form-input" accept=".pdf,image/*" onChange={(e) => setPoFile(e.target.files?.[0] || null)} />
            </div>
            <div className="form-group">
              <label className="form-label">Other document</label>
              <input type="file" className="form-input" accept=".pdf,image/*" onChange={(e) => setOtherFile(e.target.files?.[0] || null)} />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/trips')}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={submitting} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Save size={16} /> {submitting ? 'Dispatching...' : 'Dispatch Trip'}
          </button>
        </div>

      </form>
    </div>
  );
}
