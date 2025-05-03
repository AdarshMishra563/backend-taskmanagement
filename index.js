const express = require("express");
const db = require("./model/db");
db();
const User=require('./model/User')
const cors = require("cors");
require("dotenv").config();
const app = express();
app.use(cors());
app.use(express.json());
const authRoutes=require('./routes/authRoutes');
app.use("/api/auth",authRoutes);
const PORT=4000 || 5000;



app.listen(PORT,()=>console.log(`Server is running on ${PORT}`))