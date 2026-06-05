const express = require('express');
const router  = express.Router();
const {
  issueCertificate, getMyCertificates, getIssuedCertificates,
  downloadCertificate, verifyCertificate,
} = require('../controllers/certificateController');
const { protect, authorize } = require('../middleware/auth');

// Public
router.get('/verify/:code', verifyCertificate);

// Volunteer
router.get('/my',                       protect, authorize('volunteer'),    getMyCertificates);
router.get('/download/:certificateId',  protect,                            downloadCertificate);

// Organization
router.get ('/issued',                  protect, authorize('organization'), getIssuedCertificates);
router.post('/issue/:applicationId',    protect, authorize('organization'), issueCertificate);

module.exports = router;
