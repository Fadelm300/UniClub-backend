const express = require("express");
const User = require('../models/user');
const Channel = require("../models/channel.js");
const router = express.Router();
const verifyToken = require('../middleware/verify-token');
const user = require("../models/user");

router.get('/users',verifyToken, async (req, res) => {
    try {

        const page = 1; // You can change this dynamically based on the request
        const limit = 20;
        const users = await User.find({ _id: { $ne: req.user.id } }).skip((page - 1) * limit).limit(limit);
        
        res.json(users);

    } catch (error) {
      if (res.statusCode === 404) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });

router.put('/toggle/:userid' ,  async (req , res) => {
    const user = await User.findById(req.params.userid);
    if (user.admin){
        user.admin = false;
        await user.save();
    }else{
        user.admin = true;
        await user.save();
    }
    res.json(user);

});






  module.exports = router;
