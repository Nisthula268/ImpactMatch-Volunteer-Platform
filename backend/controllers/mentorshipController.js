const Mentorship = require('../models/Mentorship');
const User = require('../models/User');

// @desc    Request a mentor
// @route   POST /api/mentorship/request
// @access  Volunteer
const requestMentor = async (req, res) => {
  try {
    const { mentorId, goalDescription } = req.body;
    const mentor = await User.findById(mentorId);
    if (!mentor || mentor.role !== 'mentor') return res.status(404).json({ message: 'Mentor not found' });

    const existing = await Mentorship.findOne({ mentorId, menteeId: req.user._id, status: { $in: ['pending', 'active'] } });
    if (existing) return res.status(400).json({ message: 'Mentorship request already exists' });

    // Compute skill gap
    const menteeSkills = req.user.skills || [];
    const mentorDomains = mentor.mentorDomains || [];
    const skillGap = mentorDomains.filter(d => !menteeSkills.map(s => s.toLowerCase()).includes(d.toLowerCase()));

    const mentorship = await Mentorship.create({
      mentorId,
      menteeId: req.user._id,
      goalDescription,
      skillGapAnalysis: skillGap.join(', '),
    });

    res.status(201).json(mentorship);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get mentor's pending/active requests
// @route   GET /api/mentorship/requests
// @access  Mentor
const getMentorRequests = async (req, res) => {
  try {
    const requests = await Mentorship.find({ mentorId: req.user._id })
      .populate('menteeId', 'name email skills interests bio')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Accept/reject mentorship request
// @route   PUT /api/mentorship/:id/respond
// @access  Mentor
const respondToRequest = async (req, res) => {
  try {
    const { status } = req.body;
    const mentorship = await Mentorship.findById(req.params.id);
    if (!mentorship) return res.status(404).json({ message: 'Mentorship not found' });
    if (mentorship.mentorId.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });
    mentorship.status = status;
    await mentorship.save();
    res.json(mentorship);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add session notes
// @route   POST /api/mentorship/:id/session
// @access  Mentor
const addSession = async (req, res) => {
  try {
    const { date, topic, notes, status } = req.body;
    const mentorship = await Mentorship.findById(req.params.id);
    if (!mentorship) return res.status(404).json({ message: 'Mentorship not found' });
    if (mentorship.mentorId.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });
    mentorship.sessions.push({ date, topic, notes, status: status || 'completed' });
    await mentorship.save();
    res.json(mentorship);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get mentee's mentorships
// @route   GET /api/mentorship/my
// @access  Volunteer
const getMyMentorships = async (req, res) => {
  try {
    const mentorships = await Mentorship.find({ menteeId: req.user._id })
      .populate('mentorId', 'name email mentorDomains bio')
      .sort({ createdAt: -1 });
    res.json(mentorships);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get available mentors
// @route   GET /api/mentorship/mentors
// @access  Private
const getMentors = async (req, res) => {
  try {
    const mentors = await User.find({ role: 'mentor', isActive: true }).select('name bio mentorDomains skills availability');
    res.json(mentors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve completion + feedback
// @route   PUT /api/mentorship/:id/complete
// @access  Mentor
const completeMentorship = async (req, res) => {
  try {
    const { mentorFeedback } = req.body;
    const mentorship = await Mentorship.findById(req.params.id);
    if (!mentorship) return res.status(404).json({ message: 'Mentorship not found' });
    if (mentorship.mentorId.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });
    mentorship.status = 'completed';
    mentorship.mentorFeedback = mentorFeedback;
    mentorship.completionApprovedAt = new Date();
    await mentorship.save();
    res.json(mentorship);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { requestMentor, getMentorRequests, respondToRequest, addSession, getMyMentorships, getMentors, completeMentorship };
