const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
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
    category: {
      type: String,
    },
    path: {
      type: String,
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [commentSchema]
  },
  { timestamps: true }
);

const Post = mongoose.model('Post', postSchema);

module.exports = Post;