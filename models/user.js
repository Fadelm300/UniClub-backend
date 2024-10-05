const { text } = require('express');
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  hashedPassword: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
  },
  admin:{
    type: Boolean
  },
  image: {
        type: String,
      },
  following:
    [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}]
  ,
  followers:
    [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}]
  
});

userSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    delete returnedObject.hashedPassword;
  }
});

module.exports = mongoose.model('User', userSchema);