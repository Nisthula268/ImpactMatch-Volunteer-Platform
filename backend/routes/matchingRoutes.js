const express = require('express');
const router = express.Router();
const { getMatchedOpportunities, getMatchScore } = require('../controllers/matchingController');
const { protect, authorize } = require('../middleware/auth');

router.get('/opportunities', protect, authorize('volunteer'), getMatchedOpportunities);
router.get('/score/:opportunityId', protect, authorize('volunteer'), getMatchScore);

module.exports = router;
