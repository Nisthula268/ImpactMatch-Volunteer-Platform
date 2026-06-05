import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { opportunityAPI } from '../services/api';

const SKILL_OPTIONS = [
  'JavaScript', 'Python', 'React', 'Teaching', 'Marketing', 'Design',
  'Data Analysis', 'Writing', 'Leadership', 'Healthcare', 'Construction',
  'Music', 'Photography', 'Management',
];
const CATEGORIES = ['education', 'environment', 'health', 'community', 'technology', 'arts', 'sports', 'other'];

const EditOpportunity = () => {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(null);            // null = loading
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [fetchError, setFetchError]         = useState('');
  const [saving,     setSaving]             = useState(false);
  const [saveError,  setSaveError]          = useState('');

  // ── Load existing opportunity ─────────────────────────────────────────────
  const loadOpportunity = useCallback(async () => {
    setFetchError('');
    try {
      const { data } = await opportunityAPI.getById(id);
      setForm({
        title:        data.title        || '',
        description:  data.description  || '',
        category:     data.category     || 'education',
        duration:     data.duration     || '',
        hoursPerWeek: data.hoursPerWeek || '',
        maxVolunteers:data.maxVolunteers || 10,
        isActive:     data.isActive     !== false,
        startDate:    data.startDate    ? data.startDate.slice(0, 10) : '',
        endDate:      data.endDate      ? data.endDate.slice(0, 10)   : '',
        location: {
          address:   data.location?.address   || '',
          latitude:  data.location?.latitude  || '',
          longitude: data.location?.longitude || '',
          isRemote:  data.location?.isRemote  || false,
        },
      });
      setSelectedSkills(data.skills_required || []);
    } catch (err) {
      setFetchError(err.response?.data?.message || 'Failed to load opportunity.');
    }
  }, [id]);

  useEffect(() => { loadOpportunity(); }, [loadOpportunity]);

  // ── Skills toggle ─────────────────────────────────────────────────────────
  const toggleSkill = (s) =>
    setSelectedSkills(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );

  // ── Form helpers ──────────────────────────────────────────────────────────
  const set    = (field, val) => setForm(f => ({ ...f, [field]: val }));
  const setLoc = (field, val) => setForm(f => ({ ...f, location: { ...f.location, [field]: val } }));

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveError('');
    setSaving(true);
    try {
      await opportunityAPI.update(id, {
        ...form,
        skills_required: selectedSkills,
        hoursPerWeek:    form.hoursPerWeek ? parseInt(form.hoursPerWeek) : undefined,
        maxVolunteers:   form.maxVolunteers ? parseInt(form.maxVolunteers) : 10,
        location: {
          ...form.location,
          latitude:  form.location.latitude  ? parseFloat(form.location.latitude)  : undefined,
          longitude: form.location.longitude ? parseFloat(form.location.longitude) : undefined,
        },
        startDate: form.startDate || undefined,
        endDate:   form.endDate   || undefined,
      });
      navigate('/dashboard');
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (!form && !fetchError) return (
    <div style={styles.centeredPage}>
      <div style={styles.spinner} />
      <p style={{ color: '#6b7280' }}>Loading opportunity...</p>
    </div>
  );

  if (fetchError) return (
    <div style={styles.centeredPage}>
      <div style={{ fontSize: 40 }}>⚠️</div>
      <p style={{ color: '#b91c1c' }}>{fetchError}</p>
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={loadOpportunity} style={styles.retryBtn}>Try Again</button>
        <Link to="/dashboard" style={styles.backLink}>Back to Dashboard</Link>
      </div>
    </div>
  );

  return (
    <div style={styles.page}>

      {/* ── Breadcrumb ── */}
      <div style={styles.breadcrumb}>
        <Link to="/dashboard" style={styles.breadLink}>← Back to Dashboard</Link>
      </div>

      <h1 style={styles.title}>Edit Opportunity</h1>
      <p style={styles.subtitle}>Update the details below and save your changes.</p>

      {saveError && <div style={styles.errorBanner}>❌ {saveError}</div>}

      <form onSubmit={handleSubmit} style={styles.form}>

        {/* ── Basic info ── */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Basic Information</h2>

          <div style={styles.field}>
            <label style={styles.label}>Title *</label>
            <input
              value={form.title}
              onChange={e => set('title', e.target.value)}
              style={styles.input}
              placeholder="e.g. Math Tutor for High School Students"
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Description *</label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              style={{ ...styles.input, height: 130, resize: 'vertical' }}
              placeholder="Describe the role, responsibilities, and impact..."
              required
            />
          </div>

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Category *</label>
              <select value={form.category} onChange={e => set('category', e.target.value)} style={styles.input}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Duration *</label>
              <input
                value={form.duration}
                onChange={e => set('duration', e.target.value)}
                style={styles.input}
                placeholder="e.g. 3 months"
                required
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Hours / Week</label>
              <input
                type="number" min="1"
                value={form.hoursPerWeek}
                onChange={e => set('hoursPerWeek', e.target.value)}
                style={styles.input}
                placeholder="5"
              />
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Max Volunteers</label>
              <input
                type="number" min="1"
                value={form.maxVolunteers}
                onChange={e => set('maxVolunteers', e.target.value)}
                style={styles.input}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Start Date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={e => set('startDate', e.target.value)}
                style={styles.input}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>End Date</label>
              <input
                type="date"
                value={form.endDate}
                onChange={e => set('endDate', e.target.value)}
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Status</label>
            <select value={form.isActive} onChange={e => set('isActive', e.target.value === 'true')} style={styles.input}>
              <option value="true">Active — accepting applications</option>
              <option value="false">Inactive — closed</option>
            </select>
          </div>
        </div>

        {/* ── Required Skills ── */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Required Skills</h2>
          <div style={styles.tagsGrid}>
            {SKILL_OPTIONS.map(s => (
              <button
                type="button"
                key={s}
                onClick={() => toggleSkill(s)}
                style={{ ...styles.tag, ...(selectedSkills.includes(s) ? styles.tagActive : {}) }}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Custom skills */}
          <input
            style={{ ...styles.input, marginTop: 12 }}
            placeholder="Add custom skills (comma-separated)..."
            onBlur={e => {
              const custom = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
              setSelectedSkills(prev => [...new Set([...prev, ...custom])]);
              e.target.value = '';
            }}
          />

          {/* Current selection preview */}
          {selectedSkills.length > 0 && (
            <div style={styles.selectedSkills}>
              <span style={styles.selectedLabel}>Selected: </span>
              {selectedSkills.map(s => (
                <span key={s} style={styles.selectedChip}>
                  {s}
                  <button
                    type="button"
                    onClick={() => toggleSkill(s)}
                    style={styles.removeChip}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── Location ── */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Location</h2>
          <div style={styles.checkRow}>
            <input
              type="checkbox"
              id="isRemote"
              checked={form.location.isRemote}
              onChange={e => setLoc('isRemote', e.target.checked)}
            />
            <label htmlFor="isRemote" style={styles.checkLabel}>Remote opportunity</label>
          </div>

          {!form.location.isRemote && (
            <div style={styles.row}>
              <div style={{ ...styles.field, gridColumn: '1 / -1' }}>
                <label style={styles.label}>Address</label>
                <input
                  value={form.location.address}
                  onChange={e => setLoc('address', e.target.value)}
                  style={styles.input}
                  placeholder="123 Main St, City, Country"
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Latitude</label>
                <input
                  type="number" step="any"
                  value={form.location.latitude}
                  onChange={e => setLoc('latitude', e.target.value)}
                  style={styles.input}
                  placeholder="37.7749"
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Longitude</label>
                <input
                  type="number" step="any"
                  value={form.location.longitude}
                  onChange={e => setLoc('longitude', e.target.value)}
                  style={styles.input}
                  placeholder="-122.4194"
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Actions ── */}
        <div style={styles.actions}>
          <button type="submit" disabled={saving} style={{ ...styles.saveBtn, opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving...' : '💾 Save Changes'}
          </button>
          <Link to="/dashboard" style={styles.cancelBtn}>Cancel</Link>
        </div>
      </form>
    </div>
  );
};

const styles = {
  page:       { maxWidth: 820, margin: '0 auto', padding: '24px 24px 60px' },
  centeredPage: { minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, textAlign: 'center', padding: 48 },
  spinner:    { width: 36, height: 36, border: '3px solid #e5e7eb', borderTop: '3px solid #2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  retryBtn:   { background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', cursor: 'pointer', fontWeight: 600 },
  backLink:   { background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 8, padding: '10px 24px', textDecoration: 'none', fontWeight: 600, fontSize: 14 },

  breadcrumb: { marginBottom: 20 },
  breadLink:  { color: '#2563eb', textDecoration: 'none', fontSize: 14, fontWeight: 500 },

  title:    { margin: '0 0 4px', fontSize: 26, fontWeight: 800, color: '#1e3a5f' },
  subtitle: { margin: '0 0 24px', color: '#6b7280', fontSize: 14 },
  errorBanner: { background: '#fef2f2', color: '#b91c1c', border: '1px solid #fca5a5', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 14 },

  form:    { display: 'flex', flexDirection: 'column', gap: 24 },
  section: { background: '#fff', borderRadius: 12, padding: '24px 28px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: 16 },
  sectionTitle: { margin: 0, fontSize: 16, fontWeight: 700, color: '#1e3a5f' },

  row:   { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: '#374151' },
  input: { border: '1px solid #d1d5db', borderRadius: 8, padding: '10px 14px', fontSize: 14, outline: 'none', fontFamily: 'inherit' },

  tagsGrid: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  tag:      { padding: '5px 14px', borderRadius: 20, border: '1px solid #d1d5db', background: '#f9fafb', color: '#374151', fontSize: 12, cursor: 'pointer', transition: 'all 0.15s' },
  tagActive:{ background: '#2563eb', color: '#fff', borderColor: '#2563eb' },

  selectedSkills: { display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', paddingTop: 8 },
  selectedLabel:  { fontSize: 12, color: '#6b7280', fontWeight: 600 },
  selectedChip:   { display: 'inline-flex', alignItems: 'center', gap: 4, background: '#dcfce7', color: '#166534', fontSize: 12, padding: '3px 10px', borderRadius: 20, fontWeight: 500 },
  removeChip:     { background: 'none', border: 'none', cursor: 'pointer', color: '#166534', fontSize: 14, padding: 0, lineHeight: 1 },

  checkRow:   { display: 'flex', gap: 8, alignItems: 'center' },
  checkLabel: { fontSize: 14, color: '#374151', cursor: 'pointer' },

  actions:   { display: 'flex', gap: 12, alignItems: 'center' },
  saveBtn:   { background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '13px 32px', fontSize: 15, fontWeight: 700, cursor: 'pointer' },
  cancelBtn: { background: '#f3f4f6', color: '#374151', borderRadius: 8, padding: '13px 24px', fontSize: 14, fontWeight: 600, textDecoration: 'none' },
};

export default EditOpportunity;
