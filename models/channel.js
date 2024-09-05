const mongoose = require('mongoose');


const channelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    posts: {
      type: String,
      required: true,
    },
    moderator: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    father: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel' },
  },
);

const Channel = mongoose.model('Hoot', channelSchema);

module.exports = Channel;