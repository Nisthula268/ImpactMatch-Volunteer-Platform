const Opportunity  = require('../models/Opportunity');
const Application  = require('../models/Application');
const Attendance   = require('../models/Attendance');

// @desc    Create opportunity
// @route   POST /api/opportunities
// @access  Organization
const createOpportunity = async (req, res) => {
  try {
    const opportunity = await Opportunity.create({
      ...req.body,
      organizationId: req.user._id,
    });
    res.status(201).json(opportunity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all opportunities (public, paginated)
// @route   GET /api/opportunities
// @access  Public
const getOpportunities = async (req, res) => {
  try {
    const { category, isRemote, page = 1, limit = 10 } = req.query;
    const filter = { isActive: true };
    if (category)          filter.category              = category;
    if (isRemote !== undefined) filter['location.isRemote'] = isRemote === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [opportunities, total] = await Promise.all([
      Opportunity.find(filter)
        .populate('organizationId', 'name organizationName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Opportunity.countDocuments(filter),
    ]);

    res.json({
      opportunities,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single opportunity
// @route   GET /api/opportunities/:id
// @access  Public
const getOpportunity = async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id)
      .populate('organizationId', 'name organizationName bio');
    if (!opportunity) return res.status(404).json({ message: 'Opportunity not found' });
    res.json(opportunity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update opportunity (owner only, $set so partial updates are safe)
// @route   PUT /api/opportunities/:id
// @access  Organization
const updateOpportunity = async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id);
    if (!opportunity) return res.status(404).json({ message: 'Opportunity not found' });
    if (opportunity.organizationId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this opportunity' });
    }

    // Strip fields that must not be overwritten through this route
    const { organizationId: _orgId, ...safeBody } = req.body;

    const updated = await Opportunity.findByIdAndUpdate(
      req.params.id,
      { $set: safeBody },
      { new: true, runValidators: true }
    );
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete opportunity + cascade: delete related applications & attendance
// @route   DELETE /api/opportunities/:id
// @access  Organization
const deleteOpportunity = async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id);
    if (!opportunity) return res.status(404).json({ message: 'Opportunity not found' });
    if (opportunity.organizationId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Cascade delete related records
    await Promise.all([
      Application.deleteMany({ opportunityId: opportunity._id }),
      Attendance.deleteMany({  opportunityId: opportunity._id }),
    ]);

    await opportunity.deleteOne();
    res.json({ message: 'Opportunity and all related applications removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get my organization's opportunities
// @route   GET /api/opportunities/my
// @access  Organization
const getMyOpportunities = async (req, res) => {
  try {
    const opportunities = await Opportunity.find({ organizationId: req.user._id })
      .sort({ createdAt: -1 });
    res.json(opportunities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createOpportunity, getOpportunities, getOpportunity,
  updateOpportunity, deleteOpportunity, getMyOpportunities,
};
