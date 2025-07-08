const Task=require('../model/Task');
const Notification=require('../model/Notification');
const User=require('../model/User')
const { createLog } = require('../services/logger');
exports.createTask = async (req, res) => {
    const { title, description, dueDate,status, priority, assignedTo } = req.body;
    try {
      const task = new Task({ title, description,status, dueDate, priority, assignedTo, createdBy: req.user.id });
      await task.save();
    await createLog(
            'task_create', 
            req.user.id, 
            `Created task "${title}"`, 
            task,
            req
        );
      if (assignedTo) {
        const notification = new Notification({ message: `New task assigned: ${title}`, user: assignedTo });
        await notification.save();

           const assignedUser = await User.findById(assignedTo);
            await createLog(
                'task_assign', 
                req.user.id, 
                `Assigned task "${title}" to ${assignedUser.name}`, 
                task,
                req
            );
      }
  
      res.json(task);
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  };
  exports.getTasks = async (req, res) => {
    const { status, priority, dueDate, search } = req.query;
    let query = {};
  
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

          await createLog(
            'task_update', 
            req.user.id, 
            `Updated task "${task.title}": ${changes.join(', ')}`, 
            task,
            req
        );

  
      res.json({task,message:"Task updated succesfully"});
    } catch (err) {
      res.status(500).json({ message: "Task couldn't updated" });
    }
  };
  exports.deleteTask = async (req, res) => {
    try {
      console.log(req.params.id)
      const task = await Task.findByIdAndDelete(req.params.id);
      if (!task) return res.status(404).json({ message: 'Task not found' });
    await createLog(
            'task_delete', 
            req.user.id, 
            `Deleted task "${task.title}"`, 
            task,
            req
        );
      res.json({ message: 'Task deleted successfully' });
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  };
  exports.getNotifications = async (req, res) => {
    try {
      const userId = req.user.id;  
  console.log(userId)
      const notifications = await Notification.find({ user: userId })
        .sort({ createdAt: -1 });
  
      res.json(notifications);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Failed to fetch notifications' });
    }
  };
  exports.markAllNotificationsAsRead = async (req, res) => {
    try {
      const userId = req.user.id;
      console.log("Marking notifications as read for user:", userId);
  
      const result = await Notification.updateMany(
        { user: userId, isRead: false },  
        { $set: { isRead: true } }       
      );
  
      res.json({
        message: 'All notifications marked as read',
        updatedCount: result.modifiedCount
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Failed to update notifications' });
    }
  };
exports.getOptimalUserForTask = async (req, res) => {
  try {
   
     const users = await User.find({ isVerified: true }, '_id name');
    const tasks = await Task.find({})
      .populate('createdBy', '_id')
      .populate('assignedTo', '_id');

    const userTaskStats = users.map(user => {
      const createdTasks = tasks.filter(task => 
        task.createdBy && task.createdBy._id.equals(user._id)
      ).length;
      
      const assignedTasks = tasks.filter(task => 
        task.assignedTo && task.assignedTo._id.equals(user._id)
      ).length;
      
      const completedTasks = tasks.filter(task => 
        task.assignedTo && 
        task.assignedTo._id.equals(user._id) && 
        task.status === 'completed'
      ).length;

      return {
        user,
        totalTasks: createdTasks + assignedTasks,
        completedTasks
      };
    });


    userTaskStats.sort((a, b) => {
      if (a.totalTasks !== b.totalTasks) {
        return a.totalTasks - b.totalTasks;
      }
      return b.completedTasks - a.completedTasks;
    });

    const optimalUser = userTaskStats.length > 0 
      ? userTaskStats[0].user 
      : null;

    res.json({
      optimalUser,
      stats: userTaskStats 
    });

  } catch (err) {
    console.error('Error finding optimal user:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
