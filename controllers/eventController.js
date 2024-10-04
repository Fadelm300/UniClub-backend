const express = require('express');
const Event = require('../models/Event');
const verifyToken = require('../middleware/verify-token.js'); // assuming this middleware is for authentication/authorization
const router = express.Router();

// Get all events
router.get('/', async (req, res) => {
    try {
        const events = await Event.find();
        res.status(200).json(events);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/:eventid', async (req, res) => {
    try {
        const event = await Event.findById(req.params.eventid);
        res.status(200).json(event);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add a new event (protected route)
router.post('/', verifyToken, async (req, res) => {
    const { title, description, date, time, location, image } = req.body;
    const newEvent = new Event({ title, description, date, time, location, image });

    try {
        const savedEvent = await newEvent.save();
        res.status(201).json(savedEvent);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Edit an event (protected route)
router.put('/:id', verifyToken, async (req, res) => {
    const { id } = req.params;

    try {
        const updatedEvent = await Event.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedEvent) {
            return res.status(404).json({ message: 'Event not found' });
        }
        res.status(200).json(updatedEvent);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete an event (protected route)
router.delete('/:id', verifyToken, async (req, res) => {
    const { id } = req.params;

    try {
        const deletedEvent = await Event.findByIdAndDelete(id);
        if (!deletedEvent) {
            return res.status(404).json({ message: 'Event not found' });
        }
        res.status(204).send();
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;
