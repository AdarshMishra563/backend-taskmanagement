const express=require("express");
const {register,login,verifyOtp,getUserFromToken}=require("../controllers/authController");
const router=express.Router();
router.post("/register",register);
router.post("/login",login);

router.post("/verifyOtp",verifyOtp);
router.get("/getuser",getUserFromToken);
module.exports=router;