const express = require('express');
const verifyToken = require('../middleware/verify-token.js');
const Post = require('../models/post.js');
const Channel = require('../models/channel.js');
const User = require('../models/user.js');
const File = require('../models/file.js');
const multer = require("multer");
const router = express.Router();
const { uploadFile, deleteFile, getFileUrl } = require("../upload.js");
const upload = multer({ storage: multer.memoryStorage() });

// ========== Public Routes ===========
const viewCounter = new Map(); // postId => count

router.get('/getpost/*/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    
    const post = await Post.findById(postId).populate([
      { path: "user", model: "User" },
      { path: "comments.user", model: "User" },
      { path: "file", model: "File" },
      { path: "comments.file", model: "File" }
    ]);

    if (!post) {
      return res.status(404).json({ message: "Post not found in channel" });
    }

    const currentCount = viewCounter.get(postId) || 0;
    const newCount = currentCount + 1;

    if (newCount >= 2) {
      post.views = (post.views || 0) + 1;
       post.save();
      viewCounter.set(postId, 0);  
    } else {
      viewCounter.set(postId, newCount);
    }

    res.status(200).json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ error: error.message });
  }
});



router.get('/posts/:channelId', async (req, res) => {
  try {
    const channelId = req.params.channelId;
    const {sortby, query, course} = req.query;
    

    const channel = await Channel.findById(channelId).lean();
    let posts = await Post.find({ _id: { $in: channel.posts } })
      .populate('user')
      .populate('file')
      .lean();
      if (course !== 'all') {
        const [academicYear, semester] = course.split('_'); // "2024/2025", "First"
        const [startYear, endYear] = academicYear.split('/').map(Number); // [2024, 2025]
      
        posts = posts.filter(post => {
          const createdDate = new Date(post.createdAt);
          const month = createdDate.getUTCMonth() + 1; // getUTCMonth() is 0-based (0 = January)
          const year = createdDate.getUTCFullYear();   // full year like 2025
      
          let inSemester = false;
      
          switch (semester) {
            case 'First':
              if (
                (month >= 9 && year === startYear) ||    // Sep-Dec of first year
                (month <= 2 && year === endYear)          // Jan-Feb of second year
              ) {
                inSemester = true;
              }
              break;
      
            case 'Second':
              if (
                (month >= 2 && month <= 6 && year === endYear) // Feb-June of second year
              ) {
                inSemester = true;
              }
              break;
      
            case 'Summer':
              if (
                (month >= 6 && month <= 9 && year === endYear) // June-Sep of second year
              ) {
                inSemester = true;
              }
              break;
      
            default:
              break;
          }
      
          return inSemester;
        });
      }
      if (sortby === 'n' || sortby === 'm') {
        posts = posts.reverse();
      }if (sortby === 'm') {
        posts.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
      }if(query !=''){
        posts = posts.filter(post => post.text.toLowerCase().includes(query.toLowerCase()));
      }
      res.status(200).json(posts);
    

  }catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
});


// ========== Protected Routes ==========

router.use(verifyToken);



router.post("/report/:postId", async (req, res) => {
  try {
    const { postId } = req.params;
    let { reason } = req.body;
    const userId = req.user.id;

    console.log("Received reason:", reason, "Type:", typeof reason); // Debugging 

    if (!reason) {
      return res.status(400).json({ message: "Report reason is required" });
    }

    if (typeof reason !== "string") {
      reason = JSON.stringify(reason);
    }

    console.log(`User ID: ${userId}, Post ID: ${postId}, Reason: ${reason}`);

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (!post.report) {
      post.report = []; 
    }

    const alreadyReported = post.report.some((report) => report.user.toString() === userId);
    if (alreadyReported) {
      return res.status(400).json({ message: "You have already reported this post" });
    }

    post.report.push({ user: userId, reason });
    await post.save();

    res.status(200).json({ message: "Post reported successfully" });
  } catch (error) {
    console.error("Error reporting post:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.put('/allow/:postId', async (req, res) => {
  try {
    const postId = req.params.postId;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).send("Post not found");
    }

    post.flag = false;
    await post.save();
    const channel = await Channel.findOne({ path: post.path });
    channel.posts.push(post._id);
    channel.files.push(post.file);
    await channel.save();

    res.status(200).json(post);
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json(error);
  }
})

router.delete('/deleteflagged/:postId', async (req, res) => {
  try{
    const postId = req.params.postId;
    
    const post = await Post.findByIdAndDelete(postId);
    res.status(200).json({ message: "Post deleted successfully" });
  }
  catch (error) {
    console.error('Error deleting flagged post:', error);
    res.status(500).json(error);
  }
})



