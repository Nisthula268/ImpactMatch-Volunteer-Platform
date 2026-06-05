import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

// ── Helpers ───────────────────────────────────────────────────────────────────
const arrToStr = (arr) => (Array.isArray(arr) ? arr.join(', ') : arr || '');
const strToArr = (str) => str.split(',').map((s) => s.trim()).filter(Boolean);

const API_BASE = process.env.REACT_APP_API_URL
  ? process.env.REACT_APP_API_URL.replace('/api', '')
  : '';

const avatarSrc = (path) =>
  path ? `${API_BASE}${path}?t=${Date.now()}` : null;

// ── Sub-components ────────────────────────────────────────────────────────────
const Field = ({ label, hint, children }) => (
  <div style={styles.field}>
    <label style={styles.label}>
      {label}
      {hint && <span style={styles.hint}> — {hint}</span>}
    </label>
    {children}
  </div>
);

const Tag = ({ text }) => <span style={styles.tagChip}>{text}</span>;

// ── Main ──────────────────────────────────────────────────────────────────────
const Profile = () => {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: '', bio: '', availability: 'flexible',
    location: '', organizationName: '',
    skillsStr: '', interestsStr: '', mentorDomainsStr: '',
  });

  const [preview,    setPreview]    = useState(null);
  const [uploading,  setUploading]  = useState(false);
  const [uploadMsg,  setUploadMsg]  = useState({ type: '', text: '' });

  const [fetchErr,   setFetchErr]   = useState('');
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [saveState,  setSaveState]  = useState('idle');
  const [saveMsg,    setSaveMsg]    = useState('');

  // ── Load profile ────────────────────────────────────────────────────────────
  const loadProfile = useCallback(async () => {
    setLoading(true);
    setFetchErr('');
    try {
      const { data: u } = await authAPI.getMe();
      setForm({
        name:             u.name             || '',
        bio:              u.bio              || '',
        availability:     u.availability     || 'flexible',
        location:         u.location         || '',
        organizationName: u.organizationName || '',
        skillsStr:        arrToStr(u.skills),
        interestsStr:     arrToStr(u.interests),
        mentorDomainsStr: arrToStr(u.mentorDomains),
      });
      setPreview(avatarSrc(u.profilePicture));
    } catch (err) {
      setFetchErr(err.response?.data?.message || 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  // ── Avatar upload ───────────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Local preview before upload
    setPreview(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) { setUploadMsg({ type: 'error', text: 'Please choose a file first.' }); return; }

    const MAX = 5 * 1024 * 1024;
    if (file.size > MAX) { setUploadMsg({ type: 'error', text: 'File must be under 5 MB.' }); return; }

    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setUploadMsg({ type: 'error', text: 'Only JPEG, PNG, GIF, or WEBP images allowed.' });
      return;
    }

    setUploading(true);
    setUploadMsg({ type: '', text: '' });
    const fd = new FormData();
    fd.append('profilePicture', file);
    try {
      const { data } = await authAPI.uploadPicture(fd);
      updateUser(data.user);
      setPreview(avatarSrc(data.profilePicture));
      setUploadMsg({ type: 'success', text: 'Profile picture updated!' });
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setUploadMsg({ type: 'error', text: err.response?.data?.message || 'Upload failed.' });
    } finally {
      setUploading(false);
    }
  };

  // ── Save text profile ───────────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setSaveState('error'); setSaveMsg('Name is required.'); return; }

    setSaving(true);
    setSaveState('idle');
    try {
      const { data: updated } = await authAPI.updateProfile({
        name:             form.name.trim(),
        bio:              form.bio.trim(),
        availability:     form.availability,
        location:         form.location.trim(),
        organizationName: form.organizationName.trim(),
        skills:           strToArr(form.skillsStr),
        interests:        strToArr(form.interestsStr),
        mentorDomains:    strToArr(form.mentorDomainsStr),
      });

      updateUser(updated);
      setForm(f => ({
        ...f,
        skillsStr:        arrToStr(updated.skills),
        interestsStr:     arrToStr(updated.interests),
        mentorDomainsStr: arrToStr(updated.mentorDomains),
      }));
      setSaveState('success');
      setSaveMsg('Profile saved successfully!');
    } catch (err) {
      setSaveState('error');
      setSaveMsg(err.response?.data?.message || 'Save failed.');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveState('idle'), 4000);
    }
  };

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  // ── Loading / error states ──────────────────────────────────────────────────
  if (loading) return (
    <div style={styles.centeredPage}>
      <div style={styles.spinner} />
      <p style={{ color: '#6b7280' }}>Loading profile...</p>
    </div>
  );

  if (fetchErr) return (
    <div style={styles.centeredPage}>
      <div style={{ fontSize: 48 }}>⚠️</div>
      <h2 style={{ color: '#1e3a5f' }}>Could not load profile</h2>
      <p style={{ color: '#6b7280' }}>{fetchErr}</p>
      <button onClick={loadProfile} style={styles.retryBtn}>Try Again</button>
    </div>
  );

  const isVol  = user?.role === 'volunteer';
  const isOrg  = user?.role === 'organization';
  const isMentor = user?.role === 'mentor';

  const skillChips    = strToArr(form.skillsStr);
  const interestChips = strToArr(form.interestsStr);
  const domainChips   = strToArr(form.mentorDomainsStr);

  return (
    <div style={styles.page}>

      {/* ── Page header ── */}
      <div style={styles.pageHeader}>
        <div style={styles.avatarWrap}>
          {preview ? (
            <img src={preview} alt="avatar" style={styles.avatarImg} />
          ) : (
            <div style={styles.avatarInitial}>
              {form.name.charAt(0).toUpperCase() || '?'}
            </div>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={styles.changePhotoBtn}
            title="Change profile picture"
          >
            📷
          </button>
        </div>

        <div>
          <h1 style={styles.pageTitle}>{form.name || 'Your Profile'}</h1>
          <span style={styles.roleBadge}>{user?.role}</span>
        </div>
      </div>

      {/* ── Avatar upload controls ── */}
      <div style={styles.uploadCard}>
        <h2 style={styles.cardTitle}>Profile Picture</h2>
        <p style={styles.cardHint}>JPEG, PNG, GIF or WEBP · Max 5 MB</p>

        <div style={styles.uploadRow}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={styles.chooseBtn}
          >
            📁 Choose Image
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading}
            style={{ ...styles.uploadBtn, opacity: uploading ? 0.7 : 1 }}
          >
            {uploading ? 'Uploading...' : '⬆ Upload'}
          </button>
        </div>

        {uploadMsg.text && (
          <div style={{
            ...styles.inlineBanner,
            background: uploadMsg.type === 'success' ? '#f0fdf4' : '#fef2f2',
            color:      uploadMsg.type === 'success' ? '#166534'  : '#b91c1c',
            border:     `1px solid ${uploadMsg.type === 'success' ? '#86efac' : '#fca5a5'}`,
          }}>
            {uploadMsg.type === 'success' ? '✅' : '❌'} {uploadMsg.text}
          </div>
        )}
      </div>

      {/* ── Save feedback ── */}
      {saveState === 'success' && (
        <div style={{ ...styles.banner, background: '#f0fdf4', color: '#166534', border: '1px solid #86efac' }}>
          ✅ {saveMsg}
        </div>
      )}
      {saveState === 'error' && (
        <div style={{ ...styles.banner, background: '#fef2f2', color: '#b91c1c', border: '1px solid #fca5a5' }}>
          ❌ {saveMsg}
        </div>
      )}

      {/* ── Profile form ── */}
      <form onSubmit={handleSave} noValidate>
        <div style={styles.formGrid}>

          {/* Basic info */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Basic Information</h2>

            <Field label="Full Name">
              <input type="text" value={form.name} onChange={set('name')}
                style={styles.input} placeholder="Your full name" required />
            </Field>

            <Field label="Email">
              <input type="email" value={user?.email || ''} style={{ ...styles.input, background: '#f9fafb', color: '#9ca3af' }}
                disabled readOnly />
              <p style={styles.fieldNote}>Email cannot be changed here.</p>
            </Field>

            {isOrg && (
              <Field label="Organization Name">
                <input type="text" value={form.organizationName} onChange={set('organizationName')}
                  style={styles.input} placeholder="Your NGO or company name" />
              </Field>
            )}

            <Field label="Bio" hint="max 1000 characters">
              <textarea value={form.bio} onChange={set('bio')}
                style={{ ...styles.input, height: 100, resize: 'vertical' }}
                placeholder="Tell us about yourself..."
                maxLength={1000} />
              <p style={styles.charCount}>{form.bio.length}/1000</p>
            </Field>

            <Field label="Location" hint="city or region">
              <input type="text" value={form.location} onChange={set('location')}
                style={styles.input} placeholder="e.g. Mumbai, India" />
            </Field>

            {(isVol || isMentor) && (
              <Field label="Availability">
                <select value={form.availability} onChange={set('availability')} style={styles.input}>
                  <option value="weekdays">Weekdays</option>
                  <option value="weekends">Weekends</option>
                  <option value="both">Both</option>
                  <option value="flexible">Flexible</option>
                </select>
              </Field>
            )}
          </div>

          {/* Skills & Interests */}
          {(isVol || isMentor) && (
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Skills & Interests</h2>
              <p style={styles.cardHint}>Used by the AI matching engine. Separate values with commas.</p>

              <Field label="Skills" hint="e.g. Python, Teaching, Leadership">
                <input type="text" value={form.skillsStr} onChange={set('skillsStr')}
                  style={styles.input} placeholder="Python, React, Teaching..." />
                {skillChips.length > 0 && (
                  <div style={styles.chipRow}>
                    {skillChips.map(s => <Tag key={s} text={s} />)}
                  </div>
                )}
              </Field>

              {isVol && (
                <Field label="Interests" hint="e.g. education, environment">
                  <input type="text" value={form.interestsStr} onChange={set('interestsStr')}
                    style={styles.input} placeholder="education, health, technology..." />
                  {interestChips.length > 0 && (
                    <div style={styles.chipRow}>
                      {interestChips.map(i => <Tag key={i} text={i} />)}
                    </div>
                  )}
                </Field>
              )}

              {isMentor && (
                <Field label="Mentor Domains" hint="areas you mentor in">
                  <input type="text" value={form.mentorDomainsStr} onChange={set('mentorDomainsStr')}
                    style={styles.input} placeholder="Python, Data Analysis, Career..." />
                  {domainChips.length > 0 && (
                    <div style={styles.chipRow}>
                      {domainChips.map(d => <Tag key={d} text={d} />)}
                    </div>
                  )}
                </Field>
              )}
            </div>
          )}

          {/* Account info */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Account</h2>
            <div style={styles.infoTable}>
              {[
                ['Role',          user?.role],
                ['Member Since',  user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : '—'],
                ['Status',        user?.isActive ? '● Active' : '● Inactive'],
              ].map(([k, v]) => (
                <div key={k} style={styles.infoRow}>
                  <span style={styles.infoKey}>{k}</span>
                  <span style={{ ...styles.infoVal, color: k === 'Status' ? (user?.isActive ? '#10b981' : '#ef4444') : '#1e3a5f' }}>
                    {v}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={styles.saveRow}>
          <button type="submit" disabled={saving}
            style={{ ...styles.saveBtn, opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button type="button" onClick={loadProfile} style={styles.resetBtn}>
            Reset
          </button>
        </div>
      </form>
    </div>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  page:       { maxWidth: 860, margin: '0 auto', padding: '32px 24px 60px' },
  centeredPage: { minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, textAlign: 'center', padding: 48 },
  spinner:    { width: 36, height: 36, border: '3px solid #e5e7eb', borderTop: '3px solid #2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  retryBtn:   { background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', cursor: 'pointer', fontWeight: 600 },

  pageHeader: { display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 },
  avatarWrap: { position: 'relative', flexShrink: 0 },
  avatarImg:  { width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '3px solid #e5e7eb' },
  avatarInitial: { width: 72, height: 72, borderRadius: '50%', background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontWeight: 700 },
  changePhotoBtn: { position: 'absolute', bottom: 0, right: 0, background: '#fff', border: '1px solid #d1d5db', borderRadius: '50%', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 13 },
  pageTitle:  { margin: '0 0 6px', fontSize: 24, fontWeight: 800, color: '#1e3a5f' },
  roleBadge:  { background: '#eff6ff', color: '#1d4ed8', fontSize: 12, padding: '3px 12px', borderRadius: 20, textTransform: 'capitalize', fontWeight: 600 },

  uploadCard: { background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb', marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 12 },
  uploadRow:  { display: 'flex', gap: 10, flexWrap: 'wrap' },
  chooseBtn:  { background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  uploadBtn:  { background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  inlineBanner: { padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500 },

  banner:     { padding: '12px 18px', borderRadius: 8, marginBottom: 20, fontSize: 14, fontWeight: 500 },
  formGrid:   { display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 24 },
  card:       { background: '#fff', borderRadius: 12, padding: '24px 28px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: 18 },
  cardTitle:  { margin: 0, fontSize: 16, fontWeight: 700, color: '#1e3a5f' },
  cardHint:   { margin: '-8px 0 0', fontSize: 13, color: '#9ca3af' },
  field:      { display: 'flex', flexDirection: 'column', gap: 6 },
  label:      { fontSize: 13, fontWeight: 600, color: '#374151' },
  hint:       { fontWeight: 400, color: '#9ca3af' },
  input:      { border: '1px solid #d1d5db', borderRadius: 8, padding: '10px 14px', fontSize: 14, outline: 'none', fontFamily: 'inherit' },
  fieldNote:  { margin: '4px 0 0', fontSize: 12, color: '#9ca3af' },
  charCount:  { margin: '4px 0 0', fontSize: 12, color: '#9ca3af', textAlign: 'right' },
  chipRow:    { display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  tagChip:    { background: '#dbeafe', color: '#1d4ed8', fontSize: 12, padding: '3px 10px', borderRadius: 20, fontWeight: 500 },
  infoTable:  { display: 'flex', flexDirection: 'column', gap: 10 },
  infoRow:    { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6' },
  infoKey:    { fontSize: 13, color: '#6b7280' },
  infoVal:    { fontSize: 13, fontWeight: 500 },
  saveRow:    { display: 'flex', gap: 12 },
  saveBtn:    { background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 36px', fontSize: 15, fontWeight: 700, cursor: 'pointer' },
  resetBtn:   { background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 8, padding: '12px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
};

if (typeof document !== 'undefined' && !document.getElementById('im-spin-style')) {
  const s = document.createElement('style');
  s.id = 'im-spin-style';
  s.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
  document.head.appendChild(s);
}

export default Profile;
