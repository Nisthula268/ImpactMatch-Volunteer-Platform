/**
 * ImpactMatch Database Seed Script
 * Usage: node scripts/seed.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
dotenv.config();

const User = require('../models/User');
const Opportunity = require('../models/Opportunity');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Clear existing data
  await User.deleteMany({});
  await Opportunity.deleteMany({});

  // Create users
  const orgUser = await User.create({
    name: 'Green Earth Foundation',
    email: 'org@impactmatch.com',
    password: 'password123',
    role: 'organization',
    organizationName: 'Green Earth Foundation',
    bio: 'Dedicated to environmental sustainability and community action.',
  });

  const volunteer = await User.create({
    name: 'Alex Johnson',
    email: 'volunteer@impactmatch.com',
    password: 'password123',
    role: 'volunteer',
    skills: ['Teaching', 'Python', 'Leadership', 'Writing'],
    interests: ['education', 'technology', 'community'],
    bio: 'Passionate about using technology for social good.',
    availability: 'weekends',
  });

  const mentor = await User.create({
    name: 'Dr. Sarah Chen',
    email: 'mentor@impactmatch.com',
    password: 'password123',
    role: 'mentor',
    mentorDomains: ['Python', 'Data Analysis', 'Leadership', 'Career Development'],
    skills: ['Python', 'Data Analysis', 'Teaching', 'Leadership'],
    bio: 'Former NGO director with 15 years of experience in tech for good.',
    availability: 'both',
  });

  // Create opportunities
  await Opportunity.insertMany([
    {
      title: 'Python Coding Bootcamp Instructor',
      description: 'Teach Python programming to underprivileged youth ages 14-18 on weekends. Help bridge the digital divide.',
      category: 'education',
      skills_required: ['Python', 'Teaching', 'Leadership'],
      interests_matched: ['education', 'technology'],
      location: { address: '123 Community Center, San Francisco, CA', latitude: 37.7749, longitude: -122.4194, isRemote: false },
      duration: '3 months',
      hoursPerWeek: 5,
      organizationId: orgUser._id,
    },
    {
      title: 'Environmental Data Analyst',
      description: 'Analyze climate data and create visualizations to support our environmental advocacy campaigns.',
      category: 'environment',
      skills_required: ['Data Analysis', 'Python', 'Writing'],
      interests_matched: ['environment', 'technology'],
      location: { isRemote: true },
      duration: '2 months',
      hoursPerWeek: 8,
      organizationId: orgUser._id,
    },
    {
      title: 'Community Newsletter Writer',
      description: 'Write engaging monthly newsletters about our community programs and impact stories.',
      category: 'community',
      skills_required: ['Writing', 'Marketing'],
      interests_matched: ['community', 'arts'],
      location: { isRemote: true },
      duration: '6 months',
      hoursPerWeek: 3,
      organizationId: orgUser._id,
    },
  ]);

  console.log('\n✅ Seed completed!');
  console.log('\nTest Accounts:');
  console.log('  Organization: org@impactmatch.com / password123');
  console.log('  Volunteer:    volunteer@impactmatch.com / password123');
  console.log('  Mentor:       mentor@impactmatch.com / password123');

  await mongoose.disconnect();
};

seed().catch(err => { console.error(err); process.exit(1); });
