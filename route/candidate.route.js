const express = require("express");
const router = express.Router();
const Candidate = require("./../model/candidate.model");
const { hashPassword, comparePassword } = require("./../helper/authhelper");
const { jwtAuthMiddleware, generateToken } = require("./../jwt");
const User = require("../model/user.model");

const checkAdminRole = async (userid) => {
  try {
    const user = await User.findById(userid);
    return user.role === "admin";
  } catch (error) {
    return false;
  }
};

//post route to create candidates
router.post("/", jwtAuthMiddleware, async (req, res) => {
  try {
    if (!(await checkAdminRole(req.user.id))) {
      return res.status(403).json({ message: "user has not Admin role" });
    }
    const data = req.body;

    //create a new candidate document using  the mongoose model
    const newcandidate = new Candidate(data);
    //save the new user  to the database
    const response = await newcandidate.save();

    res.status(200).json({ response: response });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//edit candidate
router.put("/:candidateID", jwtAuthMiddleware, async (req, res) => {
  try {
    if (!checkAdminRole(req.user.id)) {
      return res.status(403).json({ message: "user has not Admin role" });
    }
    const candidateID = req.params.candidateID; //extract the id from the URl parameter
    const updatecandidateData = req.body; //update data from reqest body
    const response = await Candidate.findByIdAndUpdate(
      candidateID,
      updatecandidateData,
      { new: true }
    );
    if (!response) {
      return res.status(404).json({ error: "candidate not found" });
    }
    res.status(200).json(response);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: "internal server error",
    });
  }
});
//delete candidate
router.delete("/:candidateID", jwtAuthMiddleware, async (req, res) => {
  try {
    if (!checkAdminRole(req.user.id)) {
      return res.status(403).json({ message: "user has not Admin role" });
    }
    const candidateID = req.params.candidateID; //extract the id from the URl parameter
    const response = await Candidate.findByIdAndDelete(candidateID);
    if (!response) {
      return res.status(404).json({ error: "candidate not found" });
    }
    console.log("candidate deleted");
    res.status(200).json(response);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: "internal server error",
    });
  }
});

//voting route
router.post("/vote/:candidateID", jwtAuthMiddleware, async (req, res) => {
  //no admin can vote
  //only user can vote
  const candidateID = req.params.candidateID;
  const userId = req.user.id;
  try {
    //find the candidate document with the specified candidateID
    const candidate = await Candidate.findById(candidateID);
    if (!candidate) {
      return res.status(404).json({ message: "candidate not found" });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ mesage: "user not found" });
    }
    if (user.isVoted) {
      return res.status(400).json({ message: "you have already voted" });
    }
    if (user.role == "admin") {
      return res.status(403).json({ message: "admin is  not allowed" });
    }

    //update  the candidate document to record the vote
    candidate.votes.push({ user: userId });
    candidate.voteCount++;
    await candidate.save();
    //update the user document
    user.isVoted = true;
    await user.save();
    res.status(200).json({ message: "vote recorded successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "internal server error" });
  }
});
//vote count
router.get("/vote/count", async (req, res) => {
  // find the all candidate  and sort them by votecount in descending order
  const candidate = await Candidate.find().sort({ voteCount: "desc" });
  //map the candidate to only return their  name and votecount
  const voteRecord = candidate.map((data) => {
    return {
      party: data.party,
      count: data.voteCount,
    };
  });
  return res.status(200).json(voteRecord);
});
module.exports = router;
