const mongoose = require('mongoose');

const creativeSpaceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  image: {
    type: String,
    require:true,

    trim: true,
  },
  link: {
    type: String,
    trim: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', 
    required: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('CreativeSpace', creativeSpaceSchema);
