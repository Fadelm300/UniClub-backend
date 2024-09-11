const express = require('express');
const verifyToken = require('../middleware/verify-token.js');
const Post = require('../models/post.js');
const Channel = require('../models/channel.js');

const router = express.Router();

// ========== Public Routes ===========

// ========= Protected Routes =========
router.use(verifyToken);

// router.get('/*', async (req, res) => {
//   try {
//     // const channelPath = req.params[0];
//     const posts = await Post.find({}).populate('user').sort({ createdAt: 'desc' });
//     res.status(200).json(posts);
//   } catch (error) {
//     res.status(500).json(error);
//   }
// });

router.get('/*/:postId', async (req, res) => {
  try {
    const postId = req.params.postId;

    const channelPath = req.params[0];
    const channel = await Channel.findOne({ path: channelPath }).populate('posts');
    
    const post = channel.posts.find(p => p._id.toString() == postId);

    if (!post) {
      return res.status(400).send("Post not found in channel")
    }
    
    res.status(200).json(post);
  } catch (error) {
    res.status(500).json(error);
  }
});

router.post('/*', async (req, res) => {
  try {
    const channelPath = req.params[0];
    req.body.path = channelPath;
    req.body.user = req.user.id;
    const post = await Post.create(req.body);
    const channel = await Channel.findOne({path: channelPath});
    channel.posts.push(post._id);

    await channel.save();

    post._doc.user = req.user;
    res.status(201).json(post);
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

router.put('/*/:postId', async (req, res) => {
  try {

    const postId = req.params.postId;

    const channelPath = req.params[0];
    const channel = await Channel.findOne({ path: channelPath }).populate(
      "posts"
    );

    if (!channel) {
      throw new Error("Channel not found");
    }

    // const post = channel.posts.id( postId );
    const post = channel.posts.find((p) => p._id.toString() == postId);

    console.log(post);

    if (!post) {
      throw new Error("Post not found");
    }

    post.set(req.body);

    res.status(200).json(post);

    const updatedPost = await Post.findByIdAndUpdate(req.params.postId, req.body, { new: true });


    await channel.save();

  } catch (error) {
    res.status(500).json(error);
  }
});

router.delete('/*/:postId', async (req, res) => {
  try {

    const postId = req.params.postId;

    const channelPath = req.params[0];
    const channel = await Channel.findOne({ path: channelPath }).populate(
      "posts"
    );

    if (!channel) {
      throw new Error("Channel not found");
    }

    const postIndex = channel.posts.findIndex(
      (post) => post._id.toString() === postId
    );


    if (postIndex === -1) {
      throw new Error("Post not found");
    }

    const post = await Post.findByIdAndDelete(req.params.postId);


    res.status(200).json(channel.posts[postIndex]);

    channel.posts.splice(postIndex, 1);


    await channel.save();

  } catch (error) {
    res.status(500).json(error);
  }
});

router.post('/*/:postId/comments', async (req, res) => {
  try {
    req.body.user = req.user.id;
    const post = await Post.findById(req.params.postId);
    post.comments.push(req.body);
    await post.save();

    // Find the newly created comment:
    const newComment = post.comments[post.comments.length - 1];

    newComment._doc.user = req.user;

    // Respond with the newComment:
    res.status(201).json(newComment);
  } catch (error) {
    res.status(500).json(error);
  }
});



module.exports = router;
