const Task=require('../model/Task');
const Notification=require('../model/Notification');
const User=require('../model/User')
const { createLog } = require('./logger');

const Log = require('../model/Log');

exports.getActivityLogs = async (req, res) => {
    try {
        const logs = await Log.find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .limit(20)
            .populate('user', 'name email')
            .populate('relatedEntity');
            
        res.json(logs);
    } catch (error) {
        console.error('Error fetching logs:', error);
        res.status(500).json({ message: 'Failed to fetch activity logs' });
    }
};

exports.getAllActivityLogs = async (req, res) => {
    try {
        
        
        const logs = await Log.find()
            .sort({ createdAt: -1 })
            .limit(100)
            .populate('user', 'name email')
            .populate('relatedEntity');
            
        res.json(logs);
    } catch (error) {
        console.error('Error fetching all logs:', error);
        res.status(500).json({ message: 'Failed to fetch activity logs' });
    }
};
exports.createTask = async (req, res) => {


  const existingTask = await Task.findOne({ title });
        
        if (existingTask) {
            return res.status(400).json({ message: "A task with the same title already exists." });
        }
    
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
  
         const changes = [];

    if (title && task.title !== title) { changes.push(`title: ${task.title} → ${title}`); task.title = title; }
    if (description && task.description !== description) { changes.push(`description updated`); task.description = description; }
    if (dueDate && task.dueDate !== dueDate) { changes.push(`dueDate: ${task.dueDate} → ${dueDate}`); task.dueDate = dueDate; }
    if (priority && task.priority !== priority) { changes.push(`priority: ${task.priority} → ${priority}`); task.priority = priority; }
    if (status && task.status !== status) { changes.push(`status: ${task.status} → ${status}`); task.status = status; }
    if (assignedTo && task.assignedTo?.toString() !== assignedTo) { changes.push(`assignedTo: ${task.assignedTo} → ${assignedTo}`); task.assignedTo = assignedTo; }

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
        task.status === 'Done'
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

    let optimalUser = null;
    if (userTaskStats.length > 0) {
      const minTotalTasks = userTaskStats[0].totalTasks;
      const topCandidates = userTaskStats.filter(
        stat => stat.totalTasks === minTotalTasks
      );

      if (topCandidates.length === 1) {
        optimalUser = topCandidates[0].user;
      } else {
        const randomIndex = Math.floor(Math.random() * topCandidates.length);
        optimalUser = topCandidates[randomIndex].user;
      }
    }

    res.json({
      optimalUser,
      stats: userTaskStats
    });

  } catch (err) {
    console.error('Error finding optimal user:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
