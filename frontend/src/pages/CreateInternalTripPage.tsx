import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Truck, ArrowLeft, Save, AlertTriangle } from 'lucide-react';

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

const REASONS = [
  'Parking Movement',
  'Service Visit',
  'Fuel Filling',
  'Branch Transfer',
  'Vehicle Inspection',
  'Vehicle Washing',
  'Test Drive',
  'Other'
];

export default function CreateInternalTripPage() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Selections
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

  // Form Fields
  const [form, setForm] = useState({
    reason: 'Parking Movement',
    source: '',
    destination: '',
    planned_distance: '',
    remarks: ''
  });

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

    // Driver validation
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
      const payload = {
        trip_type: 'INTERNAL',
        reason: form.reason,
        source: form.source,
        destination: form.destination,
        planned_distance: Number(form.planned_distance) || 0,
        remarks: form.remarks,
        vehicle_id: selectedVehicle.id,
        driver_id: selectedDriver.id,
        cargo_weight: 0,
      };

      await api.post('/trips', payload);
      navigate('/trips');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to dispatch internal move');
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
    <div className="page-content animate-in" style={{ maxWidth: '640px', margin: '0 auto' }}>
      
      {/* Header section */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/trips')} style={{ padding: '0.4rem' }}>
            <ArrowLeft size={16} />
          </button>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
            <Truck size={20} style={{ color: 'var(--primary)' }} /> Dispatch Vehicle Yard Move
          </h1>
        </div>
      </div>

      {errorMsg && (
        <div className="card" style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <AlertTriangle size={16} />
          <strong>{errorMsg}</strong>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        <div className="form-group">
          <label className="form-label">Internal Movement Reason *</label>
          <select 
            className="form-input" 
            value={form.reason} 
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            required
          >
            {REASONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div className="form-row">
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
                  {v.registration_number} (Current Odo: {v.odometer} km)
                </option>
              ))}
            </select>
          </div>

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
                  {d.name} (Safety Score: {d.safety_score})
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedVehicle && (
          <div className="card" style={{ background: '#F8FAFC', padding: '0.75rem', fontSize: '0.78rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Selected Vehicle Starting Odometer:</span>{' '}
            <strong>{selectedVehicle.odometer} km</strong>
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Source Terminal / Location *</label>
            <input 
              className="form-input" 
              placeholder="e.g. Yard A" 
              value={form.source} 
              onChange={(e) => setForm({ ...form, source: e.target.value })} 
              required 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Destination Location *</label>
            <input 
              className="form-input" 
              placeholder="e.g. Wash Station" 
              value={form.destination} 
              onChange={(e) => setForm({ ...form, destination: e.target.value })} 
              required 
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Estimated Move Distance (km) *</label>
          <input 
            type="number" 
            className="form-input" 
            placeholder="e.g. 5" 
            value={form.planned_distance} 
            onChange={(e) => setForm({ ...form, planned_distance: e.target.value })} 
            required 
          />
        </div>

        <div className="form-group">
          <label className="form-label">Remarks / Dispatch Instructions</label>
          <textarea 
            className="form-input" 
            placeholder="Log any comments for yard transfer..." 
            value={form.remarks} 
            onChange={(e) => setForm({ ...form, remarks: e.target.value })} 
          />
        </div>

        <div className="modal-actions" style={{ marginTop: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/trips')}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={submitting} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Save size={16} /> {submitting ? 'Dispatching...' : 'Dispatch Yard Move'}
          </button>
        </div>

      </form>
    </div>
  );
}
