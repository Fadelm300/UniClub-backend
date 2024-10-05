const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Post = require('../models/post');
const verifyToken = require('../middleware/verify-token');
// const jwt = require('jsonwebtoken');
router.get('/:userId', verifyToken, async (req, res) => {
  try {
   
    if (req.user.id !== req.params.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404);
      throw new Error('Profile not found.');
    }

   
    const posts = await Post.find({ user: req.user.id });

    res.json({ user, posts });
  } catch (error) {
    if (res.statusCode === 404) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});


router.put('/:userId', verifyToken, async (req, res) => {
  try {
    if (req.user.id !== req.params.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const updatedUser = await User.findByIdAndUpdate(req.user.id, {
      username: req.body.username,
      phone: req.body.phone,
      email: req.body.email,
      image: req.body.image,
    }, { new: true });

    if (!updatedUser) {
      res.status(404);
      throw new Error('Profile not found.');
    }
    // const token = jwt.sign({ username: user.username, id: user._id , admin:user.admin ,image:user.image}, process.env.JWT_SECRET);
    // res.status(200).json({ token });
    res.json({ user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.delete('/:userId', verifyToken, async (req, res) => {
  try {
    if (req.user.id !== req.params.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    await User.findByIdAndDelete(req.user.id);

    res.json({ message: 'User deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/other/:userId', verifyToken, async (req, res) => {
  try {
   
    

    const user = await User.findById(req.params.userId);
    if (!user) {
      res.status(404);
      throw new Error('Profile not found.');
    }

   
    const posts = await Post.find({ user: req.params.userId });

    res.json({ user, posts });
  } catch (error) {
    if (res.statusCode === 404) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});


module.exports = router;
