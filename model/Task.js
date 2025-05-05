const mongoose = require('mongoose');
const TaskSchema = new mongoose.Schema({
  title: String,
  description: String,
  dueDate: Date,
  priority: { type: String, enum: ['Low', 'Medium', 'High'] },
  status: { type: String, enum: ['To Do', 'In Progress', 'Done'] },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Taskmanagementusers' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Taskmanagementusers' },
});
module.exports = mongoose.model('Task', TaskSchema);
