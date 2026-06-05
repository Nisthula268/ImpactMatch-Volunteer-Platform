const Attendance = require('../models/Attendance');
const Application = require('../models/Application');
const Opportunity = require('../models/Opportunity');
const { isWithinRadius } = require('../utils/haversine');

// @desc    Check in to an opportunity
// @route   POST /api/attendance/checkin
// @access  Volunteer
const checkIn = async (req, res) => {
  try {
    const { opportunityId, latitude, longitude } = req.body;

    const application = await Application.findOne({ volunteerId: req.user._id, opportunityId, status: 'accepted' });
    if (!application) return res.status(403).json({ message: 'No accepted application found for this opportunity' });

    const opportunity = await Opportunity.findById(opportunityId);
    if (!opportunity) return res.status(404).json({ message: 'Opportunity not found' });

    // Validate location if opportunity has coordinates
    let locationValid = true;
    let distance = null;
    if (opportunity.location?.latitude && !opportunity.location?.isRemote) {
      const result = isWithinRadius(
        { latitude, longitude },
        opportunity.location,
        parseInt(process.env.CHECK_IN_RADIUS_METERS) || 200
      );
      locationValid = result.valid;
      distance = result.distance;
      if (!locationValid) {
        return res.status(400).json({
          message: `You are ${distance}m away from the opportunity location. Must be within ${result.radiusMeters}m to check in.`,
          distance,
        });
      }
    }

    const existing = await Attendance.findOne({ volunteerId: req.user._id, opportunityId, checkOutTime: null });
    if (existing) return res.status(400).json({ message: 'Already checked in' });

    const attendance = await Attendance.create({
      volunteerId: req.user._id,
      opportunityId,
      checkInTime: new Date(),
      checkInLocation: { latitude, longitude },
    });

    res.status(201).json({ attendance, distance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Check out from an opportunity
// @route   POST /api/attendance/checkout
// @access  Volunteer
const checkOut = async (req, res) => {
  try {
    const { opportunityId, latitude, longitude } = req.body;

    const attendance = await Attendance.findOne({
      volunteerId: req.user._id,
      opportunityId,
      checkOutTime: null,
    });
    if (!attendance) return res.status(404).json({ message: 'No active check-in found' });

    attendance.checkOutTime = new Date();
    attendance.checkOutLocation = { latitude, longitude };

    const durationMs = attendance.checkOutTime - attendance.checkInTime;
    attendance.totalHours = Math.round((durationMs / 3600000) * 100) / 100;
    attendance.verified = true;

    await attendance.save();

    // Update application attendance status
    await Application.findOneAndUpdate(
      { volunteerId: req.user._id, opportunityId },
      { attendanceVerified: true }
    );

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get attendance for a volunteer
// @route   GET /api/attendance/my
// @access  Volunteer
const getMyAttendance = async (req, res) => {
  try {
    const records = await Attendance.find({ volunteerId: req.user._id })
      .populate('opportunityId', 'title category')
      .sort({ checkInTime: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { checkIn, checkOut, getMyAttendance };
