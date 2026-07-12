import { useEffect, useState } from 'react';
import { api } from '../api';
import { AlertCircle, CheckCircle, Lock, Edit3, Eye, X } from 'lucide-react';

interface Profile {
  id: string;
  name: string;
  email: string;
  contact_number: string;
  address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  joining_date: string | null;
  monthly_salary: number;
  profile_photo_path: string | null;
  license_number: string;
  license_category: string;
  license_expiry_date: string;
  aadhaar_number: string | null;
  aadhaar_file_path: string | null;
  license_file_path: string | null;
  pan_file_path: string | null;
  medical_cert_path: string | null;
  police_verification_path: string | null;
}

export default function DriverProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  // Password reset state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Edit form states
  const [editForm, setEditForm] = useState({
    license_number: '',
    license_expiry_date: '',
    aadhaar_number: '',
  });

  // Selected files
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null);
  const [panFile, setPanFile] = useState<File | null>(null);
  const [medicalFile, setMedicalFile] = useState<File | null>(null);
  const [policeFile, setPoliceFile] = useState<File | null>(null);

  const fetchProfile = () => {
    setLoading(true);
    api.get('/driver-portal/profile')
      .then(res => {
        setProfile(res.profile);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleOpenEditModal = () => {
    if (!profile) return;
    setEditError('');
    setEditSuccess('');
    
    // Format date string for input fields
    let formattedExpiry = '';
    if (profile.license_expiry_date) {
      formattedExpiry = new Date(profile.license_expiry_date).toISOString().substring(0, 10);
    }

    setEditForm({
      license_number: profile.license_number || '',
      license_expiry_date: formattedExpiry,
      aadhaar_number: profile.aadhaar_number || '',
    });

    setProfilePhotoFile(null);
    setLicenseFile(null);
    setAadhaarFile(null);
    setPanFile(null);
    setMedicalFile(null);
    setPoliceFile(null);

    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditSubmitting(true);
    setEditError('');
    setEditSuccess('');

    try {
      const formData = new FormData();
      formData.append('license_number', editForm.license_number);
      if (editForm.license_expiry_date) {
        formData.append('license_expiry_date', editForm.license_expiry_date);
      }
      formData.append('aadhaar_number', editForm.aadhaar_number);

      if (profilePhotoFile) formData.append('profile_photo', profilePhotoFile);
      if (licenseFile) formData.append('license_file', licenseFile);
      if (aadhaarFile) formData.append('aadhaar_file', aadhaarFile);
      if (panFile) formData.append('pan_file', panFile);
      if (medicalFile) formData.append('medical_cert', medicalFile);
      if (policeFile) formData.append('police_verification', policeFile);

      await api.put('/driver-portal/profile/documents', formData);
      setEditSuccess('Profile documents updated successfully!');
      
      // Reload profile
      api.get('/driver-portal/profile').then(res => {
        setProfile(res.profile);
      });

      setTimeout(() => {
        setShowEditModal(false);
      }, 1000);
    } catch (err: any) {
      setEditError(err.message || 'Failed to update documents');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (newPassword !== confirmPassword) {
      setErrorMsg('New passwords do not match');
      return;
    }

    setPasswordSubmitting(true);
    try {
      await api.put('/driver-portal/profile/password', { oldPassword, newPassword });
      setSuccessMsg('Password changed successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to change password');
    } finally {
      setPasswordSubmitting(false);
    }
  };

  if (loading) return <div className="page-content"><p style={{ color: 'var(--text-secondary)' }}>Loading profile info...</p></div>;
  if (!profile) return <div className="page-content"><p style={{ color: 'var(--text-secondary)' }}>Failed to load profile.</p></div>;

  const checkDocStatus = (expiryDateStr: string | null) => {
    if (!expiryDateStr) return { label: 'Not Set', className: 'badge-neutral' };
    const expiry = new Date(expiryDateStr);
    const now = new Date();
    const diff = expiry.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (days < 0) return { label: 'Expired', className: 'badge-danger' };
    if (days <= 30) return { label: `Expires in ${days} days`, className: 'badge-warning' };
    return { label: 'Valid', className: 'badge-success' };
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const documents = [
    {
      name: 'Driving License (DL) *',
      number: profile.license_number ? `No: ${profile.license_number} (${profile.license_category})` : 'Missing details',
      status: checkDocStatus(profile.license_expiry_date),
      filePath: profile.license_file_path,
    },
    {
      name: 'Aadhaar Card (Mandatory) *',
      number: profile.aadhaar_number ? `No: ${profile.aadhaar_number}` : 'Missing details',
      status: profile.aadhaar_file_path ? { label: 'Uploaded', className: 'badge-success' } : { label: 'Missing File', className: 'badge-danger' },
      filePath: profile.aadhaar_file_path,
    },
    {
      name: 'PAN Card (Optional)',
      number: 'Permanent Account Number',
      status: profile.pan_file_path ? { label: 'Uploaded', className: 'badge-success' } : { label: 'Missing File', className: 'badge-neutral' },
      filePath: profile.pan_file_path,
    },
    {
      name: 'Medical Fitness Certificate (Optional)',
      number: 'Fitness Certification Status',
      status: profile.medical_cert_path ? { label: 'Uploaded', className: 'badge-success' } : { label: 'Missing File', className: 'badge-neutral' },
      filePath: profile.medical_cert_path,
    },
    {
      name: 'Police Verification Clearance (Optional)',
      number: 'Clearance Record Status',
      status: profile.police_verification_path ? { label: 'Uploaded', className: 'badge-success' } : { label: 'Missing File', className: 'badge-neutral' },
      filePath: profile.police_verification_path,
    }
  ];

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Profile Header Card */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem 1.25rem', borderRadius: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {profile.profile_photo_path ? (
            <img 
              src={`http://localhost:5000/${profile.profile_photo_path}`} 
              alt="Profile" 
              style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }}
            />
          ) : (
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.65rem',
              fontWeight: 700
            }}>
              {getInitials(profile.name)}
            </div>
          )}
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>{profile.name}</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>{profile.email}</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>Ph: {profile.contact_number}</p>
          </div>
        </div>

        <button className="btn btn-secondary btn-sm" onClick={handleOpenEditModal} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.75rem' }}>
          <Edit3 size={14} /> Edit Profile & Docs
        </button>
      </div>

      {/* Grid: Personal Details & Documents */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        
        {/* Personal Details */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', margin: 0 }}>
            Personal Details Summary
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.82rem' }}>
            <div><span style={{ color: 'var(--text-secondary)' }}>Residential Address:</span> <strong style={{ display: 'block', marginTop: '2px', color: 'var(--text)' }}>{profile.address || '—'}</strong></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div><span style={{ color: 'var(--text-secondary)' }}>Joining Date:</span> <strong style={{ display: 'block', marginTop: '2px' }}>{profile.joining_date ? new Date(profile.joining_date).toLocaleDateString() : '—'}</strong></div>
              <div><span style={{ color: 'var(--text-secondary)' }}>Monthly Payout:</span> <strong style={{ display: 'block', marginTop: '2px', color: 'var(--secondary)' }}>₹{profile.monthly_salary.toLocaleString()}</strong></div>
            </div>
            
            <div style={{ borderTop: '1px dashed var(--border)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Emergency Contact:</span>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', marginTop: '4px' }}>
                {profile.emergency_contact_name || '—'}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Ph: {profile.emergency_contact_phone || '—'}
              </div>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            <Lock size={15} /> Change Account Password
          </h3>

          {successMsg && (
            <div className="card" style={{ background: 'var(--success-light)', color: '#065F46', border: '1px solid #A7F3D0', padding: '0.5rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle size={14} /> {successMsg}
            </div>
          )}

          {errorMsg && (
            <div className="card" style={{ background: 'var(--danger-light)', color: '#991B1B', border: '1px solid #FCA5A5', padding: '0.5rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <AlertCircle size={14} /> {errorMsg}
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Current Password</label>
              <input 
                type="password" 
                className="form-input" 
                value={oldPassword} 
                onChange={e => setOldPassword(e.target.value)} 
                required 
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.75rem' }}>New Password</label>
                <input 
                  type="password" 
                  className="form-input" 
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)} 
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Confirm Password</label>
                <input 
                  type="password" 
                  className="form-input" 
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)} 
                  required 
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-sm" style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }} disabled={passwordSubmitting}>
              {passwordSubmitting ? 'Updating...' : 'Change Password'}
            </button>
          </form>
        </div>

      </div>

      {/* Verification Documents Ledger */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem' }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', margin: 0 }}>
          Identity & Verification Documents
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {documents.map((doc, i) => (
            <div 
              key={i} 
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.8rem',
                borderBottom: i !== documents.length - 1 ? '1px solid #F1F5F9' : 'none',
                paddingBottom: i !== documents.length - 1 ? '0.75rem' : '0',
                paddingTop: i !== 0 ? '0.25rem' : '0'
              }}
            >
              <div>
                <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text)' }}>{doc.name}</strong>
                <span style={{ fontSize: '0.73rem', color: 'var(--text-secondary)' }}>{doc.number}</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className={`badge ${doc.status.className}`} style={{ fontSize: '0.65rem', padding: '3px 8px' }}>
                  {doc.status.label}
                </span>

                {doc.filePath ? (
                  <a 
                    href={`http://localhost:5000/${doc.filePath}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '0.3rem 0.5rem', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem' }}
                  >
                    <Eye size={12} /> View File
                  </a>
                ) : (
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', padding: '0.3rem 0.5rem' }}>—</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* EDIT DOCUMENTS & DETAILS MODAL */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" style={{ maxWidth: '560px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Documents & Identity Info</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}><X size={16} /></button>
            </div>

            {editError && (
              <div className="card" style={{ background: 'var(--danger-light)', color: '#991B1B', border: '1px solid #FCA5A5', padding: '0.5rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertCircle size={14} /> {editError}
              </div>
            )}

            {editSuccess && (
              <div className="card" style={{ background: 'var(--success-light)', color: '#065F46', border: '1px solid #A7F3D0', padding: '0.5rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle size={14} /> {editSuccess}
              </div>
            )}

            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.75rem', maxHeight: '480px', overflowY: 'auto', paddingRight: '6px' }}>
              
              <h3 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary)', borderBottom: '1px dashed var(--border)', paddingBottom: '3px', margin: '0.5rem 0 0 0' }}>
                Identity Numbers
              </h3>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Driving License (DL) Number *</label>
                  <input 
                    className="form-input" 
                    value={editForm.license_number} 
                    onChange={e => setEditForm({ ...editForm, license_number: e.target.value })} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">DL Expiry Date *</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={editForm.license_expiry_date} 
                    onChange={e => setEditForm({ ...editForm, license_expiry_date: e.target.value })} 
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Aadhaar Card Number *</label>
                <input 
                  className="form-input" 
                  placeholder="e.g. 1234-5678-9012" 
                  value={editForm.aadhaar_number} 
                  onChange={e => setEditForm({ ...editForm, aadhaar_number: e.target.value })} 
                  required 
                />
              </div>

              <h3 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary)', borderBottom: '1px dashed var(--border)', paddingBottom: '3px', margin: '0.5rem 0 0 0' }}>
                Upload Updated Files & Photo (Optional)
              </h3>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Profile Photo</label>
                  <input 
                    type="file" 
                    className="form-input" 
                    accept="image/*" 
                    onChange={e => setProfilePhotoFile(e.target.files?.[0] || null)} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Driving License File</label>
                  <input 
                    type="file" 
                    className="form-input" 
                    accept=".pdf,image/*" 
                    onChange={e => setLicenseFile(e.target.files?.[0] || null)} 
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Aadhaar Card File</label>
                  <input 
                    type="file" 
                    className="form-input" 
                    accept=".pdf,image/*" 
                    onChange={e => setAadhaarFile(e.target.files?.[0] || null)} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">PAN Card File</label>
                  <input 
                    type="file" 
                    className="form-input" 
                    accept=".pdf,image/*" 
                    onChange={e => setPanFile(e.target.files?.[0] || null)} 
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Medical Fitness Certificate</label>
                  <input 
                    type="file" 
                    className="form-input" 
                    accept=".pdf,image/*" 
                    onChange={e => setMedicalFile(e.target.files?.[0] || null)} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Police Verification Certificate</label>
                  <input 
                    type="file" 
                    className="form-input" 
                    accept=".pdf,image/*" 
                    onChange={e => setPoliceFile(e.target.files?.[0] || null)} 
                  />
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={editSubmitting}>
                  {editSubmitting ? 'Updating...' : 'Save Updates'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
