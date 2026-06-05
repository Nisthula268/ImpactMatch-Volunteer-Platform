/**
 * ImpactMatch Hybrid AI Matching Algorithm
 *
 * Phase 1: Rule-Based Matching (skills + interests)
 * Phase 2: AI Semantic Matching (embedding similarity placeholder)
 *
 * Final Score = (0.4 × interestMatch) + (0.3 × skillMatch) + (0.3 × semanticSimilarity)
 */

/**
 * Compute Jaccard similarity between two arrays
 * @param {string[]} arr1
 * @param {string[]} arr2
 * @returns {number} 0–1
 */
const jaccardSimilarity = (arr1, arr2) => {
  if (!arr1.length && !arr2.length) return 1;
  if (!arr1.length || !arr2.length) return 0;
  const set1 = new Set(arr1.map(s => s.toLowerCase()));
  const set2 = new Set(arr2.map(s => s.toLowerCase()));
  const intersection = [...set1].filter(x => set2.has(x));
  const union = new Set([...set1, ...set2]);
  return intersection.length / union.size;
};

/**
 * Compute cosine similarity between two embedding vectors
 * @param {number[]} vecA
 * @param {number[]} vecB
 * @returns {number} 0–1
 */
const cosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  if (!magnitudeA || !magnitudeB) return 0;
  return dotProduct / (magnitudeA * magnitudeB);
};

/**
 * Placeholder: Generate embedding vector for a text string.
 * In production, replace with a real embedding model (e.g., OpenAI, HuggingFace sentence-transformers).
 * @param {string} text
 * @returns {number[]} embedding vector (128-dim placeholder)
 */
const generateEmbedding = (text) => {
  // Deterministic pseudo-embedding based on character codes — for structure only
  const seed = text.toLowerCase().split('').reduce((acc, c, i) => acc + c.charCodeAt(0) * (i + 1), 0);
  return Array.from({ length: 128 }, (_, i) => Math.sin(seed * (i + 1)) * 0.5 + 0.5);
};

/**
 * Core matching function
 * @param {Object} volunteer - User document (role: volunteer)
 * @param {Object} opportunity - Opportunity document
 * @returns {Object} Match result
 */
const computeMatchScore = (volunteer, opportunity) => {
  // === Phase 1: Rule-Based ===
  const skillMatch = jaccardSimilarity(volunteer.skills || [], opportunity.skills_required || []);
  const interestMatch = jaccardSimilarity(volunteer.interests || [], opportunity.interests_matched || []);

  const matchedSkills = (volunteer.skills || []).filter(s =>
    (opportunity.skills_required || []).map(x => x.toLowerCase()).includes(s.toLowerCase())
  );

  const skillGap = (opportunity.skills_required || []).filter(s =>
    !(volunteer.skills || []).map(x => x.toLowerCase()).includes(s.toLowerCase())
  );

  const categoryMatched = (volunteer.interests || [])
    .map(i => i.toLowerCase())
    .includes(opportunity.category?.toLowerCase());

  // === Phase 2: Semantic Matching ===
  const volunteerText = [
    ...(volunteer.skills || []),
    ...(volunteer.interests || []),
    volunteer.bio || '',
  ].join(' ');

  const opportunityText = [
    opportunity.title || '',
    opportunity.description || '',
    ...(opportunity.skills_required || []),
    ...(opportunity.interests_matched || []),
  ].join(' ');

  const volunteerEmbedding = generateEmbedding(volunteerText);
  const opportunityEmbedding = generateEmbedding(opportunityText);
  const semanticScore = cosineSimilarity(volunteerEmbedding, opportunityEmbedding);

  // === Final Composite Score ===
  const finalScore = (0.4 * interestMatch) + (0.3 * skillMatch) + (0.3 * semanticScore);

  return {
    matchScore: Math.round(finalScore * 100) / 100,
    matchPercentage: Math.round(finalScore * 100),
    matchedSkills,
    skillGap,
    categoryMatched,
    semanticScore: Math.round(semanticScore * 100) / 100,
    breakdown: {
      interestMatch: Math.round(interestMatch * 100) / 100,
      skillMatch: Math.round(skillMatch * 100) / 100,
      semanticScore: Math.round(semanticScore * 100) / 100,
    },
  };
};

/**
 * Rank a list of opportunities for a given volunteer
 * @param {Object} volunteer
 * @param {Object[]} opportunities
 * @returns {Object[]} sorted opportunities with scores
 */
const rankOpportunities = (volunteer, opportunities) => {
  return opportunities
    .map(opp => ({ ...opp.toObject?.() ?? opp, ...computeMatchScore(volunteer, opp) }))
    .sort((a, b) => b.matchScore - a.matchScore);
};

module.exports = { computeMatchScore, rankOpportunities, jaccardSimilarity, cosineSimilarity };
