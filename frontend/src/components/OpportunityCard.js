import React from 'react';
import { Link } from 'react-router-dom';

const categoryColors = {
  education: '#3b82f6', environment: '#10b981', health: '#ef4444',
  community: '#f59e0b', technology: '#8b5cf6', arts: '#ec4899',
  sports: '#14b8a6', other: '#6b7280',
};

const OpportunityCard = ({ opportunity, matchScore, matchedSkills, skillGap, onApply, showApply = false }) => {
  const color = categoryColors[opportunity.category] || '#6b7280';
  const matchPct = matchScore != null ? Math.round(matchScore * 100) : null;

  return (
    <div style={styles.card}>
      <div style={{ ...styles.categoryBadge, background: color }}>
        {opportunity.category}
      </div>

      {matchPct !== null && (
        <div style={{ ...styles.matchBadge, background: matchPct >= 70 ? '#10b981' : matchPct >= 40 ? '#f59e0b' : '#6b7280' }}>
          {matchPct}% match
        </div>
      )}

      <h3 style={styles.title}>{opportunity.title}</h3>

      <p style={styles.org}>
        🏢 {opportunity.organizationId?.organizationName || opportunity.organizationId?.name || 'Organization'}
      </p>

      <p style={styles.description}>{opportunity.description?.slice(0, 120)}...</p>

      <div style={styles.meta}>
        <span style={styles.metaTag}>⏱ {opportunity.duration}</span>
        {opportunity.location?.isRemote && <span style={{ ...styles.metaTag, background: '#ede9fe', color: '#7c3aed' }}>🌐 Remote</span>}
        {opportunity.hoursPerWeek && <span style={styles.metaTag}>📅 {opportunity.hoursPerWeek}h/week</span>}
      </div>

      {matchedSkills?.length > 0 && (
        <div style={styles.skillsRow}>
          <span style={styles.skillLabel}>Matched skills:</span>
          {matchedSkills.slice(0, 3).map(s => <span key={s} style={styles.skillTag}>{s}</span>)}
        </div>
      )}

      {skillGap?.length > 0 && (
        <div style={styles.skillsRow}>
          <span style={{ ...styles.skillLabel, color: '#ef4444' }}>Skill gap:</span>
          {skillGap.slice(0, 2).map(s => <span key={s} style={{ ...styles.skillTag, background: '#fee2e2', color: '#b91c1c' }}>{s}</span>)}
        </div>
      )}

      <div style={styles.actions}>
        {opportunity._id ? (
          <Link to={`/opportunities/${opportunity._id}`} style={styles.detailsBtn}>View Details</Link>
        ) : (
          <span style={{ ...styles.detailsBtn, opacity: 0.4, cursor: 'not-allowed' }}>View Details</span>
        )}
        {showApply && onApply && opportunity._id && (
          <button onClick={() => onApply(opportunity._id)} style={styles.applyBtn}>Apply Now</button>
        )}
      </div>
    </div>
  );
};

const styles = {
  card: { background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb', position: 'relative', display: 'flex', flexDirection: 'column', gap: 10 },
  categoryBadge: { position: 'absolute', top: 16, right: 16, color: '#fff', fontSize: 11, padding: '3px 10px', borderRadius: 20, textTransform: 'capitalize', fontWeight: 600 },
  matchBadge: { position: 'absolute', top: 40, right: 16, color: '#fff', fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 700 },
  title: { margin: 0, fontSize: 17, fontWeight: 700, color: '#1e3a5f', paddingRight: 80 },
  org: { margin: 0, fontSize: 13, color: '#6b7280' },
  description: { margin: 0, fontSize: 13, color: '#4b5563', lineHeight: 1.5 },
  meta: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  metaTag: { background: '#f3f4f6', color: '#374151', fontSize: 12, padding: '3px 10px', borderRadius: 20 },
  skillsRow: { display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' },
  skillLabel: { fontSize: 12, color: '#6b7280', fontWeight: 600 },
  skillTag: { background: '#dbeafe', color: '#1d4ed8', fontSize: 11, padding: '2px 8px', borderRadius: 20 },
  actions: { display: 'flex', gap: 10, marginTop: 4 },
  detailsBtn: { fontSize: 13, padding: '7px 16px', borderRadius: 8, border: '1px solid #2563eb', color: '#2563eb', textDecoration: 'none', fontWeight: 600 },
  applyBtn: { fontSize: 13, padding: '7px 16px', borderRadius: 8, background: '#2563eb', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 },
};

export default OpportunityCard;
