const mongoose = require('mongoose');



const fileSchema = new mongoose.Schema({
    channel: {
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Channel',
      required: true,
    },

    title: {
        type: String,
        required: true,
      },
    description: {
        type: String,
        required: true,
      },

      link: {
        type: String,
        required: true,
      },

  }, { timestamps: true });


  const file = mongoose.model('file', fileSchema);

  module.exports = file;




