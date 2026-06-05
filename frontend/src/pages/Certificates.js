import React, { useState, useEffect, useCallback } from 'react';
import { certificateAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const API_BASE = process.env.REACT_APP_API_URL
  ? process.env.REACT_APP_API_URL.replace('/api', '')
  : '';

// ── Trigger a browser download from a blob ────────────────────────────────────
const triggerBlobDownload = (blob, filename) => {
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href     = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// ── Status badge styles ───────────────────────────────────────────────────────
const certCardGradients = [
  'linear-gradient(135deg, #1e40af, #0f766e)',
  'linear-gradient(135deg, #7c3aed, #1e40af)',
  'linear-gradient(135deg, #0f766e, #065f46)',
  'linear-gradient(135deg, #b45309, #1e40af)',
];

// ── Sub-component: single certificate card ────────────────────────────────────
const CertCard = ({ cert, index, onDownload, downloading }) => {
  const gradient = certCardGradients[index % certCardGradients.length];
  const orgName  = cert.organizationId?.organizationName || cert.organizationId?.name || '—';
  const isDownloading = downloading === cert.certificateId;

  const copyCode = () => {
    navigator.clipboard?.writeText(cert.verificationCode).then(() =>
      alert('Verification code copied to clipboard!')
    ).catch(() => alert(cert.verificationCode));
  };

  return (
    <div style={styles.certCard}>
      {/* Coloured header */}
      <div style={{ ...styles.certHeader, background: gradient }}>
        <div style={styles.certHeaderInner}>
          <span style={styles.certMedal}>🏅</span>
          <div style={{ minWidth: 0 }}>
            <div style={styles.certTitle}>{cert.opportunityId?.title || 'Volunteer Opportunity'}</div>
            <div style={styles.certOrg}>{orgName}</div>
          </div>
        </div>
      </div>

      {/* Details */}
      <div style={styles.certBody}>
        {[
          ['Category',          cert.opportunityId?.category],
          ['Duration',          cert.opportunityId?.duration],
          ['Hours Completed',   cert.hoursCompleted ? `${cert.hoursCompleted}h` : null],
          ['Issued',            new Date(cert.issueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })],
        ].filter(([, v]) => v).map(([label, value]) => (
          <div key={label} style={styles.certRow}>
            <span style={styles.certRowLabel}>{label}</span>
            <span style={{ ...styles.certRowValue, textTransform: label === 'Category' ? 'capitalize' : 'none' }}>
              {value}
            </span>
          </div>
        ))}

        {/* Verification code */}
        <div style={styles.vcodeRow}>
          <span style={styles.vcodeLabel}>Verification Code</span>
          <span style={styles.vcode}>{cert.verificationCode}</span>
        </div>
      </div>

      {/* Actions */}
      <div style={styles.certActions}>
        <button
          onClick={() => onDownload(cert.certificateId, cert.verificationCode)}
          disabled={isDownloading}
          style={{ ...styles.dlBtn, opacity: isDownloading ? 0.7 : 1 }}
        >
          {isDownloading ? '⏳ Downloading...' : '📥 Download PDF'}
        </button>
        <button onClick={copyCode} style={styles.copyBtn}>
          📋 Copy Code
        </button>
      </div>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
const Certificates = () => {
  const { user } = useAuth();
  const isOrg = user?.role === 'organization';

  const [certs,       setCerts]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [downloading, setDownloading] = useState(null); // certificateId being downloaded

  // Verify widget
  const [verifyCode,   setVerifyCode]   = useState('');
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifying,    setVerifying]    = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const loadCerts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = isOrg
        ? await certificateAPI.getIssued()
        : await certificateAPI.getMy();
      setCerts(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load certificates.');
    } finally {
      setLoading(false);
    }
  }, [isOrg]);

  useEffect(() => { loadCerts(); }, [loadCerts]);

  // ── Download via blob (works cross-origin / auth-protected) ───────────────
  const handleDownload = async (certificateId, verificationCode) => {
    setDownloading(certificateId);
    try {
      const res = await certificateAPI.download(certificateId);
      triggerBlobDownload(res.data, `certificate-${verificationCode}.pdf`);
    } catch (err) {
      alert(err.response?.data?.message || 'Download failed. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  // ── Verify ─────────────────────────────────────────────────────────────────
  const handleVerify = async (e) => {
    e.preventDefault();
    setVerifying(true);
    setVerifyResult(null);
    try {
      const res = await certificateAPI.verify(verifyCode.trim().toUpperCase());
      setVerifyResult({ ok: true, data: res.data.certificate });
    } catch (err) {
      setVerifyResult({ ok: false, message: err.response?.data?.message || 'Certificate not found.' });
    } finally {
      setVerifying(false);
    }
  };

  // ── Render: loading ────────────────────────────────────────────────────────
  if (loading) return (
    <div style={styles.centeredPage}>
      <div style={styles.spinner} />
      <p style={{ color: '#6b7280' }}>Loading certificates...</p>
    </div>
  );

  // ── Render: error ──────────────────────────────────────────────────────────
  if (error) return (
    <div style={styles.centeredPage}>
      <div style={{ fontSize: 40 }}>⚠️</div>
      <p style={{ color: '#b91c1c' }}>{error}</p>
      <button onClick={loadCerts} style={styles.retryBtn}>Try Again</button>
    </div>
  );

  return (
    <div style={styles.page}>

      {/* ── Header ── */}
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.title}>
            {isOrg ? 'Certificates Issued' : 'My Certificates'}
          </h1>
          <p style={styles.subtitle}>
            {isOrg
              ? `${certs.length} certificate${certs.length !== 1 ? 's' : ''} issued by your organization`
              : `${certs.length} certificate${certs.length !== 1 ? 's' : ''} earned`}
          </p>
        </div>
      </div>

      {/* ── Certificate grid ── */}
      {certs.length === 0 ? (
        <div style={styles.empty}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>📜</div>
          <p style={{ fontWeight: 600, color: '#374151' }}>
            {isOrg ? 'No certificates issued yet.' : 'No certificates earned yet.'}
          </p>
          <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>
            {isOrg
              ? 'Mark volunteer applications as completed to auto-generate certificates.'
              : 'Complete a volunteer opportunity to receive your first certificate.'}
          </p>
        </div>
      ) : isOrg ? (
        // ── Org table view ──
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                {['Volunteer', 'Opportunity', 'Hours', 'Issued', 'Code', 'Actions'].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {certs.map(cert => (
                <tr key={cert._id} style={styles.tr}>
                  <td style={styles.td}>
                    <div style={styles.volCell}>
                      {cert.volunteerId?.profilePicture ? (
                        <img src={`${API_BASE}${cert.volunteerId.profilePicture}`} alt="" style={styles.volAvatar} />
                      ) : (
                        <div style={styles.volInitial}>
                          {cert.volunteerId?.name?.charAt(0) || '?'}
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 600, color: '#1e3a5f', fontSize: 13 }}>{cert.volunteerId?.name}</div>
                        <div style={{ fontSize: 11, color: '#9ca3af' }}>{cert.volunteerId?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={{ fontSize: 13, color: '#374151' }}>{cert.opportunityId?.title}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af', textTransform: 'capitalize' }}>{cert.opportunityId?.category}</div>
                  </td>
                  <td style={{ ...styles.td, textAlign: 'center' }}>
                    {cert.hoursCompleted ? `${cert.hoursCompleted}h` : '—'}
                  </td>
                  <td style={styles.td}>
                    {new Date(cert.issueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td style={styles.td}>
                    <span style={styles.vcode}>{cert.verificationCode}</span>
                  </td>
                  <td style={styles.td}>
                    <button
                      onClick={() => handleDownload(cert.certificateId, cert.verificationCode)}
                      disabled={downloading === cert.certificateId}
                      style={styles.smallDlBtn}
                    >
                      {downloading === cert.certificateId ? '⏳' : '📥 PDF'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        // ── Volunteer card grid ──
        <div style={styles.grid}>
          {certs.map((cert, i) => (
            <CertCard
              key={cert._id}
              cert={cert}
              index={i}
              onDownload={handleDownload}
              downloading={downloading}
            />
          ))}
        </div>
      )}

      {/* ── Verify widget (visible to all) ── */}
      <div style={styles.verifySection}>
        <h2 style={styles.verifyTitle}>🔍 Verify a Certificate</h2>
        <p style={styles.verifyDesc}>
          Enter a verification code to confirm a certificate's authenticity.
        </p>

        <form onSubmit={handleVerify} style={styles.verifyForm}>
          <input
            value={verifyCode}
            onChange={e => setVerifyCode(e.target.value.toUpperCase())}
            placeholder="e.g. A1B2C3D4E5F6"
            style={styles.verifyInput}
            maxLength={16}
            required
          />
          <button type="submit" disabled={verifying} style={styles.verifyBtn}>
            {verifying ? 'Checking...' : 'Verify'}
          </button>
        </form>

        {verifyResult && (
          <div style={{
            ...styles.verifyResult,
            background:   verifyResult.ok ? '#f0fdf4' : '#fef2f2',
            borderColor:  verifyResult.ok ? '#86efac'  : '#fca5a5',
          }}>
            {verifyResult.ok ? (
              <>
                <div style={{ color: '#166534', fontWeight: 700, fontSize: 15, marginBottom: 12 }}>
                  ✅ Authentic Certificate
                </div>
                <div style={styles.verifyGrid}>
                  {[
                    ['Volunteer',    verifyResult.data.volunteerName],
                    ['Organization', verifyResult.data.organization],
                    ['Opportunity',  verifyResult.data.opportunityTitle],
                    ['Category',     verifyResult.data.category],
                    ['Duration',     verifyResult.data.duration],
                    ['Hours',        verifyResult.data.hoursCompleted || 'N/A'],
                    ['Issued',       new Date(verifyResult.data.issueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })],
                  ].map(([label, value]) => (
                    <div key={label} style={styles.verifyRow}>
                      <span style={styles.verifyLabel}>{label}</span>
                      <span style={{ ...styles.verifyValue, textTransform: label === 'Category' ? 'capitalize' : 'none' }}>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ color: '#b91c1c', fontWeight: 600 }}>
                ❌ {verifyResult.message}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  page:       { maxWidth: 1100, margin: '0 auto', padding: '32px 24px 60px' },
  centeredPage: { minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, textAlign: 'center' },
  spinner:    { width: 36, height: 36, border: '3px solid #e5e7eb', borderTop: '3px solid #2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  retryBtn:   { background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', cursor: 'pointer', fontWeight: 600 },
  pageHeader: { marginBottom: 28 },
  title:      { margin: '0 0 4px', fontSize: 26, fontWeight: 700, color: '#1e3a5f' },
  subtitle:   { margin: 0, color: '#6b7280', fontSize: 14 },
  empty:      { textAlign: 'center', padding: '60px 24px', background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', marginBottom: 28 },

  // Card grid
  grid:  { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20, marginBottom: 32 },
  certCard:   { background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  certHeader: { padding: '20px' },
  certHeaderInner: { display: 'flex', gap: 14, alignItems: 'center' },
  certMedal:  { fontSize: 34, flexShrink: 0 },
  certTitle:  { color: '#fff', fontWeight: 700, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  certOrg:    { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 3 },
  certBody:   { padding: '16px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 },
  certRow:    { display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#374151', borderBottom: '1px solid #f9fafb', paddingBottom: 6 },
  certRowLabel: { color: '#9ca3af', fontWeight: 500 },
  certRowValue: { fontWeight: 600, color: '#1e3a5f' },
  vcodeRow:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  vcodeLabel: { fontSize: 12, color: '#9ca3af' },
  vcode:      { fontFamily: 'monospace', background: '#f3f4f6', padding: '2px 8px', borderRadius: 6, fontSize: 11, letterSpacing: 1 },
  certActions:{ padding: '12px 20px', borderTop: '1px solid #f3f4f6', display: 'flex', gap: 10 },
  dlBtn:      { flex: 1, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '8px', cursor: 'pointer', fontSize: 12, fontWeight: 600 },
  copyBtn:    { background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600 },

  // Org table
  tableWrap:  { overflowX: 'auto', background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb', marginBottom: 32 },
  table:      { width: '100%', borderCollapse: 'collapse' },
  th:         { padding: '12px 16px', background: '#f8fafc', fontSize: 12, fontWeight: 700, color: '#6b7280', textAlign: 'left', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid #e5e7eb' },
  tr:         { borderBottom: '1px solid #f3f4f6' },
  td:         { padding: '12px 16px', fontSize: 13, color: '#374151', verticalAlign: 'middle' },
  volCell:    { display: 'flex', alignItems: 'center', gap: 10 },
  volAvatar:  { width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 },
  volInitial: { width: 32, height: 32, borderRadius: '50%', background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 },
  smallDlBtn: { background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600 },

  // Verify
  verifySection: { background: '#fff', borderRadius: 12, padding: '24px 28px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb' },
  verifyTitle:   { margin: '0 0 6px', fontSize: 18, fontWeight: 700, color: '#1e3a5f' },
  verifyDesc:    { margin: '0 0 16px', fontSize: 13, color: '#6b7280' },
  verifyForm:    { display: 'flex', gap: 12, flexWrap: 'wrap' },
  verifyInput:   { flex: 1, minWidth: 200, border: '1px solid #d1d5db', borderRadius: 8, padding: '10px 14px', fontSize: 14, outline: 'none', fontFamily: 'monospace', letterSpacing: 1 },
  verifyBtn:     { background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', cursor: 'pointer', fontWeight: 600, fontSize: 14 },
  verifyResult:  { marginTop: 16, padding: '16px 20px', borderRadius: 10, border: '1px solid' },
  verifyGrid:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px' },
  verifyRow:     { display: 'flex', flexDirection: 'column', gap: 2 },
  verifyLabel:   { fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 },
  verifyValue:   { fontSize: 13, color: '#1e3a5f', fontWeight: 600 },
};

export default Certificates;
