const express = require('express');
const Ads = require('../models/Ads');
const verifyToken = require('../middleware/verify-token.js');
const router = express.Router();

// Get all ads
router.get('/', async (req, res) => {
    try {
        const ads = await Ads.find();
        res.status(200).json(ads);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get ad by ID
router.get('/:adId', async (req, res) => {
    try {
        const ad = await Ads.findById(req.params.adId);
        if (!ad) {
            return res.status(404).json({ message: 'Ad not found' });
        }
        res.status(200).json(ad);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create a new ad
router.post('/', verifyToken, async (req, res) => {
    const { title, description, image } = req.body;

    if (!title || !description || !image) {
        return res.status(400).json({ message: 'Title, description, and image are required' });
    }

    const newAd = new Ads({ title, description, image });

    try {
        const savedAd = await newAd.save();
        res.status(201).json(savedAd);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update an ad by ID
router.put('/:id', verifyToken, async (req, res) => {
    const { id } = req.params;

    try {
        const updatedAd = await Ads.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedAd) {
            return res.status(404).json({ message: 'Ad not found' });
        }
        res.status(200).json(updatedAd);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete an ad by ID
router.delete('/:id', verifyToken, async (req, res) => {
    const { id } = req.params;

    try {
        const deletedAd = await Ads.findByIdAndDelete(id);
        if (!deletedAd) {
            return res.status(404).json({ message: 'Ad not found' });
        }
        res.status(204).send();
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;
