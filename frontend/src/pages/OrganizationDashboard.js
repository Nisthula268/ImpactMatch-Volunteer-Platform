import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { opportunityAPI, applicationAPI, certificateAPI } from '../services/api';

const API_BASE = process.env.REACT_APP_API_URL
  ? process.env.REACT_APP_API_URL.replace('/api', '')
  : '';

// ── Status helpers ─────────────────────────────────────────────────────────────
const STATUS_STYLES = {
  pending:   { background: '#fef9c3', color: '#854d0e' },
  accepted:  { background: '#dcfce7', color: '#166534' },
  rejected:  { background: '#fee2e2', color: '#b91c1c' },
  completed: { background: '#dbeafe', color: '#1e40af' },
};

// ── Delete confirmation modal ──────────────────────────────────────────────────
const DeleteModal = ({ opp, onConfirm, onCancel, deleting }) => (
  <div style={modal.overlay} role="dialog" aria-modal="true">
    <div style={modal.box}>
      <div style={modal.iconWrap}>⚠️</div>
      <h2 style={modal.title}>Delete Opportunity?</h2>
      <p style={modal.body}>
        You are about to permanently delete <strong>"{opp.title}"</strong>.
      </p>
      <p style={modal.warning}>
        This will also remove all associated applications and attendance records.
        This action cannot be undone.
      </p>
      <div style={modal.actions}>
        <button onClick={onCancel} style={modal.cancelBtn} disabled={deleting}>
          Cancel
        </button>
        <button onClick={onConfirm} style={{ ...modal.deleteBtn, opacity: deleting ? 0.7 : 1 }} disabled={deleting}>
          {deleting ? 'Deleting...' : 'Yes, Delete'}
        </button>
      </div>
    </div>
  </div>
);

const modal = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 24 },
  box:     { background: '#fff', borderRadius: 16, padding: '32px 36px', maxWidth: 460, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
  iconWrap:{ textAlign: 'center', fontSize: 40, marginBottom: 12 },
  title:   { margin: '0 0 10px', fontSize: 20, fontWeight: 700, color: '#1e3a5f', textAlign: 'center' },
  body:    { margin: '0 0 8px', fontSize: 14, color: '#374151', textAlign: 'center' },
  warning: { margin: '0 0 24px', fontSize: 13, color: '#b91c1c', background: '#fef2f2', padding: '10px 14px', borderRadius: 8, textAlign: 'center' },
  actions: { display: 'flex', gap: 12 },
  cancelBtn: { flex: 1, background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 8, padding: '12px', cursor: 'pointer', fontWeight: 600, fontSize: 14 },
  deleteBtn: { flex: 1, background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '12px', cursor: 'pointer', fontWeight: 700, fontSize: 14 },
};

