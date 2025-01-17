const express = require('express');

const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const TEMPUSER = require('../models/tempuser');

const verifyToken = require('../middleware/verify-token.js');
const otp = require('../middleware/otp.js');
const { set } = require('mongoose');

router.post('/signup', async (req, res) => {
  try {
    // Check if the username is already taken
    const userInDatabase = await User.findOne({ username: req.body.username });
    
    if (userInDatabase) {
      return res.json({ error: 'Username already taken.' });
    }
    // const emailInDatabase = await User.findOne({ email: req.body.email });
    // if (emailInDatabase) {
    //   return res.json({ error: 'email already has an account.' });
    // }
    //otp code 
    const randomNumber=Math.floor(100000 + Math.random() * 900000);
    otp(req.body.username,req.body.email,randomNumber);
    const tempUserInDatabase= await TEMPUSER.findOne({ username: req.body.username });
    if(!tempUserInDatabase){
    const tempUser = await TEMPUSER.create({
      username: req.body.username,
      phone: req.body.phone,
      email: req.body.email,
      image: req.body.image,
      hashedPassword: bcrypt.hashSync(req.body.password, parseInt(process.env.SALT_LENGTH)),
      admin:false,
      otp:randomNumber
    });
    }else{
      tempUserInDatabase.otp = randomNumber;
      tempUserInDatabase.save()
    }
    setTimeout(async () => {
      try {
        await TEMPUSER.findByIdAndUpdate(tempUser._id, { otp: 0 });
      } catch (error) {
        console.log('deleted already');
      }
    }, 3 * 60 * 1000); // 3 minutes in milliseconds

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
    if(tempUser?.otp){
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
        await TEMPUSER.findByIdAndDelete(tempUser._id);
        res.status(201).json({ user, token });
      }
    }
      res.status(401).json({error : 'Invalid OTP'});
  }catch(error){
    res.status(400).json({ error: error.message });
  }

});

router.post('/resendotp', async (req, res) => {
  try {
    const tempUser = await TEMPUSER.findOne({ username: req.body.username });
    const randomNumber=Math.floor(100000 + Math.random() * 900000);
    tempUser.otp=randomNumber;
    tempUser.save();
    if(tempUser.otp){
      otp(tempUser.username,tempUser.email,tempUser.otp);
      res.status(201).json({ message: 'otp sent' });
    }
    setTimeout(async () => {
      try {
        await TEMPUSER.findByIdAndUpdate(tempUser._id, { otp: 0 });
      } catch (error) {
        console.log('deleted already');
      }
    }, 3 * 60 * 1000);
    setTimeout(async () => {
      try {
        await TEMPUSER.findByIdAndDelete(tempUser._id);
      } catch (error) {
        console.log('deleted already');
      }
    }, 60 * 60 * 1000);
  }catch(error){
    res.status(400).json({ error: error.message });
  }

})

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

router.post('/resetpasswordstep1', async (req, res)=>{
  try{
    const username = req.body.username;
    const email = req.body.email;
    const user = await User.findOne({ email: email });
    const tempUser = await TEMPUSER.findOne({email:email});

    if (user) {
      randomNumber=Math.floor(100000 + Math.random() * 900000);
      if (!tempUser){
        otp(user.username,email,randomNumber);
        const tempUser = await TEMPUSER.create({
          username: user.username,
          email: email,
          otp:randomNumber
        })
      }else{
        otp(user.username,email,randomNumber);
        tempUser.otp=randomNumber;
        tempUser.save();
      }
    
      setTimeout(async () => {
        try {
          await TEMPUSER.findByIdAndUpdate(tempUser._id, { otp: 0 });
        } catch (error) {
          console.log('deleted already');
        }
      }, 3 * 60 * 1000);

      setTimeout(async () => {
        try {
          await TEMPUSER.findByIdAndDelete(tempUser._id);
        } catch (error) {
          console.log('deleted already');
        }
      }, 60 * 60 * 1000);
      res.status(201).json({ message: 'otp sent' });

    }else{
    res.status(401).json({error : 'Invalid email'});
    }

  }catch(error){
    res.status(400).json({ error: error.message });
  }
});

router.post('/resetpasswordstep2', async (req, res)=>{
  try{
    const email = req.body.email;
    const enteredOtp = req.body.otp;
    const tempUser = await TEMPUSER.findOne({ email:email});
    if(tempUser?.otp){
      if(tempUser.otp == enteredOtp){

        res.status(201).json({ message: 'otp verified' });
      }else{
        res.status(401).json({error : 'Invalid OTP'});
      }
    }else{
    res.status(401).json({error : 'Invalid OTP'});
    }
    
  }catch(error){
    res.status(400).json({ error: error.message });
  }
});

router.post('/resetpasswordstep3', async (req, res)=>{
  try{
    const email = req.body.email;
    const password = req.body.password;
    const user = await User.findOne({ email: email });
    if(user){
      user.hashedPassword = bcrypt.hashSync(password, parseInt(process.env.SALT_LENGTH));
      user.save();
      res.status(201).json({ message: 'password changed' });
    }else{
      res.status(401).json({error : 'Invalid email'});
    }

    
  }catch(error){
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
