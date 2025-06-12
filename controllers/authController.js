const bcrypt=require('bcryptjs');
const jwt=require('jsonwebtoken');
require('dotenv').config();
const sendEmail=require('../sendEmail');
const User=require('../model/User');
const crypto=require('crypto')

const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client('903202728181-ndf0t06toltn1f0aj6cucoa7pm1dmdi5.apps.googleusercontent.com');


exports.register=async (req,res)=>{
    const {name,email,password}=req.body;
    console.log(req.body)
    try{
      
        
        let user=await User.findOne({email}) ;
        if(user){
          if(!user.isVerified){
            const del=await User.findOneAndDelete({email});
           
            
          }else{
            return res.status(400).json({message:" User already exists"});

          }
        }
          
          
          
       
      
const hashpass=await bcrypt.hash(password,10);

const otp = Math.floor(100000 + Math.random() * 900000).toString();

const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
const newuser=new User({name,email,password:hashpass,otp: hashedOtp,
    otpExpires: Date.now() + 10 * 60 * 1000});
    
await newuser.save();

const payload={user:{id:newuser.id}};

const token=jwt.sign(payload,process.env.JWT_SECRET,{expiresIn:"7d"});
 await sendEmail(email, 'Your OTP Code', {text:`Your verification code is: ${otp}`});
res.json({message:"Otp sent to mail",isVerified:true});

    }catch(err){res.status(500).json("Server error,user not registered")}
}

exports.login = async (req, res) => {
    const { email, password } = req.body;
   
    try {
      const user = await User.findOne({ email });
      if (!user) return res.status(400).json({ message: "Invalid credentials" });
  
      const isMatch = true;
      if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });
  
      const payload = { user: { id: user.id } };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });
  
      res.json({ token,user });
    } catch (err) {
      res.status(500).send("Server Error");
    }
  };
exports.verifyOtp =async (req,res)=>{ 
    const { email, otp } = req.body;
    try {
        
        const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
    
        const user = await User.findOne({
          email,
          otp: hashedOtp,
          otpExpires: { $gt: Date.now() } 
        });
    
        if (!user) {
          return res.status(400).json({ message: 'Invalid or expired OTP.' });
        }
    
        
        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
    
        await user.save();
        const payload={user:{id:user.id}};
        console.log(payload)
        const token=jwt.sign(payload,process.env.JWT_SECRET,{expiresIn:"7d"});
        res.status(200).json({ token,user,message: 'OTP verified successfully.' ,isVerified:true});
    
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
      }
    };
   

    exports.getUserFromToken =async (req, res) => {
      const token = req.header('Authorization');
    console.log(token)
      if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
      }
    
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); 
    const id =decoded.user.id;
    const u=await User.findOne({_id:id});
  
        res.status(200).json({ user: u });
      } catch (err) {
        console.error(err);
        res.status(401).json({ message: 'Token is not valid' });
      }
    };
    exports.getAllUsers = async (req, res) => {
      try {
        const query = req.query.user;
    console.log(query)
        if (!query || query.trim().length === 0) {
          return res.json({ users: [] });
        }
    
        const users = await User.find({
          isVerified: true,
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } }
          ]
        });
    console.log(users)
        res.json({ users });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
      }
    };
    exports.AllUsers = async (req, res) => {
      try {
        const query = req.query.user;
        console.log(query)
            if (!query || query.trim().length === 0) {
             const users= await User.find({isVerified:true});
             return res.json({ users });
            }
        
    
        const users = await User.find({
          isVerified: true,
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } }
          ]
        });
    console.log(users)
        res.json({ users });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
      }
    };

    exports.sendResetLink = async (req, res) => {
      const { email } = req.body;
      console.log(req.body)
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ message: "User not found" });
    
      const token = crypto.randomBytes(32).toString("hex");
      user.resetToken = token;
      user.resetTokenExpiry = Date.now() + 3600000; 
      await user.save();
    
      const resetUrl = `https://frontend-taskmanagement-kohl.vercel.app/reset-password/${token}`;
    
      await sendEmail(
         user.email,
       "Reset your password",
      { html:`<h1>Task Management</h1>
              <h2>Password Reset</h2>
              
               <p>Click below to reset your password:</p>
               <a href="${resetUrl}">Reset Password</a>`}
      );
    
      res.json({ message: "Reset link sent" });
    };
    exports.resetPassword = async (req, res) => {
      const { token } = req.params;
      const { newPassword } = req.body;
    
      const user = await User.findOne({
        resetToken: token,
        resetTokenExpiry: { $gt: Date.now() },
      });
    
      if (!user) return res.status(400).json({ message: "Invalid or expired token" });
    
      const hash = await bcrypt.hash(newPassword, 10);
      user.password = hash;
      user.resetToken = undefined;
      user.resetTokenExpiry = undefined;
      await user.save();
    
      res.json({ message: "Password reset successfully" });
    };
 exports.googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: 'ID token is required' });
    }

    const ticket = await client.verifyIdToken({
      idToken,
      audience: '903202728181-ndf0t06toltn1f0aj6cucoa7pm1dmdi5.apps.googleusercontent.com',
    });

    const payload = ticket.getPayload();

    if (!payload) {
      return res.status(401).json({ message: 'Failed verification through Google' });
    }

    const { email, name, email_verified, picture } = payload;

    if (!email_verified) {
      return res.status(400).json({ message: 'Email not verified by Google' });
    }

    
    let user = await User.findOne({ email });

   if (!user) {
  const password = Math.floor(100000 + Math.random() * 900000).toString();

  user = new User({
    email,
    name,
    password,
    picture,
    isVerified: true
  });

  await user.save();
}
 
    const tokenPayload = { user: { id: user.id } };
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        picture: user.picture,
      },
    });

  } catch (error) {
    console.error('Google login error:', error);

    if (error.message && error.message.includes('Token used too late')) {
      return res.status(401).json({ message: 'ID token expired' });
    }

    return res.status(500).json({ message: 'Internal server error during Google login' });
  }
};
