const express=require("express");
const {register,login,verifyOtp,getUserFromToken,getAllUsers, AllUsers, sendResetLink, resetPassword,googleLogin}=require("../controllers/authController");
const taskController=require('../controllers/TaskController')
const authmiddleware = require("../middleware/authmiddleware");
const router=express.Router();
router.post("/register",register);
router.post("/login",login);

router.post("/verifyOtp",verifyOtp);
router.post("/resetpassword/:token",resetPassword);
router.get("/getuser",getUserFromToken);
router.get("/getalluser",getAllUsers);
router.get("/allusers",authmiddleware,AllUsers);
router.post("/forgotpassword",sendResetLink);
router.post('/createtasks', authmiddleware, taskController.createTask);
router.get('/tasks', authmiddleware, taskController.getTasks);

router.put('/tasks/:id', authmiddleware, taskController.updateTask);
router.delete('/tasks/:id', authmiddleware, taskController.deleteTask);
router.get('/notification',authmiddleware,taskController.getNotifications);
router.put("/notifications/markread",authmiddleware,taskController.markAllNotificationsAsRead);
router.post("/googlelogin",googleLogin);
router.get('/tasks/optimal-user', authmiddleware, taskController.getOptimalUserForTask);
module.exports=router;
