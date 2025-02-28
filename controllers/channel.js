const express = require("express");
const verifyToken = require("../middleware/verify-token.js");
const Channel = require("../models/channel.js");
const router = express.Router();
const Post = require('../models/post');
router.get("/*", async (req, res) => {
  try {
    const channelPath = req.params[0];
    const channel = await Channel.findOne({ path: channelPath }).populate([
      { path: "subchannels", select: "name" },
      {
        path: "posts",
        model: "Post",
        populate: [
          { path: "user", model: "User" },
          { path: "file", model: "File" }
        ]
      },
      {
        path: "files",
        model: "File",
        populate: {
          path: "user",
          model: "User"
        }
      }
    ]);
    res.status(200).json(channel);
  } catch (error) {
    res.status(500).json(error);
  }
});



router.post("/*", verifyToken, async (req, res) => {
  try {
    const parentPath = req.params[0] || "";
    const regex = /^[a-z0-9]+$/; 

    req.body.name = req.body.name.trim();
    if (regex.test(req.body.name)) {
      const channelPath = parentPath ? `${parentPath}/${req.body.name}` : req.body.name;
      req.body.path = channelPath;
    } else {
      return res.status(400).json({
        error: `${req.body.name} is not a valid channel name. Channels must be lowercase with no spaces, containing only letters and numbers.`,
      });
    }

    req.body.moderator = req.user.id; 

    const parentChannel = parentPath
      ? await Channel.findOne({ path: parentPath })
      : null;

    const existingChannel = await Channel.findOne({ path: req.body.path });

    if (!existingChannel) {
      const newChannel = await Channel.create(req.body);

      if (parentChannel) {
        parentChannel.subchannels.push(newChannel._id);
        await parentChannel.save();
      }

      res.status(201).json(newChannel);
    } else {
      res.status(409).json({
        error: `Channel with path '${req.body.path}' already exists.`,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});








const deleteChannelAndSubchannels = async (channel) => {
  // Delete all subchannels recursively
  for (let subchannel of channel.subchannels) {
    const subchannelDoc = await Channel.findById(subchannel);
    if (subchannelDoc) {
      await deleteChannelAndSubchannels(subchannelDoc);  // Recursive delete for subchannels
    }
  }

  // Delete all posts in the channel
  await Post.deleteMany({ _id: { $in: channel.posts } });

  // Finally, delete the channel itself
  await Channel.findByIdAndDelete(channel._id);
};

// Route to delete a channel and its subchannels/posts
router.delete('/:channelPath', async (req, res) => {
  const { channelPath } = req.params;

  try {
    // Find the root channel and populate related fields
    const channel = await Channel.findOne({ path: channelPath })
      .populate('subchannels posts'); // Ensure subchannels and posts are populated

    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    // Recursively delete the channel and all its subchannels and posts
    await deleteChannelAndSubchannels(channel);

    res.status(200).json({ message: 'Channel and all related subchannels/posts deleted successfully' });
  } catch (error) {
    console.error('Error deleting channel and its subchannels/posts:', error);
    res.status(500).json({ message: 'Failed to delete channel and its subchannels/posts' });
  }
});



module.exports = router;
