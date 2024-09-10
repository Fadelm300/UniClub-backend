const express = require('express');
const verifyToken = require('../middleware/verify-token.js');
const router = express.Router();
const File = require('../models/file.js');
const Channel = require('../models/channel.js');


// ========= Routes =========
router.use(verifyToken);


// find the file by id 
router.get('/*/:fileId', async (req, res) => {
  try {
    const fileId = req.params.fileId;

    const channelPath = req.params[0];
    const channel = await Channel.findOne({ path: channelPath }).populate('files');
    
    const file = channel.files.find(p => p._id.toString() == fileId);

    if (!file) {
      return res.status(400).send("file not found in channel")
    }
    
    res.status(200).json(file);
  } catch (error) {
    res.status(500).json(error);
  }
});

//add to the file 
router.post('/*', async (req, res) => {
  try {
    const channelPath = req.params[0];

    req.body.user = req.user.id;
    const file = await File.create(req.body);
    const channel = await Channel.findOne({path: channelPath});
    channel.files.push(file._id);

    await channel.save();

    file._doc.user = req.user;
    res.status(201).json(file);
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});



//update 
router.put('/*/:fileId', async (req, res) => {
  try {

    const fileId = req.params.fileId;

    const channelPath = req.params[0];
    const channel = await Channel.findOne({ path: channelPath }).populate(
      "files"
    );

    if (!channel) {
      throw new Error("Channel not found");
    }

    const file = channel.files.find((p) => p._id.toString() == fileId);


    if (!file) {
      throw new Error("file not found");
    }

    file.set(req.body);

    res.status(200).json(file);

    const updatedFile = await File.findByIdAndUpdate(req.params.fileId, req.body, { new: true });


    await channel.save();

  } catch (error) {
    res.status(500).json(error);
  }
});



// delet the file 

router.delete('/*/:fileId', async (req, res) => {
  try {

    const fileId = req.params.fileId;

    const channelPath = req.params[0];
    const channel = await Channel.findOne({ path: channelPath }).populate(
      "files"
    );

    if (!channel) {
      throw new Error("Channel not found");
    }

    const fileIndex = channel.files.findIndex(
      (file) => file._id.toString() === fileId
    );


    if (fileIndex === -1) {
      throw new Error("File not found");
    }

    const file = await File.findByIdAndDelete(req.params.fileId);


    res.status(200).json(channel.files[fileIndex]);

    channel.files.splice(fileIndex, 1);


    await channel.save();

  } catch (error) {
    res.status(500).json(error);
  }
});






  module.exports = router;
