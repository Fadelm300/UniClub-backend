const mongoose = require('mongoose');



const fileSchema = new mongoose.Schema({
 
  title: {
    type: String,
      
  },
  description: {
    type: String,
      
  },

  type: {
    type: String,
  },  
  
  post: { 
    type: mongoose.Schema.Types.ObjectId, ref: 'Post' 
  },
  link: {
    type: String,
  },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  }, { timestamps: true });


  const File = mongoose.model('File', fileSchema);

  module.exports = File;