// ── Application row ────────────────────────────────────────────────────────────
const AppRow = ({ app, onStatusChange, onIssueCert, issuingCert }) => {
  const isCertIssuing = issuingCert === app._id;

  return (
    <div style={appRowStyles.row}>
      {/* Volunteer info */}
      <div style={appRowStyles.volInfo}>
        {app.volunteerId?.profilePicture ? (
          <img src={`${API_BASE}${app.volunteerId.profilePicture}`} alt="" style={appRowStyles.avatar} />
        ) : (
          <div style={appRowStyles.initial}>
            {app.volunteerId?.name?.charAt(0) || '?'}
          </div>
        )}
        <div>
          <div style={appRowStyles.name}>{app.volunteerId?.name}</div>
          <div style={appRowStyles.email}>{app.volunteerId?.email}</div>
          {app.volunteerId?.skills?.length > 0 && (
            <div style={appRowStyles.skills}>{app.volunteerId.skills.slice(0, 4).join(', ')}</div>
          )}
          {app.matchScore != null && (
            <div style={appRowStyles.score}>🤖 {Math.round(app.matchScore * 100)}% match</div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={appRowStyles.actions}>
        <span style={{ ...appRowStyles.badge, ...STATUS_STYLES[app.status] }}>
          {app.status}
        </span>

        {app.status === 'pending' && (
          <>
            <button onClick={() => onStatusChange(app._id, 'accepted')}  style={appRowStyles.acceptBtn}>Accept</button>
            <button onClick={() => onStatusChange(app._id, 'rejected')}  style={appRowStyles.rejectBtn}>Reject</button>
          </>
        )}

        {app.status === 'accepted' && app.attendanceVerified && (
          <button onClick={() => onStatusChange(app._id, 'completed')} style={appRowStyles.completeBtn}>
            ✓ Complete
          </button>
        )}

        {app.status === 'accepted' && !app.attendanceVerified && (
          <span style={appRowStyles.pendingAttend}>Awaiting check-in</span>
        )}

        {app.status === 'completed' && !app.hasCert && (
          <button
            onClick={() => onIssueCert(app._id)}
            disabled={isCertIssuing}
            style={{ ...appRowStyles.certBtn, opacity: isCertIssuing ? 0.7 : 1 }}
          >
            {isCertIssuing ? '...' : '📜 Issue Cert'}
          </button>
        )}

        {app.status === 'completed' && app.hasCert && (
          <span style={appRowStyles.certDone}>📜 Cert issued</span>
        )}
      </div>
    </div>
  );
};

const appRowStyles = {
  row:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f3f4f6', flexWrap: 'wrap', gap: 12 },
  volInfo:  { display: 'flex', gap: 12, alignItems: 'flex-start' },
  avatar:   { width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 },
  initial:  { width: 36, height: 36, borderRadius: '50%', background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, flexShrink: 0 },
  name:     { fontSize: 14, fontWeight: 600, color: '#1e3a5f' },
  email:    { fontSize: 12, color: '#9ca3af' },
  skills:   { fontSize: 11, color: '#6b7280', marginTop: 2 },
  score:    { fontSize: 11, color: '#2563eb', fontWeight: 600, marginTop: 2 },
  actions:  { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  badge:    { fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600 },
  acceptBtn: { background: '#10b981', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600 },
  rejectBtn: { background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600 },
  completeBtn: { background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600 },
  certBtn:  { background: '#8b5cf6', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600 },
  certDone: { fontSize: 12, color: '#166534', fontWeight: 600 },
  pendingAttend: { fontSize: 11, color: '#9ca3af', fontStyle: 'italic' },
};

// ── Opportunity card (expandable) ──────────────────────────────────────────────
const OppCard = ({ opp, onDelete, onEdit }) => {
  const [apps,       setApps]       = useState([]);
  const [expanded,   setExpanded]   = useState(false);
  const [loadingApps, setLoadingApps] = useState(false);
  const [issuingCert, setIssuingCert] = useState(null);  // app._id being issued

  const loadApps = async () => {
    if (expanded) { setExpanded(false); return; }
    setLoadingApps(true);
    try {
      const res = await applicationAPI.getByOpportunity(opp._id);
      // Fetch issued certs to mark which apps already have one
      let issuedCertAppIds = new Set();
      try {
        const certsRes = await certificateAPI.getIssued();
        issuedCertAppIds = new Set(certsRes.data.map(c => c.applicationId?.toString?.() || ''));
      } catch { /* ignore */ }
      setApps(res.data.map(a => ({ ...a, hasCert: issuedCertAppIds.has(a._id?.toString()) })));
      setExpanded(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingApps(false);
    }
  };

  const handleStatusChange = async (appId, status) => {
    try {
      const res = await applicationAPI.updateStatus(appId, { status });
      // Mark cert if auto-issued
      const hasCert = !!res.data.certificate;
      setApps(prev => prev.map(a => a._id === appId ? { ...a, status, hasCert: a.hasCert || hasCert } : a));
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed');
    }
  };

  const handleIssueCert = async (appId) => {
    setIssuingCert(appId);
    try {
      await certificateAPI.issue(appId);
      setApps(prev => prev.map(a => a._id === appId ? { ...a, hasCert: true } : a));
      alert('Certificate issued successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to issue certificate');
    } finally {
      setIssuingCert(null);
    }
  };

  return (
    <div style={cardStyles.card}>
      <div style={cardStyles.header}>
        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={cardStyles.title}>{opp.title}</h3>
          <p style={cardStyles.meta}>
            <span style={{ textTransform: 'capitalize' }}>{opp.category}</span>
            {' · '}{opp.duration}
            {' · '}{opp.location?.isRemote ? '🌐 Remote' : '📍 On-site'}
            {opp.hoursPerWeek ? ` · ${opp.hoursPerWeek}h/week` : ''}
          </p>
        </div>

        {/* Status + actions */}
        <div style={cardStyles.headerActions}>
          <span style={{
            ...cardStyles.statusBadge,
            background: opp.isActive ? '#dcfce7' : '#f3f4f6',
            color:      opp.isActive ? '#166534'  : '#6b7280',
          }}>
            {opp.isActive ? 'Active' : 'Inactive'}
          </span>

          <button onClick={() => onEdit(opp._id)} style={cardStyles.editBtn} title="Edit">
            ✏️ Edit
          </button>

          <button onClick={() => onDelete(opp)} style={cardStyles.deleteBtn} title="Delete">
            🗑 Delete
          </button>

          <button onClick={loadApps} disabled={loadingApps} style={cardStyles.appsBtn}>
            {loadingApps ? '...' : expanded ? '▲ Hide Apps' : `▼ Applications`}
          </button>
        </div>
      </div>

      {/* Applications panel */}
      {expanded && (
        <div style={cardStyles.appsPanel}>
          <h4 style={cardStyles.appsPanelTitle}>
            Applications ({apps.length})
            {apps.filter(a => a.status === 'pending').length > 0 && (
              <span style={cardStyles.pendingPill}>
                {apps.filter(a => a.status === 'pending').length} pending
              </span>
            )}
          </h4>

          {apps.length === 0 ? (
            <p style={{ fontSize: 13, color: '#9ca3af', padding: '12px 0' }}>
              No applications yet.
            </p>
          ) : (
            apps.map(app => (
              <AppRow
                key={app._id}
                app={app}
                onStatusChange={handleStatusChange}
                onIssueCert={handleIssueCert}
                issuingCert={issuingCert}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

const cardStyles = {
  card:         { background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb', overflow: 'hidden' },
  header:       { display: 'flex', alignItems: 'center', gap: 16, padding: '18px 24px', flexWrap: 'wrap' },
  title:        { margin: 0, fontSize: 16, fontWeight: 700, color: '#1e3a5f' },
  meta:         { margin: '4px 0 0', fontSize: 12, color: '#6b7280' },
  headerActions:{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0, flexWrap: 'wrap' },
  statusBadge:  { fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600 },
  editBtn:      { background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 7, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600 },
  deleteBtn:    { background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 7, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600 },
  appsBtn:      { background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb', borderRadius: 7, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600 },
  appsPanel:    { borderTop: '1px solid #f3f4f6', padding: '16px 24px 20px', background: '#fafafa' },
  appsPanelTitle:{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: '#374151', display: 'flex', alignItems: 'center', gap: 10 },
  pendingPill:  { background: '#fef9c3', color: '#854d0e', fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 600 },
};

// ── Main dashboard ─────────────────────────────────────────────────────────────
const OrganizationDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [opportunities, setOpportunities] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [deleteTarget,  setDeleteTarget]  = useState(null); // opp to delete
  const [deleting,      setDeleting]      = useState(false);

  const loadOpps = useCallback(async () => {
    try {
      const res = await opportunityAPI.getMy();
      setOpportunities(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadOpps(); }, [loadOpps]);

  const handleEdit = (id) => navigate(`/opportunities/${id}/edit`);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await opportunityAPI.delete(deleteTarget._id);
      setOpportunities(prev => prev.filter(o => o._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <div style={styles.loading}>Loading dashboard...</div>;

  const active   = opportunities.filter(o => o.isActive).length;
  const inactive = opportunities.length - active;

  return (
    <div style={styles.page}>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <DeleteModal
          opp={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}

      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Organization Dashboard</h1>
          <p style={styles.subtitle}>{user.organizationName || user.name}</p>
        </div>
        <Link to="/post-opportunity" style={styles.ctaBtn}>+ Post New Opportunity</Link>
      </div>

      {/* Stats */}
      <div style={styles.statsRow}>
        {[
          { label: 'Total Posted',  value: opportunities.length, color: '#2563eb' },
          { label: 'Active',        value: active,               color: '#10b981' },
          { label: 'Inactive',      value: inactive,             color: '#9ca3af' },
        ].map(({ label, value, color }) => (
          <div key={label} style={styles.stat}>
            <div style={{ ...styles.statNum, color }}>{value}</div>
            <div style={styles.statLabel}>{label}</div>
          </div>
        ))}
        <Link to="/certificates" style={{ ...styles.stat, textDecoration: 'none', cursor: 'pointer' }}>
          <div style={{ ...styles.statNum, color: '#8b5cf6' }}>📜</div>
          <div style={styles.statLabel}>View Issued Certs</div>
        </Link>
      </div>

      {/* Opportunity list */}
      <h2 style={styles.sectionTitle}>My Opportunities</h2>

      {opportunities.length === 0 ? (
        <div style={styles.empty}>
          <p style={{ fontWeight: 600, color: '#374151' }}>No opportunities posted yet.</p>
          <Link to="/post-opportunity" style={{ ...styles.ctaBtn, marginTop: 12, display: 'inline-block' }}>
            Post Your First Opportunity
          </Link>
        </div>
      ) : (
        <div style={styles.list}>
          {opportunities.map(opp => (
            <OppCard
              key={opp._id}
              opp={opp}
              onEdit={handleEdit}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  page:         { maxWidth: 1100, margin: '0 auto', padding: '32px 24px' },
  loading:      { textAlign: 'center', padding: 60, color: '#6b7280' },
  header:       { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 },
  title:        { margin: 0, fontSize: 26, fontWeight: 700, color: '#1e3a5f' },
  subtitle:     { margin: '4px 0 0', color: '#6b7280' },
  ctaBtn:       { background: '#2563eb', color: '#fff', padding: '10px 20px', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 14 },
  statsRow:     { display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap' },
  stat:         { background: '#fff', borderRadius: 12, padding: '18px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb', textAlign: 'center', minWidth: 120 },
  statNum:      { fontSize: 30, fontWeight: 700, marginBottom: 4 },
  statLabel:    { fontSize: 12, color: '#6b7280' },
  sectionTitle: { fontSize: 18, fontWeight: 700, color: '#1e3a5f', marginBottom: 16 },
  list:         { display: 'flex', flexDirection: 'column', gap: 16 },
  empty:        { textAlign: 'center', padding: '48px 0', color: '#6b7280', background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb' },
};

export default OrganizationDashboard;
