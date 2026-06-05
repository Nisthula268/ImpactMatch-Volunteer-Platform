import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SKILLS_OPTIONS = ['JavaScript', 'Python', 'React', 'Teaching', 'Marketing', 'Design', 'Data Analysis', 'Writing', 'Leadership', 'Healthcare', 'Construction', 'Music', 'Photography'];
const INTERESTS_OPTIONS = ['education', 'environment', 'health', 'community', 'technology', 'arts', 'sports', 'other'];

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'volunteer', bio: '', organizationName: '', availability: 'flexible' });
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleItem = (arr, setArr, item) =>
    setArr(arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await register({ ...form, skills: selectedSkills, interests: selectedInterests });
      navigate(user.role === 'organization' ? '/dashboard' : '/opportunities');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <span style={styles.logo}>🌱</span>
          <h1 style={styles.title}>Join ImpactMatch</h1>
          <p style={styles.subtitle}>Create your account and start making an impact</p>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Full Name</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={styles.input} placeholder="Jane Doe" required />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Role</label>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} style={styles.input}>
                <option value="volunteer">Volunteer</option>
                <option value="organization">Organization</option>
                <option value="mentor">Mentor</option>
              </select>
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={styles.input} placeholder="you@example.com" required />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} style={styles.input} placeholder="Min. 6 characters" required />
          </div>

          {form.role === 'organization' && (
            <div style={styles.field}>
              <label style={styles.label}>Organization Name</label>
              <input type="text" value={form.organizationName} onChange={e => setForm({ ...form, organizationName: e.target.value })} style={styles.input} placeholder="My NGO" />
            </div>
          )}

          <div style={styles.field}>
            <label style={styles.label}>Bio (optional)</label>
            <textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} style={{ ...styles.input, height: 80, resize: 'vertical' }} placeholder="Tell us about yourself..." />
          </div>

          {form.role !== 'organization' && (
            <>
              <div style={styles.field}>
                <label style={styles.label}>Skills</label>
                <div style={styles.tagsGrid}>
                  {SKILLS_OPTIONS.map(s => (
                    <button type="button" key={s} onClick={() => toggleItem(selectedSkills, setSelectedSkills, s)}
                      style={{ ...styles.tag, ...(selectedSkills.includes(s) ? styles.tagActive : {}) }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Interests</label>
                <div style={styles.tagsGrid}>
                  {INTERESTS_OPTIONS.map(i => (
                    <button type="button" key={i} onClick={() => toggleItem(selectedInterests, setSelectedInterests, i)}
                      style={{ ...styles.tag, ...(selectedInterests.includes(i) ? styles.tagActive : {}) }}>
                      {i}
                    </button>
                  ))}
                </div>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Availability</label>
                <select value={form.availability} onChange={e => setForm({ ...form, availability: e.target.value })} style={styles.input}>
                  <option value="weekdays">Weekdays</option>
                  <option value="weekends">Weekends</option>
                  <option value="both">Both</option>
                  <option value="flexible">Flexible</option>
                </select>
              </div>
            </>
          )}

          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p style={styles.footer}>
          Already have an account? <Link to="/login" style={styles.link}>Sign in</Link>
        </p>
      </div>
    </div>
  );
};

const styles = {
  page: { minHeight: '100vh', background: 'linear-gradient(135deg, #1e40af 0%, #0f766e 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { background: '#fff', borderRadius: 16, padding: '40px 36px', width: '100%', maxWidth: 560, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' },
  header: { textAlign: 'center', marginBottom: 28 },
  logo: { fontSize: 36 },
  title: { margin: '10px 0 6px', fontSize: 24, fontWeight: 700, color: '#1e3a5f' },
  subtitle: { margin: 0, color: '#6b7280', fontSize: 14 },
  error: { background: '#fee2e2', color: '#b91c1c', padding: '10px 16px', borderRadius: 8, marginBottom: 16, fontSize: 14 },
  form: { display: 'flex', flexDirection: 'column', gap: 18 },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: '#374151' },
  input: { border: '1px solid #d1d5db', borderRadius: 8, padding: '10px 14px', fontSize: 14, outline: 'none', fontFamily: 'inherit' },
  tagsGrid: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  tag: { padding: '5px 14px', borderRadius: 20, border: '1px solid #d1d5db', background: '#f9fafb', color: '#374151', fontSize: 12, cursor: 'pointer' },
  tagActive: { background: '#2563eb', color: '#fff', borderColor: '#2563eb' },
  btn: { background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '12px', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 4 },
  footer: { textAlign: 'center', marginTop: 24, fontSize: 14, color: '#6b7280' },
  link: { color: '#2563eb', textDecoration: 'none', fontWeight: 600 },
};

export default Register;
