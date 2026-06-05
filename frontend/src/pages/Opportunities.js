import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { opportunityAPI, matchingAPI, applicationAPI } from '../services/api';
import OpportunityCard from '../components/OpportunityCard';

const CATEGORIES = ['all', 'education', 'environment', 'health', 'community', 'technology', 'arts', 'sports', 'other'];

const Opportunities = () => {
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [useAI, setUseAI] = useState(user?.role === 'volunteer');
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        let data;
        if (useAI && user?.role === 'volunteer') {
          const res = await matchingAPI.getMatched();
          data = res.data;
        } else {
          const res = await opportunityAPI.getAll({ limit: 50 });
          data = res.data.opportunities;
        }
        setOpportunities(data);
      } catch (e) {
        console.error(e);
        const res = await opportunityAPI.getAll({ limit: 50 });
        setOpportunities(res.data.opportunities);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [useAI, user]);

  useEffect(() => {
    let result = opportunities;
    if (category !== 'all') result = result.filter(o => o.category === category);
    if (search) result = result.filter(o => o.title?.toLowerCase().includes(search.toLowerCase()) || o.description?.toLowerCase().includes(search.toLowerCase()));
    setFiltered(result);
  }, [opportunities, category, search]);

  const handleApply = async (opportunityId) => {
    if (!user) { alert('Please login to apply'); return; }
    setApplying(opportunityId);
    try {
      await applicationAPI.apply({ opportunityId });
      alert('Application submitted successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to apply');
    } finally {
      setApplying(null);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Volunteer Opportunities</h1>
          <p style={styles.subtitle}>{filtered.length} opportunities found</p>
        </div>
        {user?.role === 'volunteer' && (
          <button onClick={() => setUseAI(!useAI)} style={{ ...styles.toggleBtn, background: useAI ? '#2563eb' : '#f3f4f6', color: useAI ? '#fff' : '#374151' }}>
            {useAI ? '🤖 AI-Ranked' : '📋 Default'}
          </button>
        )}
      </div>

      <div style={styles.filters}>
        <input
          type="text"
          placeholder="Search opportunities..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={styles.searchInput}
        />
        <div style={styles.catTabs}>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              style={{ ...styles.catTab, ...(category === c ? styles.catTabActive : {}) }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {useAI && user?.role === 'volunteer' && (
        <div style={styles.aiBanner}>
          🤖 Opportunities are ranked by AI based on your skills, interests, and semantic similarity
        </div>
      )}

      {loading ? (
        <div style={styles.loading}>Finding the best opportunities for you...</div>
      ) : filtered.length === 0 ? (
        <div style={styles.empty}>No opportunities match your criteria. Try adjusting your filters.</div>
      ) : (
        <div style={styles.grid}>
          {filtered.map(opp => (
            <OpportunityCard
              key={opp._id}
              opportunity={opp}
              matchScore={opp.matchScore}
              matchedSkills={opp.matchedSkills}
              skillGap={opp.skillGap}
              showApply={user?.role === 'volunteer'}
              onApply={applying === opp._id ? null : handleApply}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  page: { maxWidth: 1200, margin: '0 auto', padding: '32px 24px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 },
  title: { margin: 0, fontSize: 26, fontWeight: 700, color: '#1e3a5f' },
  subtitle: { margin: '4px 0 0', color: '#6b7280', fontSize: 14 },
  toggleBtn: { padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14 },
  filters: { display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 },
  searchInput: { border: '1px solid #d1d5db', borderRadius: 8, padding: '10px 16px', fontSize: 14, outline: 'none', maxWidth: 400 },
  catTabs: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  catTab: { padding: '6px 14px', borderRadius: 20, border: '1px solid #d1d5db', background: '#f9fafb', color: '#374151', fontSize: 12, cursor: 'pointer', textTransform: 'capitalize' },
  catTabActive: { background: '#2563eb', color: '#fff', borderColor: '#2563eb', fontWeight: 600 },
  aiBanner: { background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af', padding: '10px 16px', borderRadius: 8, fontSize: 13, marginBottom: 20 },
  loading: { textAlign: 'center', padding: 60, color: '#6b7280' },
  empty: { textAlign: 'center', padding: 60, color: '#9ca3af' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 },
};

export default Opportunities;
