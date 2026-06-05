const path = require('path');
const fs   = require('fs');
const User = require('../models/User');
const { generateToken }     = require('../utils/generateToken');
const { handleAvatarUpload } = require('../middleware/upload');

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const {
      name, email, password, role,
      skills, interests, bio, mentorDomains, availability, organizationName,
    } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const user = await User.create({
      name, email, password, role,
      skills:        skills        || [],
      interests:     interests     || [],
      bio,
      mentorDomains: mentorDomains || [],
      availability,
      organizationName,
    });

    const token = generateToken(user._id, user.role);
    res.status(201).json({ token, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (!user.isActive) return res.status(403).json({ message: 'Account is deactivated' });

    const token = generateToken(user._id, user.role);
    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  res.json(req.user);
};

// @desc    Update user profile (text fields only)
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const {
      name, bio, skills, interests, availability,
      mentorDomains, location, organizationName,
    } = req.body;

    const updates = {};
    if (name             !== undefined) updates.name             = name;
    if (bio              !== undefined) updates.bio              = bio;
    if (skills           !== undefined) updates.skills           = Array.isArray(skills)        ? skills        : [];
    if (interests        !== undefined) updates.interests        = Array.isArray(interests)     ? interests     : [];
    if (availability     !== undefined) updates.availability     = availability;
    if (mentorDomains    !== undefined) updates.mentorDomains    = Array.isArray(mentorDomains) ? mentorDomains : [];
    if (location         !== undefined) updates.location         = location;
    if (organizationName !== undefined) updates.organizationName = organizationName;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload / replace profile picture
// @route   POST /api/auth/upload-picture
// @access  Private
const uploadProfilePicture = async (req, res) => {
  try {
    // Run multer – errors are thrown as exceptions
    await handleAvatarUpload(req, res);

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Delete the previous avatar file if one exists
    const existingUser = await User.findById(req.user._id);
    if (existingUser?.profilePicture) {
      const oldPath = path.join(__dirname, '../../', existingUser.profilePicture);
      if (fs.existsSync(oldPath)) {
        fs.unlink(oldPath, (err) => {
          if (err) console.warn('Could not delete old avatar:', err.message);
        });
      }
    }

    // Store the URL path (served by express.static)
    const profilePicture = `/uploads/avatars/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { profilePicture } },
      { new: true }
    );

    res.json({ profilePicture, user });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

module.exports = { register, login, getMe, updateProfile, uploadProfilePicture };
