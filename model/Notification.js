const mongoose = require('mongoose');
const NotificationSchema = new mongoose.Schema({
  message: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isRead: { type: Boolean, default: false },
});
module.exports = mongoose.model('Notification', NotificationSchema);
