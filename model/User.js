const mongoose=require('mongoose')

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  otp: String,
  otpExpires: Date,
  resetToken: String,
  resetTokenExpiry: Date,
  isVerified: { type: Boolean, default: false },
});

module.exports= mongoose.model('Taskmanagementusers', userSchema);
