require("dotenv").config();
const express = require("express");
const connectDB = require("./db/db");

const port = process.env.port || 5005;

const app = express();
//database config
connectDB();
//middleware
app.use(express.json());

//import the routers file
const userroutes = require("./route/user.route");
const candidateroute = require("./route/candidate.route");

//use the router
app.use("/user", userroutes);
app.use("/candidate", candidateroute);
app.listen(port, () => {
  console.log(`server is ruinign on ${port}`);
});
