const mongoose = require('mongoose');



const fileSchema = new mongoose.Schema({
 

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
      },
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  }, { timestamps: true });


  const File = mongoose.model('File', fileSchema);

  module.exports = File;




