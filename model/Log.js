const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: ['register', 'login', 'task_create', 'task_update', 'task_delete', 'task_assign', 'password_reset']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  details: {
    type: String,
    required: true
  },
  relatedEntity: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'relatedEntityModel'
  },
  relatedEntityModel: {
    type: String,
    enum: ['Task', 'User']
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Log', LogSchema);
