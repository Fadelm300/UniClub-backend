const express = require('express');
const CreativeSpace = require('../models/CreativeSpace');
const verifyToken = require('../middleware/verify-token.js');
const router = express.Router();
















// Create a new creative space
router.post('/', verifyToken, async (req, res) => {
  const { title, description,image, link } = req.body;
  const userId = req.user.id; 
  const newCreativeSpace = new CreativeSpace({
    title,
    description,
    image,
    link,
    userId,
  });

  try {
    const savedCreativeSpace = await newCreativeSpace.save();
    res.status(201).json(savedCreativeSpace);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete creative space
router.delete('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    const space = await CreativeSpace.findById(id);
    if (!space) return res.status(404).json({ message: 'Not found' });

    if (space.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await CreativeSpace.findByIdAndDelete(id);
    res.status(200).json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete creative space' });
  }
});


// Get creative spaces by user ID (for public profile)
router.get('/user/:userId',  async (req, res) => {
  const { userId } = req.params;

  try {
    const spaces = await CreativeSpace.find({ userId });
    res.status(200).json(spaces);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch creative spaces' });
  }
});

module.exports = router;
