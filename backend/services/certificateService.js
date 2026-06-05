const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate a PDF certificate for a completed volunteer engagement
 * @param {Object} params - Certificate data
 * @returns {Promise<string>} File path of the generated PDF
 */
const generateCertificatePDF = async ({
  volunteerName,
  organizationName,
  opportunityTitle,
  duration,
  certificateId,
  verificationCode,
  issueDate,
  hoursCompleted,
}) => {
  return new Promise((resolve, reject) => {
    const outputDir = path.join(__dirname, '../../uploads/certificates');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const filePath = path.join(outputDir, `${certificateId}.pdf`);
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 50 });
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    // Background
    doc.rect(0, 0, doc.page.width, doc.page.height).fill('#f8f9fa');

    // Border
    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
      .lineWidth(3).stroke('#2563eb');
    doc.rect(28, 28, doc.page.width - 56, doc.page.height - 56)
      .lineWidth(1).stroke('#93c5fd');

    // Header
    doc.fillColor('#1e3a5f')
      .font('Helvetica-Bold')
      .fontSize(36)
      .text('CERTIFICATE OF COMPLETION', 0, 70, { align: 'center' });

    doc.fillColor('#2563eb')
      .fontSize(14)
      .font('Helvetica')
      .text('ImpactMatch — Volunteer Engagement Platform', 0, 120, { align: 'center' });

    // Divider
    doc.moveTo(100, 145).lineTo(doc.page.width - 100, 145).lineWidth(1).stroke('#2563eb');

    // Body
    doc.fillColor('#374151').fontSize(16).font('Helvetica')
      .text('This is to certify that', 0, 170, { align: 'center' });

    doc.fillColor('#1e3a5f').fontSize(28).font('Helvetica-Bold')
      .text(volunteerName, 0, 200, { align: 'center' });

    doc.fillColor('#374151').fontSize(16).font('Helvetica')
      .text('has successfully completed a volunteer engagement with', 0, 245, { align: 'center' });

    doc.fillColor('#2563eb').fontSize(22).font('Helvetica-Bold')
      .text(organizationName, 0, 273, { align: 'center' });

    doc.fillColor('#374151').fontSize(15).font('Helvetica')
      .text('for the opportunity:', 0, 312, { align: 'center' });

    doc.fillColor('#1e3a5f').fontSize(18).font('Helvetica-Bold')
      .text(`"${opportunityTitle}"`, 0, 335, { align: 'center' });

    // Details row
    const detailY = 385;
    doc.fillColor('#6b7280').fontSize(12).font('Helvetica')
      .text(`Duration: ${duration}`, 100, detailY)
      .text(`Hours Completed: ${hoursCompleted || 'N/A'}`, 350, detailY)
      .text(`Issue Date: ${new Date(issueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 570, detailY);

    // Divider
    doc.moveTo(100, 415).lineTo(doc.page.width - 100, 415).lineWidth(1).stroke('#d1d5db');

    // Footer — verification
    doc.fillColor('#9ca3af').fontSize(10).font('Helvetica')
      .text(`Certificate ID: ${certificateId}`, 0, 430, { align: 'center' })
      .text(`Verification Code: ${verificationCode}`, 0, 448, { align: 'center' })
      .text(`Verify at: ${process.env.CLIENT_URL || 'http://localhost:3000'}/verify/${verificationCode}`, 0, 466, { align: 'center' });

    doc.end();

    stream.on('finish', () => resolve(filePath));
    stream.on('error', reject);
  });
};

module.exports = { generateCertificatePDF };
