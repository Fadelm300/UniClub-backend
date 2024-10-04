const express = require('express');

const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const verifyToken = require('../middleware/verify-token.js');


router.post('/signup', async (req, res) => {
  try {
    // Check if the username is already taken
    const userInDatabase = await User.findOne({ username: req.body.username });
    if (userInDatabase) {
      return res.json({ error: 'Username already taken.' });
    }
    // Create a new user with hashed password
    const user = await User.create({
      username: req.body.username,
      phone: req.body.phone,
      email: req.body.email,
      hashedPassword: bcrypt.hashSync(req.body.password, parseInt(process.env.SALT_LENGTH)),
      admin:false,
    });
    const token = jwt.sign({ username: user.username, id: user._id , admin:user.admin }, process.env.JWT_SECRET);
    res.status(201).json({ user, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/signin', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.body.username });
    if (user && bcrypt.compareSync(req.body.password, user.hashedPassword)) {
      const token = jwt.sign({ username: user.username, id: user._id , admin:user.admin }, process.env.JWT_SECRET);
      res.status(200).json({ token });
    } else {
      res.status(401).json({ error: 'Invalid username or password.' });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/follow/:followid',verifyToken, async (req, res) => {
  try {
    const followedUser = await User.findById(req.params.followid);
    const UserUser = await User.findById(req.user.id);
    let follow =true;
      // unfollow
      if(followedUser.followers.includes(req.user.id)){
        followedUser.followers.pop(req.user.id);
        UserUser.following.pop(req.params.followid);
        follow = false;
      // follow
      }else{
        followedUser.followers.push(req.user.id);
        UserUser.following.push(req.params.followid);

      }
    followedUser.save();
    UserUser.save();
    res.status(201).send(follow);
  } catch (error) {
        res.status(400).json({ error: error.message });
  }

});



module.exports = router;
