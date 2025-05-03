const Task=require('../model/Task');
const Notification=require('../model/Notification');
exports.createTask = async (req, res) => {
    const { title, description, dueDate, priority, assignedTo } = req.body;
    try {
      const task = new Task({ title, description, dueDate, priority, assignedTo, createdBy: req.user.id });
      await task.save();
  
      if (assignedTo) {
        const notification = new Notification({ message: `New task assigned: ${title}`, user: assignedTo });
        await notification.save();
      }
  
      res.json(task);
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  };
  exports.getTasks = async (req, res) => {
    const { status, priority, dueDate, search } = req.query;
    let query = {};
  
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (dueDate) query.dueDate = { $lte: new Date(dueDate) };
    if (search) query.title = { $regex: search, $options: 'i' };
  
    query.$or = [{ createdBy: req.user.id },{ assignedTo: req.user.id }];
  
    const tasks = await Task.find(query).populate('createdBy assignedTo');
    res.json(tasks);
  };
  exports.updateTask = async (req, res) => {
    const { title, description, dueDate, priority, status, assignedTo } = req.body;
    try {
      const task = await Task.findById(req.params.id);
      if (!task) return res.status(404).json({ message: 'Task not found' });
  
      if (title) task.title = title;
      if (description) task.description = description;
      if (dueDate) task.dueDate = dueDate;
      if (priority) task.priority = priority;
      if (status) task.status = status;
      if (assignedTo) task.assignedTo = assignedTo;
  
      await task.save();
  
      res.json({task,message:"Task updated succesfully"});
    } catch (err) {
      res.status(500).json({ message: "Task couldn't updated" });
    }
  };
  exports.deleteTask = async (req, res) => {
    try {
      const task = await Task.findByIdAndDelete(req.params.id);
      if (!task) return res.status(404).json({ message: 'Task not found' });
  
      res.json({ message: 'Task deleted successfully' });
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  };