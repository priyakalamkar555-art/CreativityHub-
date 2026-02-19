const express = require('express');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const session = require('express-session');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

const Post = require('./models/Post');
const User = require('./models/user');

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.set('view engine','ejs');

// Session
app.use(
  session({
    secret: 'mysecretkey',
    resave: false,
    saveUninitialized: false
  })
);


app.use(express.static(path.join(__dirname,'public')));
app.use('/uploads',express.static('uploads'));

app.get('/', (req,res)=> {
  res.render('index');
});
app.get('/creativity_hub', (req,res) => {
    res.redirect('/');
});
/*
app.get('/creativity_hub', (req,res) => {
    res.render('index');
});*/

app.get('/creativity_hub/login', (req, res) => {
    res.render('login', {message: null});
    
});

app.post('/creativity_hub/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.render('login', { message: 'Something went wrong' });
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return res.render('login', { message: 'Something went wrong' });
  }

  req.session.user = user;
 
  res.redirect('/creativity_hub/upload')
})

app.get('/creativity_hub/signup', (req, res) => {
    res.render('signup',{ message: null});
});

app.post('/creativity_hub/signup', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.render('signup', { message: 'User already exists!' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      username,
      email,
      password: hashedPassword
    });

    res.render('login', { message: 'Account created! Please login.' });

  } catch (err) {
    console.log(err);
    res.render('signup', { message: 'Something went wrong' });
  }
});


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });


app.get('/creativity_hub/upload', (req,res) => {
    if(!req.session.user){
        return res.redirect('/creativity_hub/login');
    }
    res.render('upload', { user: req.session.user });
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/creativity_hub');
});

app.post('/creativity_hub/upload',upload.single('image'),async (req,res) => {
    const{name,thought} = req.body;

    await Post.create({
      name,
      thought,
      imageURL: req.file ? `/uploads/${req.file.filename}` : '', // For local
      user: req.session.user._id
    });
    
    res.redirect('/creativity_hub/gallery');
});

app.get('/creativity_hub/gallery', async (req,res) => {
  const uploadImage = await Post.find().populate('user').populate('comments.user').populate('likes').sort({_id:-1});
    res.render('gallery',{uploadImage, user: req.session.user, userId: req.session.user ? req.session.user._id : null, userName: req.session.user ? req.session.user.username : ''});
});

// Like a post
app.post('/creativity_hub/like/:postId', async (req, res) => {
  if (!req.session.user) return res.redirect('/creativity_hub/login');
  const post = await Post.findById(req.params.postId);
  if (!post.likes.includes(req.session.user._id)) {
    post.likes.push(req.session.user._id);
    await post.save();
  }
  res.redirect('/creativity_hub/gallery');
});

// Add comment
app.post('/creativity_hub/comment/:postId', async (req, res) => {
  if (!req.session.user) {
    if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
      return res.status(401).json({ success: false, message: 'Not logged in' });
    }
    return res.redirect('/creativity_hub/login');
  }
  const { comment } = req.body;
  const post = await Post.findById(req.params.postId);
  post.comments.push({ text: comment, user: req.session.user._id });
  await post.save();

  if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
    return res.json({ success: true });
  }
  res.redirect('/creativity_hub/gallery');
});

// Edit post
app.get('/creativity_hub/edit/:postId', async (req, res) => {
  if (!req.session.user) return res.redirect('/creativity_hub/login');
  const post = await Post.findById(req.params.postId);
  if (!post || post.user.toString() !== req.session.user._id.toString()) {
    return res.redirect('/creativity_hub/gallery');
  }
  res.render('edit', { post, user: req.session.user });
});

app.post('/creativity_hub/edit/:postId', async (req, res) => {
  if (!req.session.user) return res.redirect('/creativity_hub/login');
  const { name, thought } = req.body;
  const post = await Post.findById(req.params.postId);
  if (!post || post.user.toString() !== req.session.user._id.toString()) {
    return res.redirect('/creativity_hub/gallery');
  }
  post.name = name;
  post.thought = thought;
  await post.save();
  res.redirect('/creativity_hub/gallery');
});

// Delete post
app.post('/creativity_hub/delete/:postId', async (req, res) => {
  if (!req.session.user) return res.redirect('/creativity_hub/login');
  const post = await Post.findById(req.params.postId);
  if (!post || post.user.toString() !== req.session.user._id.toString()) {
    return res.redirect('/creativity_hub/gallery');
  }
  await Post.findByIdAndDelete(req.params.postId);
  res.redirect('/creativity_hub/gallery');
});

const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/creativityHub')
.then(() => {
    console.log('MongoDB Connected');

    app.listen(PORT, () => {
        console.log(`Server Working on Port ${PORT}`);
    });

})
.catch(err => console.log(err));