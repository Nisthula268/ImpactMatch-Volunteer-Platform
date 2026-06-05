import React, { useState, useEffect } from 'react';
import { applicationAPI, attendanceAPI } from '../services/api';

const statusColors = {
  pending: { background: '#fef9c3', color: '#854d0e' },
  accepted: { background: '#dcfce7', color: '#166534' },
  rejected: { background: '#fee2e2', color: '#b91c1c' },
  completed: { background: '#dbeafe', color: '#1e40af' },
};

const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(null);

  useEffect(() => {
    applicationAPI.getMy()
      .then(r => setApplications(r.data))
      .finally(() => setLoading(false));
  }, []);

  const handleCheckIn = async (opportunityId) => {
    setCheckingIn(opportunityId);
    try {
      if (!navigator.geolocation) { alert('Geolocation not supported'); return; }
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            await attendanceAPI.checkIn({ opportunityId, latitude: pos.coords.latitude, longitude: pos.coords.longitude });
            alert('Checked in successfully!');
          } catch (err) {
            alert(err.response?.data?.message || 'Check-in failed');
          } finally {
            setCheckingIn(null);
          }
        },
        () => { alert('Could not get your location. Please enable GPS.'); setCheckingIn(null); }
      );
    } catch (err) {
      alert('Error accessing GPS');
      setCheckingIn(null);
    }
  };

  const handleCheckOut = async (opportunityId) => {
    if (!navigator.geolocation) { alert('Geolocation not supported'); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await attendanceAPI.checkOut({ opportunityId, latitude: pos.coords.latitude, longitude: pos.coords.longitude });
          alert('Checked out successfully! Attendance recorded.');
          const res = await applicationAPI.getMy();
          setApplications(res.data);
        } catch (err) {
          alert(err.response?.data?.message || 'Check-out failed');
        }
      },
      () => alert('Could not get your location.')
    );
  };

  if (loading) return <div style={styles.loading}>Loading applications...</div>;

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>My Applications</h1>
      <p style={styles.subtitle}>{applications.length} total applications</p>

      {applications.length === 0 ? (
        <div style={styles.empty}>You haven't applied to any opportunities yet.</div>
      ) : (
        <div style={styles.list}>
          {applications.map(app => (
            <div key={app._id} style={styles.card}>
              <div style={styles.cardHeader}>
                <div>
                  <h3 style={styles.cardTitle}>{app.opportunityId?.title || 'Opportunity'}</h3>
                  <p style={styles.cardMeta}>
                    {app.opportunityId?.organizationId?.organizationName || app.opportunityId?.organizationId?.name} •{' '}
                    {app.opportunityId?.category} • {app.opportunityId?.duration}
                  </p>
                  <p style={styles.cardDate}>Applied {new Date(app.createdAt).toLocaleDateString()}</p>
                </div>
                <div style={styles.rightCol}>
                  <span style={{ ...styles.statusBadge, ...statusColors[app.status] }}>{app.status}</span>
                  {app.matchScore && (
                    <span style={styles.matchScore}>Match: {Math.round(app.matchScore * 100)}%</span>
                  )}
                </div>
              </div>

              {app.status === 'accepted' && (
                <div style={styles.attendanceSection}>
                  <p style={styles.attendanceTitle}>📍 Attendance Tracking</p>
                  <div style={styles.attendanceBtns}>
                    <button
                      onClick={() => handleCheckIn(app.opportunityId._id)}
                      disabled={checkingIn === app.opportunityId._id}
                      style={styles.checkInBtn}
                    >
                      {checkingIn === app.opportunityId._id ? 'Getting location...' : '📍 Check In'}
                    </button>
                    <button onClick={() => handleCheckOut(app.opportunityId._id)} style={styles.checkOutBtn}>
                      ✅ Check Out
                    </button>
                  </div>
                  {app.attendanceVerified && (
                    <div style={styles.verifiedBadge}>✅ Attendance Verified</div>
                  )}
                </div>
              )}

              {app.organizationNotes && (
                <div style={styles.notes}>
                  <strong>Organization note:</strong> {app.organizationNotes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  page: { maxWidth: 900, margin: '0 auto', padding: '32px 24px' },
  loading: { textAlign: 'center', padding: 60, color: '#6b7280' },
  title: { margin: '0 0 4px', fontSize: 26, fontWeight: 700, color: '#1e3a5f' },
  subtitle: { margin: '0 0 28px', color: '#6b7280', fontSize: 14 },
  empty: { textAlign: 'center', padding: 60, color: '#9ca3af', background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb' },
  list: { display: 'flex', flexDirection: 'column', gap: 16 },
  card: { background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 },
  cardTitle: { margin: 0, fontSize: 17, fontWeight: 700, color: '#1e3a5f' },
  cardMeta: { margin: '4px 0', fontSize: 13, color: '#6b7280', textTransform: 'capitalize' },
  cardDate: { margin: 0, fontSize: 12, color: '#9ca3af' },
  rightCol: { display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' },
  statusBadge: { fontSize: 12, padding: '4px 12px', borderRadius: 20, fontWeight: 600 },
  matchScore: { fontSize: 12, color: '#2563eb', fontWeight: 600 },
  attendanceSection: { marginTop: 16, padding: '14px 18px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' },
  attendanceTitle: { margin: '0 0 12px', fontSize: 13, fontWeight: 600, color: '#166534' },
  attendanceBtns: { display: 'flex', gap: 10 },
  checkInBtn: { background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  checkOutBtn: { background: '#10b981', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  verifiedBadge: { marginTop: 10, fontSize: 13, color: '#166534', fontWeight: 600 },
  notes: { marginTop: 12, fontSize: 13, color: '#374151', padding: '10px 14px', background: '#fffbeb', borderRadius: 8 },
};

export default Applications;
