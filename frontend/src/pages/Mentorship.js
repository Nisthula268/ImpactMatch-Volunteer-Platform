import React, { useState, useEffect } from 'react';
import { mentorshipAPI } from '../services/api';

const Mentorship = () => {
  const [mentors, setMentors] = useState([]);
  const [myMentorships, setMyMentorships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestForm, setRequestForm] = useState({ mentorId: null, goalDescription: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([mentorshipAPI.getMentors(), mentorshipAPI.getMy()])
      .then(([mentorsRes, myRes]) => {
        setMentors(mentorsRes.data);
        setMyMentorships(myRes.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleRequest = async (mentorId) => {
    if (!requestForm.goalDescription) { alert('Please describe your goal'); return; }
    setSubmitting(true);
    try {
      await mentorshipAPI.requestMentor({ mentorId, goalDescription: requestForm.goalDescription });
      alert('Mentorship request sent!');
      setRequestForm({ mentorId: null, goalDescription: '' });
      const res = await mentorshipAPI.getMy();
      setMyMentorships(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={styles.loading}>Loading mentors...</div>;

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Mentorship</h1>

      {myMentorships.length > 0 && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>My Mentorships</h2>
          {myMentorships.map(m => (
            <div key={m._id} style={styles.myCard}>
              <div>
                <div style={styles.mentorName}>{m.mentorId?.name}</div>
                <div style={styles.mentorMeta}>{m.mentorId?.mentorDomains?.join(', ')}</div>
                <div style={styles.goal}>{m.goalDescription}</div>
                {m.skillGapAnalysis && <div style={styles.gap}>Skill Gap: {m.skillGapAnalysis}</div>}
                <div style={styles.sessions}>{m.sessions?.length || 0} sessions completed</div>
              </div>
              <span style={{ ...styles.statusBadge, ...statusColors[m.status] }}>{m.status}</span>
            </div>
          ))}
        </div>
      )}

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Find a Mentor</h2>
        {mentors.length === 0 ? (
          <p style={styles.empty}>No mentors available yet.</p>
        ) : (
          <div style={styles.grid}>
            {mentors.map(mentor => {
              const alreadyRequested = myMentorships.some(m => m.mentorId?._id === mentor._id || m.mentorId === mentor._id);
              return (
                <div key={mentor._id} style={styles.mentorCard}>
                  <div style={styles.avatar}>{mentor.name?.charAt(0)}</div>
                  <div style={styles.mentorInfo}>
                    <div style={styles.mentorName}>{mentor.name}</div>
                    <div style={styles.mentorMeta}>Availability: {mentor.availability}</div>
                    {mentor.bio && <div style={styles.mentorBio}>{mentor.bio.slice(0, 100)}...</div>}
                    <div style={styles.domainsRow}>
                      {(mentor.mentorDomains || []).map(d => <span key={d} style={styles.domain}>{d}</span>)}
                    </div>
                  </div>

                  {!alreadyRequested ? (
                    <div style={styles.requestSection}>
                      {requestForm.mentorId === mentor._id ? (
                        <>
                          <textarea
                            placeholder="Describe your learning goal..."
                            value={requestForm.goalDescription}
                            onChange={e => setRequestForm({ ...requestForm, goalDescription: e.target.value })}
                            style={styles.goalInput}
                          />
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => handleRequest(mentor._id)} disabled={submitting} style={styles.sendBtn}>
                              {submitting ? 'Sending...' : 'Send Request'}
                            </button>
                            <button onClick={() => setRequestForm({ mentorId: null, goalDescription: '' })} style={styles.cancelBtn}>Cancel</button>
                          </div>
                        </>
                      ) : (
                        <button onClick={() => setRequestForm({ mentorId: mentor._id, goalDescription: '' })} style={styles.requestBtn}>
                          Request Mentor
                        </button>
                      )}
                    </div>
                  ) : (
                    <div style={styles.requestedBadge}>✓ Requested</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
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
  page: { maxWidth: 1000, margin: '0 auto', padding: '32px 24px' },
  loading: { textAlign: 'center', padding: 60, color: '#6b7280' },
  title: { margin: '0 0 28px', fontSize: 26, fontWeight: 700, color: '#1e3a5f' },
  section: { background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb', marginBottom: 24 },
  sectionTitle: { margin: '0 0 20px', fontSize: 18, fontWeight: 700, color: '#1e3a5f' },
  myCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '14px 0', borderBottom: '1px solid #f3f4f6' },
  statusBadge: { fontSize: 12, padding: '4px 12px', borderRadius: 20, fontWeight: 600, flexShrink: 0 },
  goal: { fontSize: 13, color: '#374151', marginTop: 4 },
  gap: { fontSize: 12, color: '#92400e', background: '#fff7ed', padding: '4px 8px', borderRadius: 6, marginTop: 4, display: 'inline-block' },
  sessions: { fontSize: 12, color: '#6b7280', marginTop: 6 },
  empty: { color: '#9ca3af', textAlign: 'center', padding: '20px 0' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 },
  mentorCard: { border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 },
  avatar: { width: 48, height: 48, borderRadius: '50%', background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700 },
  mentorInfo: { flex: 1 },
  mentorName: { fontSize: 16, fontWeight: 700, color: '#1e3a5f' },
  mentorMeta: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  mentorBio: { fontSize: 12, color: '#4b5563', marginTop: 6 },
  domainsRow: { display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 },
  domain: { background: '#ede9fe', color: '#7c3aed', fontSize: 11, padding: '2px 8px', borderRadius: 20 },
  requestSection: { display: 'flex', flexDirection: 'column', gap: 8 },
  goalInput: { border: '1px solid #d1d5db', borderRadius: 8, padding: '8px 12px', fontSize: 13, height: 72, resize: 'vertical', fontFamily: 'inherit', outline: 'none' },
  requestBtn: { background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600, width: '100%' },
  sendBtn: { flex: 1, background: '#10b981', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  cancelBtn: { background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13 },
  requestedBadge: { background: '#f0fdf4', color: '#166534', padding: '8px', borderRadius: 8, fontSize: 12, textAlign: 'center', fontWeight: 600 },
};

export default Mentorship;
