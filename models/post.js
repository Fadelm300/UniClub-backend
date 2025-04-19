const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    file:{
      type: mongoose.Schema.Types.ObjectId, ref: 'File'
    },
  },
  { timestamps: true }
);

const postSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
    },
    link: {
      type: String,
    },
    file:{
      type: mongoose.Schema.Types.ObjectId, ref: 'File'
    },
    category: {
      type: String,
    },
    path: {
      type: String,
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [commentSchema],
    report: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      reason: { type: String, required: true }
    }],
    flag: {
      type: Boolean,
      default: false
    },
  },
  { timestamps: true }
);

const Post = mongoose.model('Post', postSchema);

module.exports = Post;