import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { opportunityAPI } from '../services/api';

const SKILLS = ['JavaScript', 'Python', 'React', 'Teaching', 'Marketing', 'Design', 'Data Analysis', 'Writing', 'Leadership', 'Healthcare', 'Construction', 'Music', 'Photography', 'Management'];

const PostOpportunity = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', description: '', category: 'education', duration: '', hoursPerWeek: '',
    location: { address: '', latitude: '', longitude: '', isRemote: false },
    maxVolunteers: 10,
  });
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleSkill = (s) => setSelectedSkills(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await opportunityAPI.create({
        ...form,
        skills_required: selectedSkills,
        interests_matched: interests,
        location: {
          ...form.location,
          latitude: form.location.latitude ? parseFloat(form.location.latitude) : undefined,
          longitude: form.location.longitude ? parseFloat(form.location.longitude) : undefined,
        },
        hoursPerWeek: form.hoursPerWeek ? parseInt(form.hoursPerWeek) : undefined,
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post opportunity');
    } finally {
      setLoading(false);
    }
  };

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));
  const setLoc = (field, value) => setForm(f => ({ ...f, location: { ...f.location, [field]: value } }));

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Post a New Opportunity</h1>
      {error && <div style={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Basic Information</h2>
          <div style={styles.field}>
            <label style={styles.label}>Title *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} style={styles.input} placeholder="e.g., Math Tutor for High School Students" required />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Description *</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} style={{ ...styles.input, height: 120, resize: 'vertical' }} placeholder="Describe the opportunity, responsibilities, and impact..." required />
          </div>
          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Category *</label>
              <select value={form.category} onChange={e => set('category', e.target.value)} style={styles.input}>
                {['education', 'environment', 'health', 'community', 'technology', 'arts', 'sports', 'other'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Duration *</label>
              <input value={form.duration} onChange={e => set('duration', e.target.value)} style={styles.input} placeholder="e.g., 3 months" required />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Hours/Week</label>
              <input type="number" value={form.hoursPerWeek} onChange={e => set('hoursPerWeek', e.target.value)} style={styles.input} placeholder="5" min="1" />
            </div>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Max Volunteers</label>
            <input type="number" value={form.maxVolunteers} onChange={e => set('maxVolunteers', e.target.value)} style={styles.input} min="1" />
          </div>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Required Skills</h2>
          <div style={styles.tagsGrid}>
            {SKILLS.map(s => (
              <button type="button" key={s} onClick={() => toggleSkill(s)}
                style={{ ...styles.tag, ...(selectedSkills.includes(s) ? styles.tagActive : {}) }}>
                {s}
              </button>
            ))}
          </div>
          <input
            style={{ ...styles.input, marginTop: 12 }}
            placeholder="Or type custom skills separated by commas..."
            onBlur={e => {
              const custom = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
              setSelectedSkills(prev => [...new Set([...prev, ...custom])]);
              e.target.value = '';
            }}
          />
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Location</h2>
          <div style={styles.checkRow}>
            <input type="checkbox" id="remote" checked={form.location.isRemote} onChange={e => setLoc('isRemote', e.target.checked)} />
            <label htmlFor="remote" style={{ fontSize: 14, color: '#374151', cursor: 'pointer' }}>This is a remote opportunity</label>
          </div>
          {!form.location.isRemote && (
            <div style={styles.row}>
              <div style={{ ...styles.field, gridColumn: '1/-1' }}>
                <label style={styles.label}>Address</label>
                <input value={form.location.address} onChange={e => setLoc('address', e.target.value)} style={styles.input} placeholder="123 Main St, City, Country" />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Latitude (for check-in)</label>
                <input type="number" step="any" value={form.location.latitude} onChange={e => setLoc('latitude', e.target.value)} style={styles.input} placeholder="37.7749" />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Longitude (for check-in)</label>
                <input type="number" step="any" value={form.location.longitude} onChange={e => setLoc('longitude', e.target.value)} style={styles.input} placeholder="-122.4194" />
              </div>
            </div>
          )}
        </div>

        <button type="submit" disabled={loading} style={styles.submitBtn}>
          {loading ? 'Posting...' : 'Post Opportunity'}
        </button>
      </form>
    </div>
  );
};

const styles = {
  page: { maxWidth: 800, margin: '0 auto', padding: '32px 24px' },
  title: { margin: '0 0 24px', fontSize: 26, fontWeight: 700, color: '#1e3a5f' },
  error: { background: '#fee2e2', color: '#b91c1c', padding: '10px 16px', borderRadius: 8, marginBottom: 20, fontSize: 14 },
  form: { display: 'flex', flexDirection: 'column', gap: 24 },
  section: { background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: 16 },
  sectionTitle: { margin: 0, fontSize: 16, fontWeight: 700, color: '#1e3a5f' },
  row: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: '#374151' },
  input: { border: '1px solid #d1d5db', borderRadius: 8, padding: '10px 14px', fontSize: 14, outline: 'none', fontFamily: 'inherit' },
  tagsGrid: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  tag: { padding: '5px 14px', borderRadius: 20, border: '1px solid #d1d5db', background: '#f9fafb', color: '#374151', fontSize: 12, cursor: 'pointer' },
  tagActive: { background: '#2563eb', color: '#fff', borderColor: '#2563eb' },
  checkRow: { display: 'flex', gap: 8, alignItems: 'center' },
  submitBtn: { background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '14px', fontSize: 16, fontWeight: 600, cursor: 'pointer' },
};

export default PostOpportunity;
