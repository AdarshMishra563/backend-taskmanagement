const express = require("express");
const router = express.Router();
const {
  register,
  login,
  verifyOtp,
  getUserFromToken,
  getAllUsers,
  AllUsers,
  sendResetLink,
  resetPassword,
  googleLogin
} = require("../controllers/authController");
const taskController = require('../controllers/TaskController');
const authmiddleware = require("../middleware/authmiddleware");
const { message } = require("../controllers/Interview");

// Input validation middleware
const validateRouteParams = (req, res, next) => {
  // Check for malformed parameters in URL
  if (req.params && Object.keys(req.params).length > 0) {
    for (const [key, value] of Object.entries(req.params)) {
      if (value.includes(':')) {
        return res.status(400).json({ 
          error: `Invalid parameter format in ${key}`
        });
      }
    }
  }
  next();
};

// API Routes
router.post("/register", register);
router.post("/login", login);
router.post("/ai", authmiddleware, message);
router.post("/verifyOtp", verifyOtp);
router.post("/resetpassword/:token([a-f0-9]{24}|[A-Za-z0-9-_]+)", validateRouteParams, resetPassword); // Added regex pattern for token
router.get("/getuser", getUserFromToken);
router.get("/getalluser", getAllUsers);
router.get("/allusers", authmiddleware, AllUsers);
router.post("/forgotpassword", sendResetLink);

// Task Routes with parameter validation
router.post('/createtasks', authmiddleware, taskController.createTask);
router.get('/tasks', authmiddleware, taskController.getTasks);
router.put('/tasks/:id([a-f0-9]{24})', authmiddleware, validateRouteParams, taskController.updateTask); // MongoDB ID pattern
router.delete('/tasks/:id([a-f0-9]{24})', authmiddleware, validateRouteParams, taskController.deleteTask);

// Notification Routes
router.get('/notification', authmiddleware, taskController.getNotifications);
router.put("/notifications/markread", authmiddleware, taskController.markAllNotificationsAsRead);
router.post("/googlelogin", googleLogin);

// Health check endpoint
router.get('/health', (req, res) => res.status(200).send('OK'));

module.exports = router;
