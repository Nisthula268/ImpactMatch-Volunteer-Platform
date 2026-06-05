const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['volunteer', 'organization', 'mentor', 'admin'], required: true },
  skills: [{ type: String, trim: true }],
  interests: [{ type: String, trim: true }],
  bio: { type: String, maxlength: 1000 },
  mentorDomains: [{ type: String }],
  availability: { type: String, enum: ['weekdays', 'weekends', 'both', 'flexible'], default: 'flexible' },
  organizationName: { type: String },
  location: { type: String },
  profilePicture: { type: String },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);
