const express = require('express');
const verifyToken = require('../middleware/verify-token.js');
const Channel = require('../models/channel.js');
const router = express.Router();


router.get('/*', async (req, res) => {
    try {
      const channelPath = req.params[0]
      const channel = await Channel.findOne({path:channelPath}).populate('subchannels','name');
      res.status(200).json(channel);
    } catch (error) {
      res.status(500).json(error);
    }
  });

  

  router.post("/*",verifyToken, async (req, res) => {
    try {
      const parantPath = req.params[0]
      const channelPath = parantPath + `/${req.body.name}`
      req.body.path = channelPath
      req.body.moderator = req.user.id;

      const parantChannel = await Channel.findOne({name : parantPath});
      const findChannel = await Channel.findOne({path :req.body.path});

      if(!findChannel){
        const channel = await Channel.create(req.body);
        parantChannel.subchannels.push(channel._id);
        await parantChannel.save();
        res.status(200).json(channel);
      }else{
        res.status(200).json(`this channel already exists in ${parantChannel.name}`);
      }
    } catch (error) {
      console.log(error);
      res.status(500).json(error);
    }
  });

  
  
module.exports = router;