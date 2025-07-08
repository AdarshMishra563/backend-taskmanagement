const Log = require('../model/Log');
const User = require('../model/User');
const createLog = async (action, userId, details, relatedEntity = null, req = null) => {
  try {
    const logData = {
      action,
      user: userId,
      details,
      relatedEntity: relatedEntity?._id || relatedEntity,
      relatedEntityModel: relatedEntity?.constructor?.modelName
    };

    if (req) {
      logData.ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      logData.userAgent = req.headers['user-agent'];
    }

    const log = new Log(logData);
    await log.save();

    
    if (action !== 'login') {
      const oldLogs = await Log.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(1000)
        .select('_id');

      if (oldLogs.length > 0) {
        const ids = oldLogs.map(l => l._id);
        await Log.deleteMany({ _id: { $in: ids } });
      }
    }

    return log;
  } catch (error) {
    console.error('Failed to create log:', error);
  }
};

module.exports = {
  createLog
};
