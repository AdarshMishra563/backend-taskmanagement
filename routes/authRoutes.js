const express=require("express");
const {register,login,verifyOtp,getUserFromToken,}=require("../controllers/authController");
const taskController=require('../controllers/TaskController')
const authmiddleware = require("../middleware/authmiddleware");
const router=express.Router();
router.post("/register",register);
router.post("/login",login);

router.post("/verifyOtp",verifyOtp);
router.get("/getuser",getUserFromToken);

router.post('/tasks', authmiddleware, taskController.createTask);
router.get('/tasks', authmiddleware, taskController.getTasks);

router.put('/tasks/:id', authmiddleware, taskController.updateTask);
router.delete('/tasks/:id', authmiddleware, taskController.deleteTask);

module.exports=router;