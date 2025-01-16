const express = require('express');

const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const TEMPUSER = require('../models/tempuser');

const verifyToken = require('../middleware/verify-token.js');
const otp = require('../middleware/otp.js');

router.post('/signup', async (req, res) => {
  try {
    // Check if the username is already taken
    const userInDatabase = await User.findOne({ username: req.body.username });
    if (userInDatabase) {
      return res.json({ error: 'Username already taken.' });
    }
    const emailInDatabase = await User.findOne({ email: req.body.email });
    if (emailInDatabase) {
      return res.json({ error: 'email already has an account.' });
    }
    //otp code 
    const randomNumber=Math.floor(100000 + Math.random() * 900000);
    otp(req.body.username,req.body.email,randomNumber);
    const tempUser = await TEMPUSER.create({
      username: req.body.username,
      phone: req.body.phone,
      email: req.body.email,
      image: req.body.image,
      hashedPassword: bcrypt.hashSync(req.body.password, parseInt(process.env.SALT_LENGTH)),
      admin:false,
      otp:randomNumber
    });

    res.status(201).json({ message: 'otp sent' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/verify', async (req, res) => {
  try{
    const name = req.body.username;
    const enteredOtp = req.body.otp;
    const tempUser = await TEMPUSER.findOne({ username: name });
    if(tempUser.otp == enteredOtp){
      // Create a new user with hashed password
      const user = await User.create({
        username: tempUser.username,
        phone: tempUser.phone,
        email: tempUser.email,
        image: tempUser.image,
        hashedPassword: tempUser.hashedPassword,
        admin:false,
      });
      const token = jwt.sign({ username: user.username, id: user._id , admin:user.admin }, process.env.JWT_SECRET);
      res.status(201).json({ user, token });
    }
    else{
      res.status(401).json({error : 'Invalid OTP'});
    }
  }catch(error){
    res.status(400).json({ error: error.message });
  }

});

router.post('/signin', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.body.username });
    if (user && bcrypt.compareSync(req.body.password, user.hashedPassword)) {
      const token = jwt.sign({ username: user.username, id: user._id , admin:user.admin ,image:user.image}, process.env.JWT_SECRET);
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
