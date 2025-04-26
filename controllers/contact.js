const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const verifyToken = require('../middleware/verify-token');

// Create contact (POST /contact)
router.post('/', async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const newContact = new Contact({ name, email, message });
    await newContact.save();

    res.status(201).json({ message: 'Message received successfully.' });
  } catch (error) {
    console.error('Error creating contact:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/', verifyToken, async (req, res) => {
  try {
    if (!req.user || !req.user.admin) { 
      return res.status(403).json({ error: 'Access denied' });
    }

    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json(contacts);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    if (!req.user || !req.user.admin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const contactId = req.params.id;
    await Contact.findByIdAndDelete(contactId);

    res.json({ message: 'Message deleted successfully.' });
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({ error: 'Server error' });
  }
});


module.exports = router;
