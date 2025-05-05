const express=require("express");
const {register,login,verifyOtp,getUserFromToken,getAllUsers}=require("../controllers/authController");
const taskController=require('../controllers/TaskController')
const authmiddleware = require("../middleware/authmiddleware");
const router=express.Router();
router.post("/register",register);
router.post("/login",login);

router.post("/verifyOtp",verifyOtp);
router.get("/getuser",getUserFromToken);
router.get("/getalluser",getAllUsers);

router.post('/createtasks', authmiddleware, taskController.createTask);
router.get('/tasks', authmiddleware, taskController.getTasks);

router.put('/tasks/:id', authmiddleware, taskController.updateTask);
router.delete('/tasks/:id', authmiddleware, taskController.deleteTask);
router.get('/notification',authmiddleware,taskController.getNotifications)
module.exports=router;