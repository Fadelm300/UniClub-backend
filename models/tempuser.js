const { text } = require('express');
const mongoose = require('mongoose');

const tempuserSchema = new mongoose.Schema({
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
  otp:{
    type: Number,
    required: true
  },
  admin:{
    type: Boolean
  },
});

module.exports = mongoose.model('tempUSER', tempuserSchema);