import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { applicationAPI, matchingAPI, attendanceAPI, certificateAPI } from '../services/api';

const StatCard = ({ label, value, icon, color }) => (
  <div style={{ ...styles.statCard, borderTop: `4px solid ${color}` }}>
    <span style={{ fontSize: 28 }}>{icon}</span>
    <div>
      <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 13, color: '#6b7280' }}>{label}</div>
    </div>
  </div>
);

const VolunteerDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState({ applications: [], matches: [], attendance: [], certificates: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [apps, matches, att, certs] = await Promise.allSettled([
          applicationAPI.getMy(),
          matchingAPI.getMatched(),
          attendanceAPI.getMy(),
          certificateAPI.getMy(),
        ]);
        setData({
          applications: apps.status === 'fulfilled' ? apps.value.data : [],
          matches: matches.status === 'fulfilled' ? matches.value.data.slice(0, 5) : [],
          attendance: att.status === 'fulfilled' ? att.value.data : [],
          certificates: certs.status === 'fulfilled' ? certs.value.data : [],
        });
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) return <div style={styles.loading}>Loading your dashboard...</div>;

  const totalHours = data.attendance.reduce((sum, a) => sum + (a.totalHours || 0), 0);
  const accepted = data.applications.filter(a => a.status === 'accepted').length;
  const completed = data.applications.filter(a => a.status === 'completed').length;

  return (
    <div style={styles.page}>
      <div style={styles.hero}>
        <h1 style={styles.greeting}>Welcome back, {user.name}! 👋</h1>
        <p style={styles.subGreeting}>Here's your impact summary</p>
      </div>

      <div style={styles.statsGrid}>
        <StatCard label="Applications" value={data.applications.length} icon="📋" color="#2563eb" />
        <StatCard label="Accepted" value={accepted} icon="✅" color="#10b981" />
        <StatCard label="Completed" value={completed} icon="🏆" color="#f59e0b" />
        <StatCard label="Hours Volunteered" value={totalHours.toFixed(1)} icon="⏱" color="#8b5cf6" />
        <StatCard label="Certificates" value={data.certificates.length} icon="📜" color="#ec4899" />
      </div>

      <div style={styles.grid}>
        {/* Profile completion */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>My Profile</h2>
          <div style={styles.profileInfo}>
            <div style={styles.profileRow}><strong>Skills:</strong> {user.skills?.length ? user.skills.join(', ') : <span style={{ color: '#9ca3af' }}>Not set</span>}</div>
            <div style={styles.profileRow}><strong>Interests:</strong> {user.interests?.length ? user.interests.join(', ') : <span style={{ color: '#9ca3af' }}>Not set</span>}</div>
            <div style={styles.profileRow}><strong>Availability:</strong> {user.availability}</div>
          </div>
          {(!user.skills?.length || !user.interests?.length) && (
            <div style={styles.nudge}>💡 Add skills and interests to get better opportunity matches!</div>
          )}
        </div>

        {/* Top matches */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>🎯 Top Matches For You</h2>
          {data.matches.length === 0 ? (
            <p style={styles.empty}>No matches yet. <Link to="/register" style={styles.link}>Complete your profile</Link> to get started.</p>
          ) : (
            <div style={styles.matchList}>
              {data.matches.map(opp => (
                <Link key={opp._id} to={`/opportunities/${opp._id}`} style={styles.matchItem}>
                  <div>
                    <div style={styles.matchTitle}>{opp.title}</div>
                    <div style={styles.matchOrg}>{opp.organizationId?.name}</div>
                  </div>
                  <span style={{ ...styles.matchScore, background: opp.matchPercentage >= 70 ? '#dcfce7' : '#fef9c3', color: opp.matchPercentage >= 70 ? '#166534' : '#854d0e' }}>
                    {opp.matchPercentage}%
                  </span>
                </Link>
              ))}
              <Link to="/opportunities" style={styles.viewAll}>View all opportunities →</Link>
            </div>
          )}
        </div>

        {/* Recent applications */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>📋 Recent Applications</h2>
          {data.applications.length === 0 ? (
            <p style={styles.empty}>No applications yet. <Link to="/opportunities" style={styles.link}>Find opportunities</Link></p>
          ) : (
            <div>
              {data.applications.slice(0, 5).map(app => (
                <div key={app._id} style={styles.appItem}>
                  <div style={styles.appTitle}>{app.opportunityId?.title}</div>
                  <span style={{ ...styles.statusBadge, ...getStatusStyle(app.status) }}>{app.status}</span>
                </div>
              ))}
              <Link to="/applications" style={styles.viewAll}>View all →</Link>
            </div>
          )}
        </div>

        {/* Certificates */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>📜 My Certificates</h2>
          {data.certificates.length === 0 ? (
            <p style={styles.empty}>Complete a volunteer opportunity to earn certificates!</p>
          ) : (
            <div>
              {data.certificates.slice(0, 3).map(cert => (
                <div key={cert._id} style={styles.certItem}>
                  <div>
                    <div style={styles.certTitle}>{cert.opportunityId?.title}</div>
                    <div style={styles.certOrg}>{cert.organizationId?.organizationName || cert.organizationId?.name}</div>
                  </div>
                  <a href={cert.certificateURL} target="_blank" rel="noopener noreferrer" style={styles.downloadBtn}>📥</a>
                </div>
              ))}
              <Link to="/certificates" style={styles.viewAll}>View all →</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const getStatusStyle = (status) => ({
  pending: { background: '#fef9c3', color: '#854d0e' },
  accepted: { background: '#dcfce7', color: '#166534' },
  rejected: { background: '#fee2e2', color: '#b91c1c' },
  completed: { background: '#dbeafe', color: '#1e40af' },
}[status] || {});

const styles = {
  page: { maxWidth: 1200, margin: '0 auto', padding: '32px 24px' },
  loading: { textAlign: 'center', padding: 60, color: '#6b7280' },
  hero: { marginBottom: 32 },
  greeting: { margin: 0, fontSize: 28, fontWeight: 700, color: '#1e3a5f' },
  subGreeting: { margin: '8px 0 0', color: '#6b7280' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 32 },
  statCard: { background: '#fff', borderRadius: 12, padding: '20px', display: 'flex', gap: 16, alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 },
  section: { background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb' },
  sectionTitle: { margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#1e3a5f' },
  profileInfo: { display: 'flex', flexDirection: 'column', gap: 10 },
  profileRow: { fontSize: 13, color: '#374151' },
  nudge: { background: '#eff6ff', color: '#1d4ed8', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginTop: 16 },
  matchList: { display: 'flex', flexDirection: 'column', gap: 10 },
  matchItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f9fafb', borderRadius: 8, textDecoration: 'none', color: 'inherit' },
  matchTitle: { fontSize: 13, fontWeight: 600, color: '#1e3a5f' },
  matchOrg: { fontSize: 12, color: '#6b7280' },
  matchScore: { fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20 },
  appItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f3f4f6' },
  appTitle: { fontSize: 13, fontWeight: 500, color: '#374151' },
  statusBadge: { fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600 },
  certItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f3f4f6' },
  certTitle: { fontSize: 13, fontWeight: 600, color: '#1e3a5f' },
  certOrg: { fontSize: 12, color: '#6b7280' },
  downloadBtn: { fontSize: 18, cursor: 'pointer', textDecoration: 'none' },
  viewAll: { display: 'block', textAlign: 'right', fontSize: 13, color: '#2563eb', textDecoration: 'none', marginTop: 12, fontWeight: 600 },
  empty: { fontSize: 13, color: '#9ca3af', textAlign: 'center', padding: '20px 0' },
  link: { color: '#2563eb', textDecoration: 'none' },
};

export default VolunteerDashboard;
