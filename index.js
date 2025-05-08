const express = require("express");
const db = require("./model/db");
db();
const User=require('./model/User')
const http = require("http");
const cors = require("cors");
require("dotenv").config();
const app = express();
app.use(cors());
const server = http.createServer(app);
app.use(express.json());
const authRoutes=require('./routes/authRoutes');
app.use("/api/auth",authRoutes);

const socketHandler=require("./controllers/VideoController")
const PORT=4000 || 5000;
socketHandler(server);


app.listen(PORT,()=>console.log(`Server is running on ${PORT}`))