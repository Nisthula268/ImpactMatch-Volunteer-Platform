const mongoose = require('mongoose');

const opportunitySchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: { type: String, required: true, enum: ['education', 'environment', 'health', 'community', 'technology', 'arts', 'sports', 'other'] },
  skills_required: [{ type: String, trim: true }],
  interests_matched: [{ type: String, trim: true }],
  location: {
    address: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    isRemote: { type: Boolean, default: false },
  },
  duration: { type: String, required: true },
  hoursPerWeek: { type: Number },
  startDate: { type: Date },
  endDate: { type: Date },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  maxVolunteers: { type: Number, default: 10 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

opportunitySchema.index({ category: 1 });
opportunitySchema.index({ organizationId: 1 });
opportunitySchema.index({ 'location.latitude': 1, 'location.longitude': 1 });

module.exports = mongoose.model('Opportunity', opportunitySchema);
