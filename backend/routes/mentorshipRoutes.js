const express = require('express');
const router = express.Router();
const { requestMentor, getMentorRequests, respondToRequest, addSession, getMyMentorships, getMentors, completeMentorship } = require('../controllers/mentorshipController');
const { protect, authorize } = require('../middleware/auth');

router.get('/mentors', protect, getMentors);
router.post('/request', protect, authorize('volunteer'), requestMentor);
router.get('/requests', protect, authorize('mentor'), getMentorRequests);
router.put('/:id/respond', protect, authorize('mentor'), respondToRequest);
router.post('/:id/session', protect, authorize('mentor'), addSession);
router.put('/:id/complete', protect, authorize('mentor'), completeMentorship);
router.get('/my', protect, authorize('volunteer'), getMyMentorships);

module.exports = router;
