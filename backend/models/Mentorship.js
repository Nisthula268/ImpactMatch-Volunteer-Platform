const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  topic: { type: String, required: true },
  notes: { type: String },
  feedback: { type: String },
  status: { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'scheduled' },
});

const mentorshipSchema = new mongoose.Schema({
  mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  menteeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'active', 'completed', 'rejected'], default: 'pending' },
  skillGapAnalysis: { type: String },
  goalDescription: { type: String },
  sessions: [sessionSchema],
  completionApprovedAt: { type: Date },
  mentorFeedback: { type: String },
}, { timestamps: true });

mentorshipSchema.index({ mentorId: 1 });
mentorshipSchema.index({ menteeId: 1 });

module.exports = mongoose.model('Mentorship', mentorshipSchema);
