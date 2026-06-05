import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { certificateAPI } from '../services/api';

const VerifyCertificate = () => {
  const { code } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(!!code);
  const [manualCode, setManualCode] = useState('');

  useEffect(() => {
    if (code) {
      certificateAPI.verify(code)
        .then(r => setResult({ success: true, data: r.data }))
        .catch(() => setResult({ success: false }))
        .finally(() => setLoading(false));
    }
  }, [code]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await certificateAPI.verify(manualCode);
      setResult({ success: true, data: res.data });
    } catch {
      setResult({ success: false });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <span style={styles.logo}>🌱</span>
          <h1 style={styles.title}>Certificate Verification</h1>
          <p style={styles.subtitle}>ImpactMatch — Volunteer Credential Verification Portal</p>
        </div>

        {!code && (
          <form onSubmit={handleVerify} style={styles.form}>
            <input
              value={manualCode}
              onChange={e => setManualCode(e.target.value)}
              placeholder="Enter verification code..."
              style={styles.input}
              required
            />
            <button type="submit" disabled={loading} style={styles.btn}>
              {loading ? 'Verifying...' : 'Verify Certificate'}
            </button>
          </form>
        )}

        {loading && <div style={styles.loading}>Verifying certificate...</div>}

        {result && (
          <div style={{ ...styles.result, background: result.success ? '#f0fdf4' : '#fef2f2', border: `1px solid ${result.success ? '#86efac' : '#fca5a5'}` }}>
            {result.success ? (
              <>
                <div style={styles.verifiedHeader}>
                  <span style={styles.verifiedIcon}>✅</span>
                  <h2 style={styles.verifiedTitle}>Certificate Verified</h2>
                </div>
                <div style={styles.detailsGrid}>
                  <div style={styles.detailRow}><span style={styles.detailLabel}>Volunteer</span><span style={styles.detailValue}>{result.data.certificate.volunteerName}</span></div>
                  <div style={styles.detailRow}><span style={styles.detailLabel}>Organization</span><span style={styles.detailValue}>{result.data.certificate.organization}</span></div>
                  <div style={styles.detailRow}><span style={styles.detailLabel}>Opportunity</span><span style={styles.detailValue}>{result.data.certificate.opportunityTitle}</span></div>
                  <div style={styles.detailRow}><span style={styles.detailLabel}>Category</span><span style={{ ...styles.detailValue, textTransform: 'capitalize' }}>{result.data.certificate.category}</span></div>
                  <div style={styles.detailRow}><span style={styles.detailLabel}>Duration</span><span style={styles.detailValue}>{result.data.certificate.duration}</span></div>
                  {result.data.certificate.hoursCompleted && <div style={styles.detailRow}><span style={styles.detailLabel}>Hours Completed</span><span style={styles.detailValue}>{result.data.certificate.hoursCompleted}h</span></div>}
                  <div style={styles.detailRow}><span style={styles.detailLabel}>Issue Date</span><span style={styles.detailValue}>{new Date(result.data.certificate.issueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
                  <div style={styles.detailRow}><span style={styles.detailLabel}>Certificate ID</span><span style={{ ...styles.detailValue, fontFamily: 'monospace', fontSize: 12 }}>{result.data.certificate.certificateId}</span></div>
                </div>
                <div style={styles.validBadge}>🛡️ This is an authentic ImpactMatch certificate</div>
              </>
            ) : (
              <div style={styles.invalidSection}>
                <span style={styles.invalidIcon}>❌</span>
                <h2 style={styles.invalidTitle}>Certificate Not Found</h2>
                <p style={styles.invalidText}>This certificate code is invalid, expired, or has been revoked.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  page: { minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { background: '#fff', borderRadius: 16, padding: '40px 36px', width: '100%', maxWidth: 560, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' },
  header: { textAlign: 'center', marginBottom: 32 },
  logo: { fontSize: 40 },
  title: { margin: '12px 0 8px', fontSize: 24, fontWeight: 700, color: '#1e3a5f' },
  subtitle: { margin: 0, color: '#6b7280', fontSize: 14 },
  form: { display: 'flex', gap: 12, marginBottom: 24 },
  input: { flex: 1, border: '1px solid #d1d5db', borderRadius: 8, padding: '10px 14px', fontSize: 14, outline: 'none' },
  btn: { background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' },
  loading: { textAlign: 'center', color: '#6b7280', padding: 24 },
  result: { borderRadius: 12, padding: 24 },
  verifiedHeader: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 },
  verifiedIcon: { fontSize: 28 },
  verifiedTitle: { margin: 0, fontSize: 20, fontWeight: 700, color: '#166534' },
  detailsGrid: { display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 },
  detailRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #dcfce7' },
  detailLabel: { fontSize: 13, color: '#6b7280', fontWeight: 600 },
  detailValue: { fontSize: 13, color: '#1e3a5f', fontWeight: 500, textAlign: 'right', maxWidth: '60%' },
  validBadge: { background: '#dcfce7', color: '#166534', padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, textAlign: 'center' },
  invalidSection: { textAlign: 'center', padding: '24px 0' },
  invalidIcon: { fontSize: 40 },
  invalidTitle: { margin: '12px 0 8px', fontSize: 20, fontWeight: 700, color: '#b91c1c' },
  invalidText: { margin: 0, color: '#6b7280', fontSize: 14 },
};

export default VerifyCertificate;
