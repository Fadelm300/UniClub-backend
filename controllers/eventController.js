const express = require('express');
const Event = require('../models/Event');
const verifyToken = require('../middleware/verify-token.js'); 
const router = express.Router();

router.get('/get/*', async (req, res) => {
    try {
        const path = req.params[0] || '';
        console.log(path);
        
        const futureEvents = await Event.find({date : { $gte: new Date() }, path: path})
            .sort({ date: 1 });

        const pastEvents = await Event.find({date : { $lt: new Date() }, path: path})
            .sort({ date: -1 });
        
        res.status(200).json([futureEvents , pastEvents]);
    } catch (error) {
        console.log(error.message);
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


router.post('/add/*', verifyToken, async (req, res) => {
    const path = req.params[0];
    console.log(path);
    const { title, description, date, time, location, image } = req.body;
    const newEvent = new Event({ title, description, date, time, location, image, path});
    try {
        const savedEvent = await newEvent.save();
        res.status(201).json(savedEvent);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});


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

// Delete event 
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
