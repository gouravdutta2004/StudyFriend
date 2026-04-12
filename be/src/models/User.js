const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 8 },
  avatar: { type: String, default: '' },
  bio: { type: String, default: '', maxlength: 300 },
  subjects: [{ type: String }],
  educationLevel: {
    type: String,
    enum: ['High School', 'Undergraduate', 'Graduate', 'PhD', 'Self-Learner', 'Other'],
    default: 'Undergraduate'
  },
  university: { type: String, default: '' },
  studyStyle: {
    type: String,
    enum: ['Visual', 'Auditory', 'Reading/Writing', 'Kinesthetic', 'Mixed', 'Pomodoro'],
    default: 'Mixed'
  },
  availability: [{
    day: { type: String, enum: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'] },
    startTime: String,
    endTime: String
  }],
  preferOnline: { type: Boolean, default: true },
  connections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  pendingRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  sentRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  skippedMatches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', select: false }],
  isActive: { type: Boolean, default: true },
  resetPasswordToken: { type: String, select: false },
  resetPasswordExpire: { type: Date, select: false },
  major: { type: String, default: '' },
  currentStreak: { type: Number, default: 0 },
  league: { type: String, enum: ['BRONZE', 'SILVER', 'GOLD', 'ELITE'], default: 'BRONZE' },
  totalStudyHours: { type: Number, default: 0 },
  studyHours: { type: Number, default: 0 },
  streak: { type: Number, default: 0 },
  lastStudyDate: { type: Date, default: null },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  badges: [{ type: String }],
  socialLinks: {
    github:    { type: String, default: '' },
    linkedin:  { type: String, default: '' },
    instagram: { type: String, default: '' },
    twitter:   { type: String, default: '' },
    facebook:  { type: String, default: '' },
    youtube:   { type: String, default: '' },
  },
  isVerified: { type: Boolean, default: false },
  weeklyGoals: [{
    title: { type: String, required: true },
    targetHours: { type: Number, required: true },
    currentHours: { type: Number, default: 0 },
    isCompleted: { type: Boolean, default: false }
  }],
  activityLog: [{ type: Date }], // For GitHub-style heatmap
  timezone: { type: String, default: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' },
  subscription: {
    plan: { type: String, enum: ['basic', 'pro', 'squad'], default: 'basic' },
    activeUntil: { type: Date }
  },
  role: { type: String, enum: ['USER', 'ORG_ADMIN', 'SUPER_ADMIN'], default: 'USER' },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: false, select: false },
  verificationStatus: { type: String, enum: ['APPROVED', 'PENDING', 'REJECTED'], default: 'APPROVED' },
  kycStatus: { type: String, enum: ['UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED'], default: 'UNVERIFIED' },
  verificationDetails: {
    verifiedInstitution: { type: String, default: '', select: false },
    verifiedUntil: { type: Date, default: null, select: false }
  },
  studyProfile: {
    focusSpan: { type: String, enum: ['POMODORO', 'DEEP_WORK', ''] },
    learningType: { type: String, enum: ['VISUAL', 'THEORY', 'PROBLEM_SOLVING', ''] },
    energyPeak: { type: String, enum: ['MORNING', 'NIGHT_OWL', ''] },
    consistencyScore: { type: Number, default: 100 },
    reliabilityRating: { type: Number, default: 5.0 }
  },
  // ── Trust & Safety ────────────────────────────────────────────────────────
  trustStrikes:  { type: Number, default: 0, select: false },
  isShadowBanned: { type: Boolean, default: false, select: false },
  // ── Account Security ──────────────────────────────────────────────────────
  loginAttempts: { type: Number, default: 0, select: false },
  lockUntil: { type: Date, select: false },
  // ── Gamification — Trophy Room ────────────────────────────────────────────
  quizzesPassed: { type: Number, default: 0 },
  skillMastery:  { type: Map, of: Number, default: {} },
}, { timestamps: true });

// Virtual for account lock status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Account lockout logic
userSchema.methods.incLoginAttempts = function() {
  // Reset attempts if lock has expired
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  const maxAttempts = 5;
  const lockTime = 2 * 60 * 60 * 1000; // 2 hours
  
  // Lock account after max attempts
  if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + lockTime };
  }
  
  return this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 }
  });
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpire;
  delete obj.trustStrikes;
  delete obj.isShadowBanned;
  delete obj.loginAttempts;
  delete obj.lockUntil;
  delete obj.verificationDetails;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
