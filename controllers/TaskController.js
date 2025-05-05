const Task=require('../model/Task');
const Notification=require('../model/Notification');
const User=require('../model/User')
exports.createTask = async (req, res) => {
    const { title, description, dueDate,status, priority, assignedTo } = req.body;
    try {
      const task = new Task({ title, description,status, dueDate, priority, assignedTo, createdBy: req.user.id });
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
  console.log(req.query)
    if (status) {
      try {
        const statusArray = JSON.parse(status); 
        console.log(status,statusArray)
        query.status = { $in: statusArray };  
      } catch (err) {
        return res.status(400).json({ message: "Invalid status format" });
      }
    }
  
    if (priority) {
      try {
        const priorityArray = JSON.parse(priority); 
        query.priority = { $in: priorityArray };  
      } catch (err) {
        return res.status(400).json({ message: "Invalid priority format" });
      }
    }
  
    if (dueDate) query.dueDate = { $lte: new Date(dueDate) };
    const userCondition = [
      { createdBy: req.user.id },
      { assignedTo: req.user.id }
    ];
    
    if (search) {
      query.$and = [
        { $or: userCondition },
        {
          $or: [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
          ]
        }
      ];
    } else {
      query.$or = userCondition;
    }



    const tasks = await Task.find(query).populate('createdBy assignedTo');
    console.log(tasks)
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