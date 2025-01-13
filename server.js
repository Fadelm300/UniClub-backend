const dotenv = require('dotenv');
dotenv.config();

const cors = require('cors');
const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const uploadFile = require('./uploadImage');

const testJWTRouter = require('./controllers/test-jwt');
const usersRouter = require('./controllers/users');
const profilesRouter = require('./controllers/profiles');
const postsRouter = require('./controllers/posts');
const channelRouter = require('./controllers/channel');
const FileRouter = require('./controllers/file');
const commentRouter = require('./controllers/comments');
const adminRouter = require('./controllers/admin');
const EventRouter = require('./controllers/eventController');

const app = express();
mongoose.connect(process.env.MONGODB_URI);

mongoose.connection.on('connected', () => {
  console.log(`Connected to MongoDB ${mongoose.connection.name}.`);
});

app.use(morgan('dev'));
app.use(cors());
app.use(express.json());

// Routes
app.use('/test-jwt', testJWTRouter);
app.use('/users', usersRouter);
app.use('/profiles', profilesRouter);
app.use('/posts', postsRouter);
app.use('/channels', channelRouter);
app.use('/files', FileRouter);
app.use('/comments', commentRouter);
app.use('/admin', adminRouter);
app.use('/event', EventRouter);

// Endpoint for uploading files
app.post("/uploadFile", async (req, res) => {
  try {
    const { file } = req.body;
    if (!file) {
      return res.status(400).json({ error: "No file provided." });
    }

    const url = await uploadFile(file);
    res.status(200).json({ url });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ error: "File upload failed." });
  }
});

app.listen(process.env.PORT, () => {
  console.log('The express app is ready!');
});
