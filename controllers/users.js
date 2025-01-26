const express = require('express');

const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const TEMPUSER = require('../models/tempuser');
const Channel = require("../models/channel.js");
const verifyToken = require('../middleware/verify-token.js');
const otp = require('../middleware/otp.js');
const { set } = require('mongoose');

// router.post('/signup', async (req, res) => {
//   try {
//     // Check if the username is already taken
//     const userInDatabase = await User.findOne({ username: req.body.username });
//     if (userInDatabase) {
//       return res.json({ error: 'Username already taken.' });
//     }
//     // const emailInDatabase = await User.findOne({ email: req.body.email });
//     // if (emailInDatabase) {
//     //   return res.json({ error: 'email already has an account.' });
//     // }
//     //otp code 
//     const randomNumber=Math.floor(100000 + Math.random() * 900000);
//     otp(req.body.username,req.body.email,randomNumber);
    
//     const tempUserInDatabase= await TEMPUSER.findOne({ username: req.body.username });
//     if(!tempUserInDatabase){
//     const tempUser = await TEMPUSER.create({
//       username: req.body.username,
//       phone: req.body.phone,
//       email: req.body.email,
//       image: req.body.image,
//       hashedPassword: bcrypt.hashSync(req.body.password, parseInt(process.env.SALT_LENGTH)),
//       admin:false,
//       otp:randomNumber
//     });
//     }else{
//       tempUserInDatabase.otp = randomNumber;
//       tempUserInDatabase.save()
//     }
//     setTimeout(async () => {
//       try {
//         await TEMPUSER.findByIdAndUpdate(tempUser._id, { otp: 0 });
//       } catch (error) {
//         console.log('deleted already');
//       }
//     }, 3 * 60 * 1000); // 3 minutes in milliseconds

//     res.status(201).json({ message: 'otp sent' });
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// });


// router.post('/verify', async (req, res) => {
//   try{
//     const email = req.body.email;
//     const enteredOtp = req.body.otp;
//     const tempUser = await TEMPUSER.findOne({ email: email });
//     console.log(email);
//     console.log(otp);

//     if(tempUser?.otp){
//       if(tempUser.otp == enteredOtp){
//         // Create a new user with hashed password
//         const user = await User.create({
//           username: tempUser.username,
//           phone: tempUser.phone,
//           email: tempUser.email,
//           image: tempUser.image,
//           hashedPassword: tempUser.hashedPassword,
//           admin:false,
//         });
//         const token = jwt.sign({ username: user.username, id: user._id , admin:user.admin }, process.env.JWT_SECRET);
//         await TEMPUSER.findByIdAndDelete(tempUser._id);
//         res.status(201).json({ user, token });
//       }
//     }else{
//       res.status(401).json({error : 'Invalid OTP'});
//     }
//   }catch(error){
//     res.status(400).json({ error: error.message });
//   }

// });


router.post('/signup', async (req, res) => {
  try {
    // Check if the username is already taken
    const userInDatabase = await User.findOne({ username: req.body.username });
    if (userInDatabase) {
      return res.status(400).json({ error: 'Username already taken.' });
    }
    // const emailInDatabase = await User.findOne({ email: req.body.email });
    // if (emailInDatabase) {
    //   return res.status(400).json({ error: 'Email already associated with an account.' });
    // }
    
    // Generate OTP
    const randomNumber = Math.floor(100000 + Math.random() * 900000);
    let tempUser = await TEMPUSER.findOne({ username: req.body.username });
    
    if (tempUser?.otpCooldown && new Date() < tempUser?.otpCooldown) {
      const waitTime = Math.ceil((tempUser.otpCooldown - new Date()) / 60000);
      return res.status(429).json({
        error: `You have reached the maximum attempts. Please wait ${waitTime} minutes before trying again.`,
      });
    }else{
    // Send OTP using the `otp` middleware
    otp(req.body.username, req.body.email, randomNumber);

    // Check if temp user exists in the database
    if (!tempUser) {
      tempUser = new TEMPUSER({
        username: req.body.username,
        phone: req.body.phone,
        email: req.body.email,
        image: req.body.image,
        hashedPassword: bcrypt.hashSync(req.body.password, parseInt(process.env.SALT_LENGTH || '10')),
        admin: false,
        otp: randomNumber,
      });
    } else {
      // Update the existing temp user's OTP
      tempUser.otp = randomNumber;
      tempUser.otpAttempts = tempUser.otpAttempts-1
    }
   

    // Save the temporary user
    await tempUser.save();

    // Expire OTP after 3 minutes
    setTimeout(async () => {
      try {
        await TEMPUSER.findByIdAndUpdate(tempUser._id, { otp: 0 });
      } catch (error) {
        console.log('OTP expiration: User not found or already deleted.');
      }
    }, 4 * 60 * 1000);

    res.status(201).json({ message: 'OTP sent successfully.' });
  }
 }catch (error) {
    console.error('Signup error:', error.message);
    res.status(500).json({ error: error.message });
  }
});




