const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  volunteerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  opportunityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Opportunity', required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected', 'completed'], default: 'pending' },
  attendanceVerified: { type: Boolean, default: false },
  coverLetter: { type: String },
  matchScore: { type: Number },
  organizationNotes: { type: String },
  completedAt: { type: Date },
}, { timestamps: true });

applicationSchema.index({ volunteerId: 1, opportunityId: 1 }, { unique: true });
applicationSchema.index({ opportunityId: 1 });
applicationSchema.index({ status: 1 });

module.exports = mongoose.model('Application', applicationSchema);
