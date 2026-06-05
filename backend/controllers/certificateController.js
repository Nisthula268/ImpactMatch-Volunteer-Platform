const path          = require('path');
const fs            = require('fs');
const Certificate   = require('../models/Certificate');
const Application   = require('../models/Application');
const Attendance    = require('../models/Attendance');
const { generateCertificatePDF } = require('../services/certificateService');

// @desc    Manually issue certificate (org triggered)
// @route   POST /api/certificates/issue/:applicationId
// @access  Organization
const issueCertificate = async (req, res) => {
  try {
    const application = await Application.findById(req.params.applicationId)
      .populate('volunteerId', 'name email')
      .populate('opportunityId');

    if (!application) return res.status(404).json({ message: 'Application not found' });
    if (application.opportunityId.organizationId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (application.status !== 'completed') {
      return res.status(400).json({ message: 'Application must be completed before issuing a certificate' });
    }
    if (!application.attendanceVerified) {
      return res.status(400).json({ message: 'Attendance must be verified before issuing a certificate' });
    }

    const existing = await Certificate.findOne({ applicationId: application._id });
    if (existing) return res.status(400).json({ message: 'Certificate already issued for this application' });

    const attendance = await Attendance.findOne({
      volunteerId:   application.volunteerId._id,
      opportunityId: application.opportunityId._id,
    });

    const cert = await Certificate.create({
      volunteerId:    application.volunteerId._id,
      organizationId: req.user._id,
      opportunityId:  application.opportunityId._id,
      applicationId:  application._id,
      hoursCompleted: attendance?.totalHours,
    });

    try {
      await generateCertificatePDF({
        volunteerName:    application.volunteerId.name,
        organizationName: req.user.organizationName || req.user.name,
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
      console.error('PDF generation failed:', pdfErr.message);
    }

    res.status(201).json(cert);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get my earned certificates (volunteer)
// @route   GET /api/certificates/my
// @access  Volunteer
const getMyCertificates = async (req, res) => {
  try {
    const certs = await Certificate.find({ volunteerId: req.user._id, isValid: true })
      .populate('opportunityId',  'title category duration')
      .populate('organizationId', 'name organizationName')
      .sort({ issueDate: -1 });
    res.json(certs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get certificates issued by my organization
// @route   GET /api/certificates/issued
// @access  Organization
const getIssuedCertificates = async (req, res) => {
  try {
    const certs = await Certificate.find({ organizationId: req.user._id, isValid: true })
      .populate('volunteerId',    'name email profilePicture')
      .populate('opportunityId',  'title category duration')
      .sort({ issueDate: -1 });
    res.json(certs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Download certificate PDF
// @route   GET /api/certificates/download/:certificateId
// @access  Private (volunteer who owns it OR organization who issued it)
const downloadCertificate = async (req, res) => {
  try {
    const cert = await Certificate.findOne({
      certificateId: req.params.certificateId,
      isValid: true,
    });

    if (!cert) return res.status(404).json({ message: 'Certificate not found' });

    const isOwner = cert.volunteerId.toString()    === req.user._id.toString();
    const isOrg   = cert.organizationId.toString() === req.user._id.toString();
    if (!isOwner && !isOrg) return res.status(403).json({ message: 'Not authorized' });

    const filePath = path.join(
      __dirname, '../../uploads/certificates', `${cert.certificateId}.pdf`
    );

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'PDF file not found — try regenerating the certificate' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="certificate-${cert.verificationCode}.pdf"`
    );
    fs.createReadStream(filePath).pipe(res);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify certificate by verification code (public)
// @route   GET /api/certificates/verify/:code
// @access  Public
const verifyCertificate = async (req, res) => {
  try {
    const cert = await Certificate.findOne({
      verificationCode: req.params.code,
      isValid: true,
    })
      .populate('volunteerId',    'name')
      .populate('organizationId', 'name organizationName')
      .populate('opportunityId',  'title category duration');

    if (!cert) return res.status(404).json({ message: 'Certificate not found or has been revoked' });

    res.json({
      valid: true,
      certificate: {
        volunteerName:    cert.volunteerId.name,
        organization:     cert.organizationId.organizationName || cert.organizationId.name,
        opportunityTitle: cert.opportunityId.title,
        category:         cert.opportunityId.category,
        duration:         cert.opportunityId.duration,
        hoursCompleted:   cert.hoursCompleted,
        issueDate:        cert.issueDate,
        certificateId:    cert.certificateId,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  issueCertificate, getMyCertificates, getIssuedCertificates,
  downloadCertificate, verifyCertificate,
};
