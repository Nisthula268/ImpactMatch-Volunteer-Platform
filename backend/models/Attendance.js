const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  volunteerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  opportunityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Opportunity', required: true },
  checkInTime: { type: Date },
  checkOutTime: { type: Date },
  checkInLocation: {
    latitude: { type: Number },
    longitude: { type: Number },
  },
  checkOutLocation: {
    latitude: { type: Number },
    longitude: { type: Number },
  },
  verified: { type: Boolean, default: false },
  totalHours: { type: Number },
}, { timestamps: true });

attendanceSchema.index({ volunteerId: 1, opportunityId: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
