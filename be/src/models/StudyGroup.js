const mongoose = require('mongoose');

const studyGroupSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  subject: { type: String, required: true },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isPublic: { type: Boolean, default: true },
  maxMembers: { type: Number, default: 50 },
  avatar: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('StudyGroup', studyGroupSchema);
