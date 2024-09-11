const express = require("express");
const verifyToken = require("../middleware/verify-token.js");
const Channel = require("../models/channel.js");
const router = express.Router();

router.get("/*", async (req, res) => {
  try {
    const channelPath = req.params[0];
    const channel = await Channel.findOne({ path: channelPath }).populate([
      { path: "subchannels", select: "name" },
      {
        path: "posts",
        model: "Post",
        populate: {
          path: "user",
          model: "User"
        }
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
    const parantPath = req.params[0];
    const regex = /^[a-z0-9]+$/;
    req.body.name = req.body.name.trim();
    if (regex.test(req.body.name)) {
      const channelPath = parantPath + `/${req.body.name}`;
      // const channelPath = req.body.name;
      req.body.path = channelPath;
    } else {
      return res
        .status(200)
        .json(
          `${req.body.name} is not a valid name channel has to be lower case and no spaces only letters and numbers`
        );
    }

    req.body.moderator = req.user.id;

    const parantChannel = await Channel.findOne({ path: parantPath });
    const findChannel = await Channel.findOne({ path: req.body.path });

    if (!findChannel) {
      const channel = await Channel.create(req.body);
      parantChannel.subchannels.push(channel._id);
      await parantChannel.save();
      res.status(200).json(channel);
    } else {
      res
        .status(200)
        .json(`this channel already exists in ${parantChannel.name}`);
    }
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

router.delete("/*", verifyToken, async (req,res)=>{
  // Example req.params[0]
  const channelPath = req.params[0];
  console.log(channelPath)
  const channel = await Channel.findOneAndDelete({ path: "uob/itcs114" });
  res.status(200).json('ok');
  // console.log(channel)

});

module.exports = router;
