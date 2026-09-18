const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  firebaseUid: { type: String, sparse: true, unique: true, index: true },
  passwordHash: { type: String }, // Optional for pure Firebase OAuth users
  role: {
    type: String,
    enum: [
      'admin', 'family', 'caretaker', 'senior',
      'ADMIN', 'SUPER_ADMIN', 'FAMILY_MEMBER', 'CAREGIVER', 'HEALTHCARE_PROVIDER', 'SENIOR'
    ],
    default: 'family',
    index: true
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'PENDING_VERIFICATION', 'ONBOARDING', 'SUSPENDED', 'DISABLED'],
    default: 'ACTIVE',
    index: true
  },
  seniorId: { type: String, default: 'S102' },
  phone: { type: String },
  avatar: { type: String },
  emailVerified: { type: Boolean, default: false },
  onboardingCompleted: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Password comparison method
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

module.exports = mongoose.model('User', userSchema);

