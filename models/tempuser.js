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
  reset:{
    type: Boolean
  },
  otpAttempts: {
    type: Number,
    default: 4, 
  },
  otpCooldown: {
    type: Date, 
    default: null,
  },
});

module.exports = mongoose.model('tempUSER', tempuserSchema);