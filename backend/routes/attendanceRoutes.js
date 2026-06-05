const express = require('express');
const router = express.Router();
const { checkIn, checkOut, getMyAttendance } = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/auth');

router.post('/checkin', protect, authorize('volunteer'), checkIn);
router.post('/checkout', protect, authorize('volunteer'), checkOut);
router.get('/my', protect, authorize('volunteer'), getMyAttendance);

module.exports = router;
