import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import {
  Activity, Truck, Route, Calendar, DollarSign, Award, AlertTriangle, ChevronRight,
  ClipboardList, PlusCircle, History, UserCheck, Bell
} from 'lucide-react';

interface KPIs {
  status: string;
  assignedVehicle: string;
  activeTrip: string;
  tripsThisMonth: number;
  currentMonthSalary: number;
  safetyScore: number;
}

const STATUS_DETAILS: Record<string, { label: string; className: string; color: string; desc: string }> = {
  AVAILABLE: { label: 'Available', className: 'badge-success', color: 'var(--success)', desc: 'Ready for new dispatches' },
  ON_TRIP: { label: 'On Active Trip', className: 'badge-info', color: 'var(--primary)', desc: 'Currently in transit' },
  OFF_DUTY: { label: 'Off Duty', className: 'badge-warning', color: 'var(--warning)', desc: 'Resting / off shift' },
  SUSPENDED: { label: 'Suspended', className: 'badge-danger', color: 'var(--danger)', desc: 'Contact administrator' },
};

export default function DriverDashboardPage() {
  const navigate = useNavigate();
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/driver-portal/dashboard')
      .then(res => {
        setKpis(res.kpis);
        setAlerts(res.alerts || []);
        setNotifications(res.notifications || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="page-content"><p style={{ color: 'var(--text-secondary)' }}>Loading dashboard...</p></div>;
  if (!kpis) return <div className="page-content"><p style={{ color: 'var(--text-secondary)' }}>Failed to load dashboard metrics.</p></div>;

  const statusInfo = STATUS_DETAILS[kpis.status] || { label: kpis.status, className: 'badge-neutral', color: 'var(--text-secondary)', desc: 'Unknown status' };

  const getSafetyColor = (score: number) => {
    if (score >= 90) return 'var(--success)';
    if (score >= 75) return 'var(--warning)';
    return 'var(--danger)';
  };

  const quickActions = [
    { label: 'Active Delivery / Move', description: 'Log fuels, expense slips, and milestones', path: '/driver/current-trip', icon: ClipboardList, color: 'var(--primary)', bg: 'var(--primary-light)' },
    { label: 'Log Internal Vehicle Move', description: 'Register yard transfer or workshop trip', path: '/driver/create-internal', icon: PlusCircle, color: 'var(--secondary)', bg: 'var(--secondary-light)' },
    { label: 'My Historical Trips', description: 'View previous completed runs and summaries', path: '/driver/trips', icon: History, color: 'var(--info)', bg: 'var(--info-light)' },
    { label: 'My Documents & Identity', description: 'Check driving license & Aadhaar cards', path: '/driver/profile', icon: UserCheck, color: 'var(--accent)', bg: 'var(--accent-light)' }
  ];

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Hero Welcome banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary), #3730A3)',
        borderRadius: '16px',
        padding: '1.75rem 1.5rem',
        color: 'white',
        boxShadow: '0 4px 20px rgba(79, 70, 229, 0.15)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 4px 0' }}>Welcome Back, Driver!</h2>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.85)', margin: 0 }}>
            Smart Logistics Portal • Keep your records updated and report trip data in real-time.
          </p>
        </div>
        <div style={{
          position: 'absolute',
          right: '-20px',
          bottom: '-30px',
          opacity: 0.1,
          transform: 'rotate(-10deg)',
          zIndex: 1
        }}>
          <Truck size={160} />
        </div>
      </div>

      {/* Primary KPI Status Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        
        {/* Status card */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
          <div style={{
            background: `${statusInfo.color}15`,
            color: statusInfo.color,
            padding: '0.75rem',
            borderRadius: '12px'
          }}>
            <Activity size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Duty Status</div>
            <strong style={{ fontSize: '1.1rem', color: 'var(--text)', display: 'block', margin: '2px 0' }}>
              {statusInfo.label}
            </strong>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{statusInfo.desc}</span>
          </div>
        </div>

        {/* Safety Score */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
          <div style={{
            background: `${getSafetyColor(kpis.safetyScore)}15`,
            color: getSafetyColor(kpis.safetyScore),
            padding: '0.75rem',
            borderRadius: '12px'
          }}>
            <Award size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Safety Score</div>
            <strong style={{ fontSize: '1.25rem', color: getSafetyColor(kpis.safetyScore), display: 'block', margin: '2px 0' }}>
              {kpis.safetyScore} / 100
            </strong>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Based on safe driving analytics</span>
          </div>
        </div>

      </div>

      {/* KPI Details Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        
        {/* Active vehicle */}
        <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            <Truck size={14} /> ACTIVE VEHICLE
          </div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)', marginTop: '4px' }}>
            {kpis.assignedVehicle}
          </div>
        </div>

        {/* Active Trip Route */}
        <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            <Route size={14} /> ACTIVE ROUTE
          </div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: kpis.activeTrip !== 'None' ? 'var(--primary)' : 'var(--text-secondary)', marginTop: '4px' }}>
            {kpis.activeTrip}
          </div>
        </div>

        {/* Trips completed this month */}
        <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            <Calendar size={14} /> COMPLETED RUNS (MONTH)
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)', marginTop: '4px' }}>
            {kpis.tripsThisMonth} Trips
          </div>
        </div>

        {/* Salary */}
        <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            <DollarSign size={14} /> PAYOUT COMPENSATED (MONTH)
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--secondary)', marginTop: '4px' }}>
            ₹{kpis.currentMonthSalary.toLocaleString()}
          </div>
        </div>

      </div>

      {/* Critical Expiry Warnings & Alerts */}
      {alerts.length > 0 && (
        <div style={{
          background: '#FEF2F2',
          border: '1px solid #FCA5A5',
          borderRadius: '12px',
          padding: '1rem 1.25rem',
          boxShadow: '0 2px 8px rgba(239, 68, 68, 0.05)'
        }}>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 700, color: '#991B1B', margin: '0 0 0.5rem 0' }}>
            <AlertTriangle size={16} /> SYSTEM NOTICES & ACTION REQUIRED
          </h4>
          <ul style={{ paddingLeft: '1.25rem', margin: 0, fontSize: '0.78rem', color: '#B91C1C', display: 'flex', flexDirection: 'column', gap: '6px', fontWeight: 500 }}>
            {alerts.map((alert, i) => <li key={i}>{alert}</li>)}
          </ul>
        </div>
      )}

      {/* Quick Action Navigation Buttons */}
      <div>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.75rem' }}>Portal Quick Links</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
          {quickActions.map((act, i) => {
            const ActIcon = act.icon;
            return (
              <div 
                key={i}
                className="card hover-row" 
                style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', borderRadius: '12px' }}
                onClick={() => navigate(act.path)}
              >
                <div style={{ background: act.bg, color: act.color, padding: '0.6rem', borderRadius: '10px' }}>
                  <ActIcon size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text)' }}>{act.label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.2 }}>{act.description}</div>
                </div>
                <ChevronRight size={18} style={{ marginLeft: 'auto', color: 'var(--text-secondary)', opacity: 0.6 }} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity / Notifications log */}
      {notifications.length > 0 && (
        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bell size={16} style={{ color: 'var(--primary)' }} /> Live Notifications Logs
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {notifications.map((notif, i) => (
              <div key={i} style={{
                fontSize: '0.78rem',
                padding: '0.75rem 1rem',
                background: '#F8FAFC',
                borderLeft: '4px solid var(--primary)',
                borderRadius: '6px',
                color: 'var(--text)',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)' }}></span>
                <span>{notif}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