router.post('/verify', async (req, res) => {
  try {
    const { email, otp: enteredOtp } = req.body;

    if (!email || !enteredOtp) {
      return res.status(400).json({ error: 'Email and OTP are required.' });
    }

    // Find the temporary user by email
    const tempUser = await TEMPUSER.findOne({ email });
    if (!tempUser) {
      return res.status(404).json({ error: 'Temporary user not found.' });
    }

    // Validate OTP
    if (tempUser.otp && tempUser.otp.toString() === enteredOtp.toString()) {
      // Create a new user with hashed password
      const user = await User.create({
        username: tempUser.username,
        phone: tempUser.phone,
        email: tempUser.email,
        image: tempUser.image,
        hashedPassword: tempUser.hashedPassword,
        admin: false,
      });

      // Generate JWT token
      const token = jwt.sign(
        { username: user.username, id: user._id, admin: user.admin },
        process.env.JWT_SECRET,
      );

      // Delete the temp user
      await TEMPUSER.findByIdAndDelete(tempUser._id);

      return res.status(201).json({ user, token });
    }

    res.status(401).json({ error: 'Invalid OTP.' });
  } catch (error) {
    console.error('Verification error:', error.message);
    res.status(500).json({ error: error.message });
  }
});



// router.post('/resendotp', async (req, res) => {
//   try {
//     const { email } = req.body;

//     if (!email) {
//       return res.status(400).json({ error: 'Email is required.' });
//     }

//     const tempUser = await TEMPUSER.findOne({ email });
//     if (!tempUser) {
//       return res.status(404).json({ error: 'Temporary user not found.' });
//     }

//     // Generate a new OTP and save it
//     const randomNumber = Math.floor(100000 + Math.random() * 900000);
//     tempUser.otp = randomNumber;
//     await tempUser.save();

//     // Send the OTP
//     otp(tempUser.username, tempUser.email, tempUser.otp);

//     res.status(200).json({ message: 'OTP sent successfully.' });

//     // Expire OTP after 3 minutes
//     setTimeout(async () => {
//       try {
//         await TEMPUSER.findByIdAndUpdate(tempUser._id, { otp: 0 });
//       } catch (error) {
//         console.error('Error expiring OTP:', error.message);
//       }
//     }, 3 * 60 * 1000);

//     // Delete the temporary user after 1 hour
//     setTimeout(async () => {
//       try {
//         await TEMPUSER.findByIdAndDelete(tempUser._id);
//       } catch (error) {
//         console.error('Error deleting temporary user:', error.message);
//       }
//     }, 60 * 60 * 1000);

//   } catch (error) {
//     console.error('Resend OTP error:', error.message);
//     res.status(500).json({ error: error.message });
//   }
// });


