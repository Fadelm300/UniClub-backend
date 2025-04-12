const mongoose = require('mongoose');

const channelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    titel: {
      type: String,
      required: true,
    },
    path:{
      type: String,
      required: true,
      unique:true,
    },
    description: {
      type: String,
      required: true,
    },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    posts:[{type: mongoose.Schema.Types.ObjectId, ref: 'Post'}],
    moderator: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    moderators: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
    subchannels: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Channel' }],
    files:[{type: mongoose.Schema.Types.ObjectId, ref: 'File'}],
    picture: {
      type: String,
    },
  },
);

const Channel = mongoose.model('Channel', channelSchema);

module.exports = Channel;