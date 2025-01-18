const dotenv = require('dotenv');

dotenv.config();
const cors = require('cors');
const express = require('express');
const morgan = require('morgan')
const app = express();
const mongoose = require('mongoose');
const testJWTRouter = require('./controllers/test-jwt');

const usersRouter = require('./controllers/users');
const profilesRouter = require('./controllers/profiles');
const postsRouter = require('./controllers/posts.js');
const channelRouter = require('./controllers/channel.js');
const FileRouter = require ('./controllers/file.js');
const commentRouter = require ('./controllers/comments.js');
const adminRouter = require ('./controllers/admin.js')
const EventRouter = require('./controllers/eventController');
const uploadImage = require("./uploadImage.js");

mongoose.connect(process.env.MONGODB_URI);

mongoose.connection.on('connected', () => {
  console.log(`Connected to MongoDB ${mongoose.connection.name}.`);
});
app.use(morgan('dev'))
app.use(cors());
app.use(express.json());

const Channel = require("./models/channel.js");
// Routes go here
app.use('/test-jwt', testJWTRouter);
app.use('/users', usersRouter);
app.use('/profiles', profilesRouter);
app.use('/posts', postsRouter);
app.use('/channels', channelRouter);
app.use('/files',FileRouter);
app.use('/comments' , commentRouter)
app.use('/admin' , adminRouter)
app.use('/event', EventRouter )


app.get("/base", async (req, res) => {
    try {
      const channels = await Channel.find({
        path: { $not: /\/+/ } // Matches paths that do not contain a '/'
      });// Fetch all channels from the database
      res.status(200).json(channels); // Return the channels in the response
    } catch (error) {
      console.error("Error fetching channels:", error);
    }
  });
  
app.post("/uploadImg", async (req, res) => {
  uploadImage(req.body.image)
  
    .then((url) => {
      console.log(url)
      res.status(200).json({ url });
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
});

const otp = require('./middleware/otp.js');
// otp();


app.listen(process.env.PORT, () => {
  console.log('The express app is ready!');
});
