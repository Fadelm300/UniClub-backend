const { text } = require('express');
const mongoose = require('mongoose');

const tempuserSchema = new mongoose.Schema({
  username: {
    type: String,
  },
  hashedPassword: {
    type: String,
  },
  phone: {
    type: String,
  },
  email: {
    type: String,
  },
  otp:{
    type: Number,
  },
  admin:{
    type: Boolean
  },
});

module.exports = mongoose.model('tempUSER', tempuserSchema);