router.get('/reported/*', async (req, res) => {
  try {
    const path = req.params[0];
    console.log(path);

    const channelData = await Channel.findOne({ path }).populate('posts');
    if (!channelData) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    const reportedPosts = await Post.find({
      _id: { $in: channelData.posts },
      "report.0": { $exists: true }
    })
    .populate('user', 'username image')
    .populate('report.user', 'username');

    const flaggedPosts = await Post.find({
      path: path,
      flag: true
    }).populate('user', 'username image');
    

    res.status(200).json([reportedPosts,flaggedPosts]); 
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Delete a single report from a post
router.delete("/report/:postId", async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId);

    if (!post || !post.report.length) {
      return res.status(404).json({ message: "No reports found on this post" });
    }

    post.report.pop(); // Remove the latest report
    await post.save();
    res.status(200).json({ message: "Report deleted successfully" });
  } catch (error) {
    console.error("Error deleting report:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Delete all reports from a post
router.delete("/report/all/:postId", async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    post.report = []; // Clear all reports
    await post.save();
    res.status(200).json({ message: "All reports deleted successfully" });
  } catch (error) {
    console.error("Error deleting all reports:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});



















router.post('/upload' , async(req, res) => {                    
      const result = await uploadFile();
      res.status(201).json(result);
      console.log(result);
    
});

router.post('/postpost/*', async (req, res) => {
  try {
    const channelPath = req.params[0];
    req.body.path = channelPath;
    req.body.user = req.user.id;

    // Find the user by their ID
    const user = await User.findById(req.user.id);

    // Check if the user is blocked
    if (user.blockedUntil && user.blockedUntil > new Date()) {
      return res.status(403).json({ message: `You are blocked until ${user.blockedUntil}` });
    }

    // If the block time has expired, unset the blockedUntil field
    if (user.blockedUntil && user.blockedUntil <= new Date()) {
      user.blockedUntil = null;
      await user.save();
    }

    // Check if the post has a link (file upload)
    if (req.body.link) {
      const file = await File.create({
        link: req.body.link,
        user: req.user.id,
        title: req.body.title,
        description: req.body.description,
        type: req.body.type
      });

      req.body.file = file._id;
      const post = await Post.create(req.body);

      file.post = post._id;
      await file.save();

      if(post.flag){
        res.status(401).json({ message: 'post flagged' });
        return;
      }

      const channel = await Channel.findOne({ path: channelPath });
      channel.posts.push(post._id);
      channel.files.push(file._id);
      await channel.save();
    } else {
      const post = await Post.create(req.body);
      const channel = await Channel.findOne({ path: channelPath });
      channel.posts.push(post._id);
      await channel.save();
    }

    res.status(201).json({ message: 'Post created' });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json(error);
  }
});

// Update a post
router.put('/:postId', async (req, res) => {
  try {
    const postId = req.params.postId;
    const channelPath = req.params[0];

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).send("Post not found");
    }

    // Check if the user trying to edit the post is the owner
    if (post.user.toString() !== req.user.id) {
      return res.status(403).send("You are not authorized to edit this post");
    }

    // Update the post
    Object.assign(post, req.body); // Use Object.assign to update fields
    await post.save();

    res.status(200).json(post);
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json(error);
  }
});

// Delete a post
router.delete('/*/:postId', async (req, res) => {
  try {
    const postId = req.params.postId;
    const channelPath = req.params[0];

    

    const post = await Post.findByIdAndDelete(postId);
    if (!post) {
      throw new Error("Post deletion failed");
    }
    if(post.file){
      const file = await File.findByIdAndDelete(post.file);
      if (!file) {
        throw new Error("File deletion failed");
      }
      const key = file.link.substring(file.link.lastIndexOf('/') + 1);
      deleteFile(key);
      
      
    }
    if(!post.flag){
      const channel = await Channel.findOne({ path: channelPath }).populate("posts");

      if (!channel) {
        throw new Error("Channel not found");
      }

      const postIndex = channel.posts.findIndex(post => post._id.toString() === postId);
      if (postIndex === -1) {
        throw new Error("Post not found");
      }
      channel.posts.splice(postIndex, 1);
      await channel.save();
    }
    res.status(200).json(post);
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json(error);
  }
});

// Add a comment to a post
router.post('comments/*/:postId', async (req, res) => {
  try {
    const channelPath = req.params[0];
    req.body.user = req.user.id;
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).send("Post not found");
    }

    post.comments.push(req.body);
    await post.save();

    const newComment = post.comments[post.comments.length - 1];
    newComment._doc.user = req.user;

    res.status(201).json(newComment);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json(error);
  }
});

router.put('/like/:postId', async (req, res) => {
  try {
    const postId = req.params.postId;

    const post = await Post.findById(postId);
    const user = await User.findById(req.user.id);


    if (!post) {
      return res.status(404).send("Post not found");
    }
    if(post.likes.includes(req.user.id)){
      post.likes.pop(req.user.id);
      user.likedPosts.pop(req.params.postId);
      follow = false;
    // follow
    }else{
      post.likes.push(req.user.id);
      user.likedPosts.push(req.params.postId);

    }
    
    await post.save();

    res.status(200).send(post.likes.includes(req.user.id));
    // res.status(200).json(`${post},${user}`);
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json(error);
  }
});

router.put('/like/:postId/:commentId', async (req, res) => {
  try {
    const postId = req.params.postId;
    const commentId = req.params.commentId;

    const post = await Post.findById(postId);
    const user = await User.findById(req.user.id);


    if (!post) {
      return res.status(404).send("Post not found");
    }
    const comment = post.comments.find(comm => comm._id == commentId)
    console.log(comment)
    if(comment.likes.includes(req.user.id)){
      comment.likes.pop(req.user.id);
      user.likedComments.pop(req.params.postId);
      follow = false;
    // follow
    }else{
      comment.likes.push(req.user.id);
      user.likedPosts.push(req.params.postId);

    }
    await post.save();

    res.status(200).send(post.likes.includes(req.user.id));
    // res.status(200).json(`${post},${user}`);
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json(error);
  }
});



// Search posts by text or user
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query; // Get the search query from the URL
    const posts = await Post.find({
      $or: [
        { text: { $regex: query, $options: 'i' } }, // Case-insensitive text match
        { path: { $regex: query, $options: 'i' } },
      ]
    }).populate([{ path: 'user', model: 'User' }]);

    res.status(200).json(posts);
  } catch (error) {
    console.error('Error searching posts:', error);
    res.status(500).json(error);
  }
});



module.exports = router;