const express = require('express');
const verifyToken = require('../middleware/verify-token.js');
const Post = require('../models/post.js');
const Channel = require('../models/channel.js');
const User = require('../models/user.js');
const multer = require("multer");
const router = express.Router();
const { uploadFile, deleteFile, getFileUrl } = require("../upload.js");
const upload = multer({ storage: multer.memoryStorage() });

// ========== Public Routes ===========

router.get('/*/:postId', async (req, res) => {
  try {
    const postId = req.params.postId;
    const channelPath = req.params[0];

    const post = await Post.findById(postId).populate([
      { path: "user", model: "User" },
      { path: "comments.user", model: "User" }
    ]);
    
    if (!post) {
      return res.status(404).send("Post not found in channel");
    }
    
    res.status(200).json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json(error);
  }
});

// ========== Protected Routes ==========

router.use(verifyToken);

// Create a new post
router.post('/*/upload' , async(req, res) => {
      const result = await uploadFile();
      res.status(201).json(result);
      console.log(result);
    
});

router.post('/*' ,async(req, res) => {
  try {
    const channelPath = req.params[0];
    req.body.path = channelPath;
    req.body.user = req.user.id;
    const post = await Post.create(req.body);
    const channel = await Channel.findOne({ path: channelPath });
    channel.posts.push(post._id);
    
    await channel.save();
    
    post._doc.user = req.user; // Attach user data to the post
    res.status(201).json(post);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json(error);
  }
});

// Update a post
router.put('/:postId', async (req, res) => {
  try {
    const postId = req.params.postId;
    const channelPath = req.params[0];

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).send("Post not found");
    }

    // Check if the user trying to edit the post is the owner
    if (post.user.toString() !== req.user.id) {
      return res.status(403).send("You are not authorized to edit this post");
    }

    // Update the post
    Object.assign(post, req.body); // Use Object.assign to update fields
    await post.save();

    res.status(200).json(post);
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json(error);
  }
});

// Delete a post
router.delete('/*/:postId', async (req, res) => {
  try {
    const postId = req.params.postId;
    const channelPath = req.params[0];
    const channel = await Channel.findOne({ path: channelPath }).populate("posts");

    if (!channel) {
      throw new Error("Channel not found");
    }

    const postIndex = channel.posts.findIndex(post => post._id.toString() === postId);
    if (postIndex === -1) {
      throw new Error("Post not found");
    }

    const post = await Post.findByIdAndDelete(postId);
    if (!post) {
      throw new Error("Post deletion failed");
    }

    channel.posts.splice(postIndex, 1);
    await channel.save();

    res.status(200).json(post);
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json(error);
  }
});

// Add a comment to a post
router.post('comments/*/:postId', async (req, res) => {
  try {
    const channelPath = req.params[0];
    req.body.user = req.user.id;
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).send("Post not found");
    }

    post.comments.push(req.body);
    await post.save();

    const newComment = post.comments[post.comments.length - 1];
    newComment._doc.user = req.user;

    res.status(201).json(newComment);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json(error);
  }
});

router.put('/like/:postId', async (req, res) => {
  try {
    const postId = req.params.postId;

    const post = await Post.findById(postId);
    const user = await User.findById(req.user.id);


    if (!post) {
      return res.status(404).send("Post not found");
    }
    if(post.likes.includes(req.user.id)){
      post.likes.pop(req.user.id);
      user.likedPosts.pop(req.params.postId);
      follow = false;
    // follow
    }else{
      post.likes.push(req.user.id);
      user.likedPosts.push(req.params.postId);

    }
    
    await post.save();

    res.status(200).send(post.likes.includes(req.user.id));
    // res.status(200).json(`${post},${user}`);
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json(error);
  }
});

router.put('/like/:postId/:commentId', async (req, res) => {
  try {
    const postId = req.params.postId;
    const commentId = req.params.commentId;

    const post = await Post.findById(postId);
    const user = await User.findById(req.user.id);


    if (!post) {
      return res.status(404).send("Post not found");
    }
    const comment = post.comments.find(comm => comm._id == commentId)
    console.log(comment)
    if(comment.likes.includes(req.user.id)){
      comment.likes.pop(req.user.id);
      user.likedComments.pop(req.params.postId);
      follow = false;
    // follow
    }else{
      comment.likes.push(req.user.id);
      user.likedPosts.push(req.params.postId);

    }
    await post.save();

    res.status(200).send(post.likes.includes(req.user.id));
    // res.status(200).json(`${post},${user}`);
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json(error);
  }
}


);

module.exports = router;
