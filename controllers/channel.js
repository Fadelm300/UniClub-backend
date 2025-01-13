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


// router.post("/*", verifyToken, async (req, res) => {
//   try {
//     const parantPath = req.params[0] || "";
//     const regex = /^[a-z0-9]+$/;
//     req.body.name = req.body.name.trim();
//     if (regex.test(req.body.name)) {
//       const channelPath = parantPath + `/${req.body.name}`;
//       // const channelPath = req.body.name;
//       req.body.path = channelPath;
//     } else {
//       return res
//         .status(200)
//         .json(
//           `${req.body.name} is not a valid name channel has to be lower case and no spaces only letters and numbers`
//         );
//     }

//     req.body.moderator = req.user.id;

//     const parantChannel = await Channel.findOne({ path: parantPath });
//     const findChannel = await Channel.findOne({ path: req.body.path });

//     if (!findChannel) {
//       const channel = await Channel.create(req.body);
//       parantChannel.subchannels.push(channel._id);
//       await parantChannel.save();
//       res.status(200).json(channel);
//     } else {
//       res
//         .status(200)
//         .json(`this channel already exists in ${parantChannel.name}`);
//     }
//   } catch (error) {
//     console.log(error);
//     res.status(500).json(error);
//   }
// });
router.post("/*", verifyToken, async (req, res) => {
  try {
    const parentPath = req.params[0] || ""; // Allow for root-level creation if no parent path
    const regex = /^[a-z0-9]+$/; // Validate channel name

    req.body.name = req.body.name.trim();
    if (regex.test(req.body.name)) {
      const channelPath = parentPath ? `${parentPath}/${req.body.name}` : req.body.name;
      req.body.path = channelPath;
    } else {
      return res.status(400).json({
        error: `${req.body.name} is not a valid channel name. Channels must be lowercase with no spaces, containing only letters and numbers.`,
      });
    }

    req.body.moderator = req.user.id; // Assign the moderator to the current user

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


router.delete("/*", verifyToken, async (req, res) => {
  try {
    const channelPath = req.params[0];
    const channel = await Channel.findOne({ path: channelPath });

    if (!channel) {
      return res.status(404).json({ error: "Channel not found." });
    }

    if (req.user.id !== channel.moderator.toString()) {
      return res.status(403).json({ error: "You are not authorized to delete this channel." });
    }

    await channel.remove(); // Remove the channel
    res.status(200).json({ message: "Channel deleted successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});





// router.delete("/*", verifyToken, async (req,res)=>{
//     const channel = await Channel.findOne({ path: channelPath });
//     if(req.user._id == channel.moderator){

//     }
// });

module.exports = router;