router.post('/resendotp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const tempUser = await TEMPUSER.findOne({ email });
    if (!tempUser) {
      return res.status(404).json({ error: 'period is finished signup again.' });
    }

    // Check cooldown
    if (tempUser.otpCooldown && new Date() < tempUser.otpCooldown) {
      const waitTime = Math.ceil((tempUser.otpCooldown - new Date()) / 60000);
      return res.status(429).json({
        error: `You have reached the maximum attempts. Please wait ${waitTime} minutes before trying again.`,
      });
    }

    // Check remaining attempts
    if (tempUser.otpAttempts <= 0) {
      // Set cooldown period for 1 hour
      tempUser.otpCooldown = new Date(Date.now() + 60 * 60 * 1000);
      tempUser.otpAttempts = 4; 
      await tempUser.save();
      return res.status(429).json({
        error: 'You have reached the maximum OTP resend attempts. Please wait 1 hour before trying again.',
      });
    }

    // Generate a new OTP and save it
    const randomNumber = Math.floor(100000 + Math.random() * 900000);
    tempUser.otp = randomNumber;
    tempUser.otpAttempts -= 1; // Decrement attempts
    await tempUser.save();

    // Send the OTP
    otp(tempUser.username, tempUser.email, tempUser.otp);

    res.status(200).json({
      message: tempUser.otpAttempts>1
      ?
      `OTP sent successfully. You have ${tempUser.otpAttempts} attempts remaining.`
      :
      `OTP sent successfully. You have ${tempUser.otpAttempts} attempt remaining.`,
    });

    // Expire OTP after 3 minutes
    setTimeout(async () => {
      try {
        await TEMPUSER.findByIdAndUpdate(tempUser._id, { otp: 0 });
      } catch (error) {
        console.error('Error expiring OTP:', error.message);
      }
    }, 3 * 60 * 1000);
  } catch (error) {
    console.error('Resend OTP error:', error.message);
    res.status(500).json({ error: error.message });
  }
});



// ======================================================================================================================================
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
    const user = await User.findOne({ $or: [{ username: username }, { email: email }]});
    const tempUser = await TEMPUSER.findOne({ $or: [{ username: username }, { email: email }] });

    if (user) {
      randomNumber=Math.floor(100000 + Math.random() * 900000);
      if (!tempUser){
        otp(user.username,email,randomNumber);
        const tempUser = await TEMPUSER.create({
          username: user.username,
          email: user.email,
          otp:randomNumber
        })
      }else{
        otp(user.username,user.email,randomNumber);
        tempUser.otp=randomNumber;
        tempUser.save();
      }
    
      setTimeout(async () => {
        try {
          await TEMPUSER.findByIdAndUpdate(tempUser._id, { otp: 0 });
        } catch (error) {
          console.log('deleted already');
        }
      }, 5 * 60 * 1000);

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
        tempUser.reset = true;
        tempUser.save();
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
    const tempUser = await TEMPUSER .findOne({email :email});
    if(user && tempUser?.reset){
      user.hashedPassword = bcrypt.hashSync(password, parseInt(process.env.SALT_LENGTH));
      user.save();
      await TEMPUSER.findByIdAndDelete(tempUser._id);
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


router.get('/:userId/followers', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate('followers', 'username image');
    if (!user) return res.status(404).send('User not found');
    res.status(200).json(user.followers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:userId/following', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate('following', 'username image');
    if (!user) return res.status(404).send('User not found');
    res.status(200).json(user.following);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});




router.put('/togglechannel/:userId/:channelId', async (req, res) => {
  try {
    const { userId, channelId } = req.params;
    const user = await User.findById(userId);
    const channel = await Channel.findById(channelId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    // Toggle membership logic...
    if (user.joinedChannels.includes(channelId)) {
      user.joinedChannels.pop(channelId);
      await user.save();
    } else {
      user.joinedChannels.push(channelId);
      await user.save();
    }

    if (channel.members.includes(userId)) {
channel.members.pop(userId);
await channel.save();
    } else {
      channel.members.push(userId);
      await channel.save();
    }

    // Return a JSON response
    return res.status(200).json({ message: 'User successfully toggled the channel membership' });

  } catch (error) {
    console.error('Error toggling membership:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


module.exports = router;
