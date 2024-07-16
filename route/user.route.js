const express = require("express");
const router = express.Router();
const User = require("./../model/user.model");
const { hashPassword, comparePassword } = require("./../helper/authhelper");
const { jwtAuthMiddleware, generateToken } = require("./../jwt");

//singup route
router.post("/signup", async (req, res) => {
  try {
    const {
      name,
      email,
      mobile,
      password,
      age,
      address,
      aadharCardNumber,
      role,
    } = req.body;
    // Validations
    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }
    if (!mobile) {
      return res.status(400).json({ message: "mobile is required" });
    }
    if (!address) {
      return res.status(400).json({ message: "Address is required" });
    }
    if (!aadharCardNumber) {
      return res.status(400).json({ message: "aadharCardNumber is required" });
    }
    const existingUser = await User.findOne({ email: email });
    // console.log("Existing user:", existingUser);

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already registered, please login",
      });
    }
    // Hash password
    const hashedPassword = await hashPassword(password);
    //  console.log("Hashed password:", hashedPassword);

    //create a new user document using  the mongoose model
    const newuser = new User({
      name,
      email,
      mobile,
      password: hashedPassword,
      age,
      address,
      aadharCardNumber,
      role: role || "Voter",
    });
    //save the new user  to the database
    const response = await newuser.save();
    const payload = {
      id: response.id,
    };
    console.log(JSON.stringify(payload));
    const token = generateToken(payload);
    console.log("Token is :", token);
    res.status(200).json({ response: response, token });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//login route
router.post("/loign", async (req, res) => {
  try {
    //extract aadharcardnumber and password from  request body
    const { aadharCardNumber, password } = req.body;
    //find the user by aadharcadnumber
    const user = await User.findOne({ aadharCardNumber: aadharCardNumber });
    //if user does not exist or password  does not match,return error
    if (!user)
      return res
        .status(401)
        .json({ error: "invalid aadharcardnumber or password " });

    const match = await comparePassword(password, user.password);
    if (!match) {
      return res.status(200).json({ message: "Invalid password" });
    }
    //generate token
    const payload = {
      id: user.id,
    };
    const token = generateToken(payload);
    //return token as response
    res.json({ token });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "internal server error" });
  }
});
//profile
router.get("/profile", jwtAuthMiddleware, async (req, res) => {
  try {
    const userdata = req.user;
    const userid = userdata.id;
    const user = await User.findById(userid);
    res.status(200).json(user);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "internal sever error" });
  }
});
router.put("/profile/password", jwtAuthMiddleware, async (req, res) => {
  try {
    const userId = req.user.id; // Extract the id from the token
    const { currentPassword, newPassword } = req.body; // Extract current and new password from the body

    // Find the user by userId
    const user = await User.findById(userId).exec();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // If current password does not match, return error
    const match = await comparePassword(currentPassword, user.password);
    if (!match) {
      return res.status(400).json({ message: "Invalid current password" });
    }

    // Hash the new password
    const hashedPassword = await hashPassword(newPassword);

    // Update the user's password
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
