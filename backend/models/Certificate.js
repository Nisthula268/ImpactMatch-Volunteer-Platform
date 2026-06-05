const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const certificateSchema = new mongoose.Schema({
  certificateId: { type: String, unique: true, default: () => uuidv4() },
  volunteerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  opportunityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Opportunity', required: true },
  applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
  issueDate: { type: Date, default: Date.now },
  verificationCode: { type: String, unique: true, default: () => uuidv4().replace(/-/g, '').toUpperCase().slice(0, 12) },
  certificateURL: { type: String },
  hoursCompleted: { type: Number },
  isValid: { type: Boolean, default: true },
}, { timestamps: true });

certificateSchema.index({ certificateId: 1 });
certificateSchema.index({ verificationCode: 1 });

module.exports = mongoose.model('Certificate', certificateSchema);
