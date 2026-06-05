const Application  = require('../models/Application');
const Opportunity  = require('../models/Opportunity');
const Attendance   = require('../models/Attendance');
const Certificate  = require('../models/Certificate');
const User         = require('../models/User');
const { computeMatchScore }       = require('../utils/matchingAlgorithm');
const { generateCertificatePDF }  = require('../services/certificateService');

// ── Helper: auto-issue certificate when status → completed ────────────────────
const autoIssueCertificate = async (application, orgUser) => {
  try {
    // Don't duplicate
    const existing = await Certificate.findOne({ applicationId: application._id });
    if (existing) return existing;

    const attendance = await Attendance.findOne({
      volunteerId:   application.volunteerId._id || application.volunteerId,
      opportunityId: application.opportunityId._id || application.opportunityId,
    });

    const cert = await Certificate.create({
      volunteerId:    application.volunteerId._id || application.volunteerId,
      organizationId: orgUser._id,
      opportunityId:  application.opportunityId._id || application.opportunityId,
      applicationId:  application._id,
      hoursCompleted: attendance?.totalHours,
    });

    // Generate PDF (non-blocking — failure doesn't break the response)
    try {
      await generateCertificatePDF({
        volunteerName:    application.volunteerId.name,
        organizationName: orgUser.organizationName || orgUser.name,
        opportunityTitle: application.opportunityId.title,
        duration:         application.opportunityId.duration,
        certificateId:    cert.certificateId,
        verificationCode: cert.verificationCode,
        issueDate:        cert.issueDate,
        hoursCompleted:   attendance?.totalHours,
      });
      cert.certificateURL = `/uploads/certificates/${cert.certificateId}.pdf`;
      await cert.save();
    } catch (pdfErr) {
      console.error('Auto-certificate PDF generation failed:', pdfErr.message);
    }

    return cert;
  } catch (err) {
    console.error('autoIssueCertificate error:', err.message);
    return null;
  }
};

// @desc    Apply to an opportunity
// @route   POST /api/applications
// @access  Volunteer
const applyToOpportunity = async (req, res) => {
  try {
    const { opportunityId, coverLetter } = req.body;
    const opportunity = await Opportunity.findById(opportunityId);
    if (!opportunity) return res.status(404).json({ message: 'Opportunity not found' });

    const existing = await Application.findOne({ volunteerId: req.user._id, opportunityId });
    if (existing) return res.status(400).json({ message: 'Already applied to this opportunity' });

    const matchResult = computeMatchScore(req.user, opportunity);

    const application = await Application.create({
      volunteerId:  req.user._id,
      opportunityId,
      coverLetter,
      matchScore: matchResult.matchScore,
    });

    res.status(201).json({ application, matchResult });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get my applications (volunteer)
// @route   GET /api/applications/my
// @access  Volunteer
const getMyApplications = async (req, res) => {
  try {
    const applications = await Application.find({ volunteerId: req.user._id })
      .populate({
        path:     'opportunityId',
        select:   'title category duration organizationId',
        populate: { path: 'organizationId', select: 'name organizationName' },
      })
      .sort({ createdAt: -1 });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get applications for my opportunity (organization)
// @route   GET /api/applications/opportunity/:opportunityId
// @access  Organization
const getOpportunityApplications = async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.opportunityId);
    if (!opportunity) return res.status(404).json({ message: 'Opportunity not found' });
    if (opportunity.organizationId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const applications = await Application.find({ opportunityId: req.params.opportunityId })
      .populate('volunteerId', 'name email skills interests bio profilePicture')
      .sort({ matchScore: -1 });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update application status — auto-issues certificate on → completed
// @route   PUT /api/applications/:id/status
// @access  Organization
const updateApplicationStatus = async (req, res) => {
  try {
    const { status, organizationNotes } = req.body;

    const application = await Application.findById(req.params.id)
      .populate('opportunityId')
      .populate('volunteerId', 'name email');

    if (!application) return res.status(404).json({ message: 'Application not found' });
    if (application.opportunityId.organizationId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    application.status = status;
    if (organizationNotes) application.organizationNotes = organizationNotes;
    if (status === 'completed') application.completedAt = new Date();
    await application.save();

    // Auto-generate certificate when marked completed AND attendance verified
    let certificate = null;
    if (status === 'completed' && application.attendanceVerified) {
      certificate = await autoIssueCertificate(application, req.user);
    }

    res.json({ application, certificate });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  applyToOpportunity, getMyApplications,
  getOpportunityApplications, updateApplicationStatus,
};
