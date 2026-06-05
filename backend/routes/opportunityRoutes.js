const express = require('express');
const router = express.Router();
const { createOpportunity, getOpportunities, getOpportunity, updateOpportunity, deleteOpportunity, getMyOpportunities } = require('../controllers/opportunityController');
const { protect, authorize } = require('../middleware/auth');
const { validateOpportunity } = require('../middleware/validate');

router.get('/', getOpportunities);
router.get('/my', protect, authorize('organization'), getMyOpportunities);
router.get('/:id', getOpportunity);
router.post('/', protect, authorize('organization'), validateOpportunity, createOpportunity);
router.put('/:id', protect, authorize('organization'), updateOpportunity);
router.delete('/:id', protect, authorize('organization'), deleteOpportunity);

module.exports = router;
