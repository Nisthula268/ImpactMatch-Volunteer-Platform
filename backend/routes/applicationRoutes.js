// applicationRoutes.js
const express = require('express');
const router = express.Router();
const { applyToOpportunity, getMyApplications, getOpportunityApplications, updateApplicationStatus } = require('../controllers/applicationController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('volunteer'), applyToOpportunity);
router.get('/my', protect, authorize('volunteer'), getMyApplications);
router.get('/opportunity/:opportunityId', protect, authorize('organization'), getOpportunityApplications);
router.put('/:id/status', protect, authorize('organization'), updateApplicationStatus);

module.exports = router;
