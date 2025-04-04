const express = require('express');
const verifyToken = require('../middleware/verify-token.js');
const Post = require('../models/post.js');
const Channel = require('../models/channel.js');
const File = require('../models/file.js');

const router = express.Router();

router.use(verifyToken);

router.post('/*/:postId', async (req, res) => {
  try {
    const channelPath = req.params[0];
    req.body.user = req.user.id;
    const post = await Post.findById(req.params.postId).populate('user');
    if (req.body.link) {
      const file = await File.create({
        link: req.body.link,
        user: req.user.id,
        title: req.body.title,
        description: req.body.description,
        type: req.body.type
      });
      req.body.file = file._id;
    }
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
  