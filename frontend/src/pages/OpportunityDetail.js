import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { opportunityAPI, applicationAPI, matchingAPI } from '../services/api';

const categoryColors = {
  education: '#3b82f6', environment: '#10b981', health: '#ef4444',
  community: '#f59e0b', technology: '#8b5cf6', arts: '#ec4899',
  sports: '#14b8a6', other: '#6b7280',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const InfoRow = ({ icon, label, value }) => (
  value ? (
    <div style={styles.infoRow}>
      <span style={styles.infoIcon}>{icon}</span>
      <div>
        <div style={styles.infoLabel}>{label}</div>
        <div style={styles.infoValue}>{value}</div>
      </div>
    </div>
  ) : null
);

const SkillTag = ({ label, variant = 'default' }) => {
  const variants = {
    default: { background: '#dbeafe', color: '#1d4ed8' },
    matched: { background: '#dcfce7', color: '#166534' },
    gap:     { background: '#fee2e2', color: '#b91c1c' },
    interest:{ background: '#ede9fe', color: '#7c3aed' },
  };
  return (
    <span style={{ ...styles.tag, ...variants[variant] }}>{label}</span>
  );
};

const MatchMeter = ({ pct }) => {
  const color = pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444';
  return (
    <div style={styles.meterWrap}>
      <div style={styles.meterTrack}>
        <div style={{ ...styles.meterFill, width: `${pct}%`, background: color }} />
      </div>
      <span style={{ ...styles.meterLabel, color }}>{pct}% match</span>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────

const OpportunityDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [opportunity, setOpportunity]   = useState(null);
  const [matchData,   setMatchData]     = useState(null);
  const [status,      setStatus]        = useState('loading'); // 'loading' | 'ready' | 'error' | 'notfound'
  const [errorMsg,    setErrorMsg]      = useState('');

  // Apply modal state
  const [showApply,   setShowApply]     = useState(false);
  const [coverLetter, setCoverLetter]   = useState('');
  const [applying,    setApplying]      = useState(false);
  const [applyResult, setApplyResult]   = useState(null); // 'success' | 'error'
  const [applyMsg,    setApplyMsg]      = useState('');

  // ── Fetch opportunity ──────────────────────────────────────────────────────
  const fetchOpportunity = useCallback(async () => {
    if (!id || id === 'undefined') {
      setStatus('error');
      setErrorMsg('Invalid opportunity link — no ID provided.');
      return;
    }

    setStatus('loading');
    try {
      const res = await opportunityAPI.getById(id);
      setOpportunity(res.data);
      setStatus('ready');
    } catch (err) {
      if (err.response?.status === 404) {
        setStatus('notfound');
      } else {
        setStatus('error');
        setErrorMsg(err.response?.data?.message || 'Failed to load opportunity. Please try again.');
      }
    }
  }, [id]);

  // ── Fetch AI match score (volunteers only, non-blocking) ───────────────────
  const fetchMatchScore = useCallback(async () => {
    if (!user || user.role !== 'volunteer' || !id) return;
    try {
      const res = await matchingAPI.getScore(id);
      setMatchData(res.data);
    } catch {
      // Match score is non-critical — silently skip
    }
  }, [user, id]);

  useEffect(() => {
    fetchOpportunity();
  }, [fetchOpportunity]);

  useEffect(() => {
    if (status === 'ready') fetchMatchScore();
  }, [status, fetchMatchScore]);

  // ── Apply handler ──────────────────────────────────────────────────────────
  const handleApply = async () => {
    setApplying(true);
    setApplyResult(null);
    try {
      await applicationAPI.apply({ opportunityId: id, coverLetter });
      setApplyResult('success');
      setApplyMsg('Application submitted! The organization will review and respond.');
      setShowApply(false);
      setCoverLetter('');
    } catch (err) {
      setApplyResult('error');
      setApplyMsg(err.response?.data?.message || 'Failed to submit application. Please try again.');
    } finally {
      setApplying(false);
    }
  };

  // ── Render: Loading ────────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <div style={styles.centeredPage}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Loading opportunity details...</p>
      </div>
    );
  }

  // ── Render: Not found ──────────────────────────────────────────────────────
  if (status === 'notfound') {
    return (
      <div style={styles.centeredPage}>
        <div style={styles.stateIcon}>🔍</div>
        <h2 style={styles.stateTitle}>Opportunity Not Found</h2>
        <p style={styles.stateText}>This opportunity may have been removed or the link is incorrect.</p>
        <Link to="/opportunities" style={styles.backBtn}>Browse All Opportunities</Link>
      </div>
    );
  }

  // ── Render: Error ──────────────────────────────────────────────────────────
  if (status === 'error') {
    return (
      <div style={styles.centeredPage}>
        <div style={styles.stateIcon}>⚠️</div>
        <h2 style={styles.stateTitle}>Something Went Wrong</h2>
        <p style={styles.stateText}>{errorMsg}</p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={fetchOpportunity} style={styles.retryBtn}>Try Again</button>
          <Link to="/opportunities" style={styles.backBtn}>Back to Listings</Link>
        </div>
      </div>
    );
  }

  // ── Render: Ready ──────────────────────────────────────────────────────────
  const catColor = categoryColors[opportunity.category] || '#6b7280';
  const orgName  = opportunity.organizationId?.organizationName || opportunity.organizationId?.name || 'Organization';
  const isVolunteer = user?.role === 'volunteer';

  return (
    <div style={styles.page}>
      {/* ── Breadcrumb ── */}
      <div style={styles.breadcrumb}>
        <Link to="/opportunities" style={styles.breadcrumbLink}>← Back to Opportunities</Link>
      </div>

      {/* ── Hero banner ── */}
      <div style={{ ...styles.hero, borderTop: `6px solid ${catColor}` }}>
        <div style={styles.heroTop}>
          <span style={{ ...styles.categoryBadge, background: catColor }}>{opportunity.category}</span>
          {!opportunity.isActive && (
            <span style={styles.inactiveBadge}>Closed</span>
          )}
          {opportunity.location?.isRemote && (
            <span style={styles.remoteBadge}>🌐 Remote</span>
          )}
        </div>

        <h1 style={styles.title}>{opportunity.title}</h1>

        <p style={styles.orgLine}>
          🏢 <strong>{orgName}</strong>
          {opportunity.organizationId?.bio && (
            <span style={styles.orgBio}> — {opportunity.organizationId.bio.slice(0, 80)}...</span>
          )}
        </p>

        {/* Match meter — volunteer only */}
        {isVolunteer && matchData && (
          <div style={styles.matchSection}>
            <MatchMeter pct={matchData.matchPercentage} />
          </div>
        )}
      </div>

      {/* ── Body layout ── */}
      <div style={styles.body}>

        {/* ── Left: main content ── */}
        <div style={styles.main}>

          {/* Description */}
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>About this Opportunity</h2>
            <p style={styles.description}>{opportunity.description}</p>
          </section>

          {/* Skills required */}
          {opportunity.skills_required?.length > 0 && (
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>Skills Required</h2>
              <div style={styles.tagRow}>
                {opportunity.skills_required.map(s => (
                  <SkillTag
                    key={s}
                    label={s}
                    variant={
                      matchData?.matchedSkills?.includes(s) ? 'matched' :
                      matchData?.skillGap?.includes(s)      ? 'gap'     : 'default'
                    }
                  />
                ))}
              </div>
              {isVolunteer && matchData && (matchData.matchedSkills?.length > 0 || matchData.skillGap?.length > 0) && (
                <div style={styles.skillLegend}>
                  {matchData.matchedSkills?.length > 0 && <span style={styles.legendItem}><span style={{ ...styles.dot, background: '#10b981' }} />You have this skill</span>}
                  {matchData.skillGap?.length > 0      && <span style={styles.legendItem}><span style={{ ...styles.dot, background: '#ef4444' }} />Skill gap — opportunity to learn</span>}
                </div>
              )}
            </section>
          )}

          {/* Interest areas */}
          {opportunity.interests_matched?.length > 0 && (
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>Interest Areas</h2>
              <div style={styles.tagRow}>
                {opportunity.interests_matched.map(i => <SkillTag key={i} label={i} variant="interest" />)}
              </div>
            </section>
          )}

          {/* AI match breakdown — volunteer only */}
          {isVolunteer && matchData && (
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>🤖 Your Match Breakdown</h2>
              <div style={styles.breakdownGrid}>
                <BreakdownBar label="Interest Match" value={matchData.breakdown?.interestMatch} color="#8b5cf6" />
                <BreakdownBar label="Skill Match"    value={matchData.breakdown?.skillMatch}    color="#3b82f6" />
                <BreakdownBar label="Semantic Fit"   value={matchData.breakdown?.semanticScore} color="#10b981" />
              </div>
            </section>
          )}
        </div>

        {/* ── Right: sidebar ── */}
        <div style={styles.sidebar}>

          {/* Apply card */}
          <div style={styles.applyCard}>
            {applyResult === 'success' && (
              <div style={styles.successMsg}>✅ {applyMsg}</div>
            )}
            {applyResult === 'error' && (
              <div style={styles.errorMsg}>❌ {applyMsg}</div>
            )}

            {isVolunteer && opportunity.isActive ? (
              <>
                {!showApply ? (
                  <button
                    onClick={() => user ? setShowApply(true) : navigate('/login')}
                    style={styles.applyBtn}
                    disabled={applyResult === 'success'}
                  >
                    {applyResult === 'success' ? '✓ Applied' : 'Apply Now'}
                  </button>
                ) : (
                  <div style={styles.applyForm}>
                    <label style={styles.applyLabel}>Cover Letter <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></label>
                    <textarea
                      value={coverLetter}
                      onChange={e => setCoverLetter(e.target.value)}
                      placeholder="Briefly describe why you're interested and what you'll bring to this role..."
                      style={styles.applyTextarea}
                    />
                    <div style={styles.applyActions}>
                      <button onClick={handleApply} disabled={applying} style={styles.applyBtn}>
                        {applying ? 'Submitting...' : 'Submit Application'}
                      </button>
                      <button onClick={() => { setShowApply(false); setCoverLetter(''); }} style={styles.cancelBtn}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : !user ? (
              <Link to="/login" style={styles.applyBtn}>Login to Apply</Link>
            ) : (
              <div style={styles.closedNote}>This opportunity is currently closed.</div>
            )}
          </div>

          {/* Details card */}
          <div style={styles.detailsCard}>
            <h3 style={styles.detailsTitle}>Details</h3>
            <InfoRow icon="⏱" label="Duration"        value={opportunity.duration} />
            <InfoRow icon="📅" label="Hours / Week"    value={opportunity.hoursPerWeek ? `${opportunity.hoursPerWeek}h` : null} />
            <InfoRow icon="👥" label="Max Volunteers"  value={opportunity.maxVolunteers} />
            <InfoRow icon="📍" label="Location"
              value={
                opportunity.location?.isRemote
                  ? 'Remote — work from anywhere'
                  : opportunity.location?.address || 'On-site'
              }
            />
            <InfoRow icon="🗓" label="Posted"
              value={new Date(opportunity.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            />
            {opportunity.startDate && (
              <InfoRow icon="▶️" label="Start Date" value={new Date(opportunity.startDate).toLocaleDateString()} />
            )}
            {opportunity.endDate && (
              <InfoRow icon="⏹️" label="End Date" value={new Date(opportunity.endDate).toLocaleDateString()} />
            )}
          </div>

          {/* Organization card */}
          <div style={styles.detailsCard}>
            <h3 style={styles.detailsTitle}>Organization</h3>
            <p style={styles.orgCardName}>{orgName}</p>
            {opportunity.organizationId?.bio && (
              <p style={styles.orgCardBio}>{opportunity.organizationId.bio}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Breakdown bar sub-component ───────────────────────────────────────────────
const BreakdownBar = ({ label, value, color }) => {
  const pct = value != null ? Math.round(value * 100) : 0;
  return (
    <div style={styles.bbRow}>
      <div style={styles.bbLabel}>{label}</div>
      <div style={styles.bbTrack}>
        <div style={{ ...styles.bbFill, width: `${pct}%`, background: color }} />
      </div>
      <div style={{ ...styles.bbPct, color }}>{pct}%</div>
    </div>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  page: {
    maxWidth: 1100, margin: '0 auto', padding: '24px 24px 48px',
  },

  // States
  centeredPage: {
    minHeight: '60vh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 16, textAlign: 'center', padding: 48,
  },
  spinner: {
    width: 40, height: 40, border: '3px solid #e5e7eb',
    borderTop: '3px solid #2563eb', borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: { color: '#6b7280', fontSize: 15, margin: 0 },
  stateIcon:  { fontSize: 52 },
  stateTitle: { margin: '0 0 8px', fontSize: 22, fontWeight: 700, color: '#1e3a5f' },
  stateText:  { margin: 0, color: '#6b7280', maxWidth: 380, lineHeight: 1.6 },
  retryBtn: {
    background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8,
    padding: '10px 24px', cursor: 'pointer', fontWeight: 600, fontSize: 14,
  },
  backBtn: {
    background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 8,
    padding: '10px 24px', cursor: 'pointer', fontWeight: 600, fontSize: 14,
    textDecoration: 'none', display: 'inline-block',
  },

  // Breadcrumb
  breadcrumb: { marginBottom: 20 },
  breadcrumbLink: { color: '#2563eb', textDecoration: 'none', fontSize: 14, fontWeight: 500 },

  // Hero
  hero: {
    background: '#fff', borderRadius: '0 0 12px 12px', padding: '28px 32px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb',
    marginBottom: 24,
  },
  heroTop: { display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' },
  categoryBadge: {
    color: '#fff', fontSize: 12, padding: '4px 14px', borderRadius: 20,
    textTransform: 'capitalize', fontWeight: 700,
  },
  inactiveBadge: {
    background: '#fee2e2', color: '#b91c1c', fontSize: 12,
    padding: '4px 14px', borderRadius: 20, fontWeight: 700,
  },
  remoteBadge: {
    background: '#ede9fe', color: '#7c3aed', fontSize: 12,
    padding: '4px 14px', borderRadius: 20, fontWeight: 600,
  },
  title: { margin: '0 0 10px', fontSize: 28, fontWeight: 800, color: '#1e3a5f', lineHeight: 1.25 },
  orgLine: { margin: '0 0 16px', fontSize: 14, color: '#6b7280' },
  orgBio: { fontWeight: 400, color: '#9ca3af' },
  matchSection: { marginTop: 4 },

  // Match meter
  meterWrap: { display: 'flex', alignItems: 'center', gap: 12 },
  meterTrack: { flex: 1, maxWidth: 260, height: 8, background: '#e5e7eb', borderRadius: 99, overflow: 'hidden' },
  meterFill:  { height: '100%', borderRadius: 99, transition: 'width 0.6s ease' },
  meterLabel: { fontSize: 14, fontWeight: 700, minWidth: 80 },

  // Layout
  body: { display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' },
  main: { display: 'flex', flexDirection: 'column', gap: 20 },
  sidebar: { display: 'flex', flexDirection: 'column', gap: 16 },

  // Sections
  section: {
    background: '#fff', borderRadius: 12, padding: '24px 28px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb',
  },
  sectionTitle: { margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#1e3a5f' },
  description:  { margin: 0, color: '#374151', lineHeight: 1.75, fontSize: 14 },

  // Tags
  tagRow: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  tag:    { fontSize: 12, padding: '4px 12px', borderRadius: 20, fontWeight: 600 },
  skillLegend: { display: 'flex', gap: 20, marginTop: 12 },
  legendItem:  { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6b7280' },
  dot: { width: 8, height: 8, borderRadius: '50%', display: 'inline-block' },

  // Match breakdown bars
  breakdownGrid: { display: 'flex', flexDirection: 'column', gap: 12 },
  bbRow: { display: 'flex', alignItems: 'center', gap: 12 },
  bbLabel: { width: 120, fontSize: 13, color: '#374151', fontWeight: 500, flexShrink: 0 },
  bbTrack: { flex: 1, height: 8, background: '#e5e7eb', borderRadius: 99, overflow: 'hidden' },
  bbFill:  { height: '100%', borderRadius: 99, transition: 'width 0.5s ease' },
  bbPct:   { width: 36, fontSize: 13, fontWeight: 700, textAlign: 'right' },

  // Apply card
  applyCard: {
    background: '#fff', borderRadius: 12, padding: 24,
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb',
  },
  applyBtn: {
    display: 'block', width: '100%', background: '#2563eb', color: '#fff',
    border: 'none', borderRadius: 8, padding: '13px', fontSize: 15,
    fontWeight: 700, cursor: 'pointer', textAlign: 'center', textDecoration: 'none',
  },
  applyForm: { display: 'flex', flexDirection: 'column', gap: 12 },
  applyLabel: { fontSize: 13, fontWeight: 600, color: '#374151' },
  applyTextarea: {
    border: '1px solid #d1d5db', borderRadius: 8, padding: '10px 12px',
    fontSize: 13, height: 110, resize: 'vertical', fontFamily: 'inherit', outline: 'none',
  },
  applyActions: { display: 'flex', flexDirection: 'column', gap: 8 },
  cancelBtn: {
    background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 8,
    padding: '10px', fontSize: 14, cursor: 'pointer', fontWeight: 600,
  },
  closedNote: {
    background: '#f3f4f6', color: '#6b7280', padding: '12px 16px',
    borderRadius: 8, fontSize: 13, textAlign: 'center',
  },
  successMsg: {
    background: '#f0fdf4', color: '#166534', padding: '10px 14px',
    borderRadius: 8, fontSize: 13, marginBottom: 12, fontWeight: 500,
  },
  errorMsg: {
    background: '#fef2f2', color: '#b91c1c', padding: '10px 14px',
    borderRadius: 8, fontSize: 13, marginBottom: 12, fontWeight: 500,
  },

  // Details card
  detailsCard: {
    background: '#fff', borderRadius: 12, padding: '20px 24px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb',
    display: 'flex', flexDirection: 'column', gap: 14,
  },
  detailsTitle: { margin: 0, fontSize: 14, fontWeight: 700, color: '#1e3a5f' },
  infoRow: { display: 'flex', gap: 12, alignItems: 'flex-start' },
  infoIcon: { fontSize: 16, marginTop: 1, flexShrink: 0 },
  infoLabel: { fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  infoValue: { fontSize: 13, color: '#374151', fontWeight: 500 },

  // Org card
  orgCardName: { margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: '#1e3a5f' },
  orgCardBio:  { margin: 0, fontSize: 13, color: '#6b7280', lineHeight: 1.6 },
};

// Inject keyframe animation for spinner once
if (typeof document !== 'undefined' && !document.getElementById('im-spin-style')) {
  const style = document.createElement('style');
  style.id = 'im-spin-style';
  style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
  document.head.appendChild(style);
}

export default OpportunityDetail;
