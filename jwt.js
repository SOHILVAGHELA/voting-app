const jwt = require("jsonwebtoken");

const jwtAuthMiddleware = (req, res, next) => {
  //first check  request  headers has authorization or not
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).json({ error: "Token NOt Found" });
  }
  //extract the jwt token from the request headers
  const token = req.headers.authorization.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    //verify the jwt token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    //atach user infomation to the request object
    req.user = decoded;
    next();
  } catch (error) {
    console.log(error);
    res.status(401).json({ error: "invalid token" });
  }
};

//function to generate jwt token
const generateToken = (userData) => {
  //generate new jwt token using userdata
  return jwt.sign(userData, process.env.JWT_SECRET, { expiresIn: 30000 });
};
module.exports = { jwtAuthMiddleware, generateToken };
