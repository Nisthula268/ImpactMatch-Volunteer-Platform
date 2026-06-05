import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { mentorshipAPI } from '../services/api';

const MentorDashboard = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sessionForm, setSessionForm] = useState({});
  const [activeSession, setActiveSession] = useState(null);

  useEffect(() => {
    mentorshipAPI.getRequests()
      .then(r => setRequests(r.data))
      .finally(() => setLoading(false));
  }, []);

  const handleRespond = async (id, status) => {
    try {
      const res = await mentorshipAPI.respond(id, { status });
      setRequests(requests.map(r => r._id === id ? res.data : r));
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  const handleAddSession = async (id) => {
    const form = sessionForm[id];
    if (!form?.topic) { alert('Topic is required'); return; }
    try {
      await mentorshipAPI.addSession(id, { ...form, date: form.date || new Date(), status: 'completed' });
      alert('Session added!');
      setActiveSession(null);
      setSessionForm({ ...sessionForm, [id]: {} });
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  const handleComplete = async (id) => {
    const feedback = prompt('Enter completion feedback (optional):');
    try {
      const res = await mentorshipAPI.complete(id, { mentorFeedback: feedback });
      setRequests(requests.map(r => r._id === id ? res.data : r));
      alert('Mentorship completed!');
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  const updateSessionForm = (id, field, value) =>
    setSessionForm(f => ({ ...f, [id]: { ...f[id], [field]: value } }));

  if (loading) return <div style={styles.loading}>Loading...</div>;

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Mentor Dashboard</h1>
      <p style={styles.subtitle}>Welcome, {user.name} | Domains: {user.mentorDomains?.join(', ') || 'Not specified'}</p>

      <div style={styles.statsRow}>
        <div style={styles.stat}>
          <div style={styles.statNum}>{requests.filter(r => r.status === 'active').length}</div>
          <div style={styles.statLabel}>Active Mentees</div>
        </div>
        <div style={styles.stat}>
          <div style={styles.statNum}>{requests.filter(r => r.status === 'pending').length}</div>
          <div style={styles.statLabel}>Pending Requests</div>
        </div>
        <div style={styles.stat}>
          <div style={styles.statNum}>{requests.filter(r => r.status === 'completed').length}</div>
          <div style={styles.statLabel}>Completed</div>
        </div>
      </div>

      {requests.length === 0 ? (
        <div style={styles.empty}>No mentorship requests yet. Share your profile to attract mentees!</div>
      ) : (
        <div style={styles.list}>
          {requests.map(req => (
            <div key={req._id} style={styles.card}>
              <div style={styles.cardHeader}>
                <div>
                  <h3 style={styles.mentee}>{req.menteeId?.name}</h3>
                  <p style={styles.meta}>{req.menteeId?.email}</p>
                  <div style={styles.skillsRow}>
                    {(req.menteeId?.skills || []).map(s => <span key={s} style={styles.skill}>{s}</span>)}
                  </div>
                </div>
                <span style={{ ...styles.statusBadge, ...statusColors[req.status] }}>{req.status}</span>
              </div>

              {req.goalDescription && (
                <div style={styles.goal}><strong>Goal:</strong> {req.goalDescription}</div>
              )}
              {req.skillGapAnalysis && (
                <div style={styles.gap}><strong>Skill Gap:</strong> {req.skillGapAnalysis}</div>
              )}

              {req.status === 'pending' && (
                <div style={styles.actions}>
                  <button onClick={() => handleRespond(req._id, 'active')} style={styles.acceptBtn}>Accept</button>
                  <button onClick={() => handleRespond(req._id, 'rejected')} style={styles.rejectBtn}>Decline</button>
                </div>
              )}

              {req.status === 'active' && (
                <div style={styles.activeSection}>
                  <div style={styles.sessionsHeader}>
                    <h4 style={styles.sessionsTitle}>Sessions ({req.sessions?.length || 0})</h4>
                    <div style={styles.activeActions}>
                      <button onClick={() => setActiveSession(activeSession === req._id ? null : req._id)} style={styles.addSessionBtn}>
                        {activeSession === req._id ? 'Cancel' : '+ Add Session'}
                      </button>
                      <button onClick={() => handleComplete(req._id)} style={styles.completeBtn}>Mark Complete</button>
                    </div>
                  </div>

                  {activeSession === req._id && (
                    <div style={styles.sessionForm}>
                      <input placeholder="Topic *" style={styles.input} value={sessionForm[req._id]?.topic || ''} onChange={e => updateSessionForm(req._id, 'topic', e.target.value)} />
                      <input type="date" style={styles.input} value={sessionForm[req._id]?.date || ''} onChange={e => updateSessionForm(req._id, 'date', e.target.value)} />
                      <textarea placeholder="Session notes..." style={{ ...styles.input, height: 80 }} value={sessionForm[req._id]?.notes || ''} onChange={e => updateSessionForm(req._id, 'notes', e.target.value)} />
                      <button onClick={() => handleAddSession(req._id)} style={styles.saveBtn}>Save Session</button>
                    </div>
                  )}

                  {req.sessions?.length > 0 && (
                    <div style={styles.sessionsList}>
                      {req.sessions.map((s, i) => (
                        <div key={i} style={styles.sessionItem}>
                          <strong>{s.topic}</strong>
                          <span style={{ color: '#6b7280', fontSize: 12 }}>{new Date(s.date).toLocaleDateString()} • {s.status}</span>
                          {s.notes && <p style={styles.sessionNotes}>{s.notes}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const statusColors = {
  pending: { background: '#fef9c3', color: '#854d0e' },
  active: { background: '#dcfce7', color: '#166534' },
  completed: { background: '#dbeafe', color: '#1e40af' },
  rejected: { background: '#fee2e2', color: '#b91c1c' },
};

const styles = {
  page: { maxWidth: 900, margin: '0 auto', padding: '32px 24px' },
  loading: { textAlign: 'center', padding: 60, color: '#6b7280' },
  title: { margin: '0 0 4px', fontSize: 26, fontWeight: 700, color: '#1e3a5f' },
  subtitle: { margin: '0 0 24px', color: '#6b7280', fontSize: 14 },
  statsRow: { display: 'flex', gap: 16, marginBottom: 28 },
  stat: { background: '#fff', borderRadius: 12, padding: '16px 24px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb' },
  statNum: { fontSize: 28, fontWeight: 700, color: '#2563eb' },
  statLabel: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  empty: { textAlign: 'center', padding: 48, color: '#9ca3af', background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb' },
  list: { display: 'flex', flexDirection: 'column', gap: 16 },
  card: { background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  mentee: { margin: 0, fontSize: 17, fontWeight: 700, color: '#1e3a5f' },
  meta: { margin: '4px 0', fontSize: 13, color: '#6b7280' },
  skillsRow: { display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 },
  skill: { background: '#dbeafe', color: '#1d4ed8', fontSize: 11, padding: '2px 8px', borderRadius: 20 },
  statusBadge: { fontSize: 12, padding: '4px 12px', borderRadius: 20, fontWeight: 600, flexShrink: 0 },
  goal: { fontSize: 13, color: '#374151', marginBottom: 8, padding: '8px 12px', background: '#f0fdf4', borderRadius: 8 },
  gap: { fontSize: 13, color: '#374151', marginBottom: 12, padding: '8px 12px', background: '#fff7ed', borderRadius: 8 },
  actions: { display: 'flex', gap: 10 },
  acceptBtn: { background: '#10b981', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', fontWeight: 600 },
  rejectBtn: { background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', fontWeight: 600 },
  activeSection: { borderTop: '1px solid #f3f4f6', marginTop: 16, paddingTop: 16 },
  sessionsHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sessionsTitle: { margin: 0, fontSize: 14, fontWeight: 700, color: '#374151' },
  activeActions: { display: 'flex', gap: 8 },
  addSessionBtn: { background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13 },
  completeBtn: { background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  sessionForm: { display: 'flex', flexDirection: 'column', gap: 10, padding: '14px', background: '#f9fafb', borderRadius: 8, marginBottom: 14 },
  input: { border: '1px solid #d1d5db', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none', fontFamily: 'inherit' },
  saveBtn: { background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, alignSelf: 'flex-start' },
  sessionsList: { display: 'flex', flexDirection: 'column', gap: 10 },
  sessionItem: { padding: '10px 14px', background: '#f9fafb', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 },
  sessionNotes: { margin: 0, color: '#6b7280', fontSize: 12 },
};

export default MentorDashboard;
