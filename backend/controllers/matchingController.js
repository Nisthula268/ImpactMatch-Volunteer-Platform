const Opportunity = require('../models/Opportunity');
const { rankOpportunities, computeMatchScore } = require('../utils/matchingAlgorithm');

// @desc    Get AI-ranked opportunities for volunteer
// @route   GET /api/matching/opportunities
// @access  Volunteer
const getMatchedOpportunities = async (req, res) => {
  try {
    const opportunities = await Opportunity.find({ isActive: true }).populate('organizationId', 'name organizationName');
    const ranked = rankOpportunities(req.user, opportunities);
    res.json(ranked);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get match score for a specific opportunity
// @route   GET /api/matching/score/:opportunityId
// @access  Volunteer
const getMatchScore = async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.opportunityId);
    if (!opportunity) return res.status(404).json({ message: 'Opportunity not found' });
    const result = computeMatchScore(req.user, opportunity);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getMatchedOpportunities, getMatchScore };
