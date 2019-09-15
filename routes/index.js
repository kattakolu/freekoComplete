const express = require('express');
const router = express.Router();
const passport = require('passport');
const userModel = require('./users');
const postModel = require('./posts');
const localStrategy = require('passport-local');
const multer = require('multer');

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images/uploads')
  },
  filename: function (req, file, cb) {
    let dates = new Date();
    dates = dates.getTime();
    cb(null, dates + file.originalname);
  }
})

var upload = multer({ storage: storage })

passport.use(new localStrategy(userModel.authenticate()));

router.get('/', redirectUser,function (req, res) {
  res.render('index', {isLoggedIn: false});
});

router.get('/register', function (req, res) {
  res.render('register', {isLoggedIn: false});
});

router.get('/update', isLoggedIn, function (req, res) {
  userModel.findOne({ username: req.session.passport.user })
    .then(function (userDetails) {
      res.render('update', { details: userDetails, isLoggedIn: true });
    })
})

router.get('/profile', isLoggedIn, function (req, res) {
  userModel.findOne({ username: req.session.passport.user })
    .populate('posts')
    .exec(function (err, user) {
      console.log(user);
      res.render('profile', { details: user, isUser: true, isLoggedIn: true });
    })
});

router.post('/messages/:id', function(req, res){
    userModel.findOne({_id: req.params.id})
      .then(function(userDetails){
        userDetails.messages.push(req.body.message);
        userDetails.save().then(function(){
          res.redirect(req.headers.referer);
        })
      })
});

router.get('/profile/:id', isLoggedIn, function (req, res) {
  userModel.findOne({ username: req.session.passport.user })
    .then(function (loggedInUser) {
      userModel.findOne({_id: req.params.id})
        .populate('posts')
        .exec(function (err, user) {
          if(req.params.id == loggedInUser._id){
            res.redirect('/profile');  
          }
          res.render('profile', { details: user, isUser: false, isLoggedIn: true });
        })
    })
});

router.get('/timeline', isLoggedIn, function (req, res) {
  postModel.find().populate('postedBy').exec(function (err, posts) {
    userModel.findOne({ username: req.session.passport.user })
      .then(function (user) {
        res.render('timeline', { posts: posts, details: user, isLoggedIn: true });
      })
  })
});

router.get('/love/:postid', function (req, res) {
  userModel.findOne({ username: req.session.passport.user })
    .then(function (userDetails) {
      postModel.findOne({ _id: req.params.postid })
        .then(function (lovedPost) {
          if (lovedPost.loves.indexOf(userDetails._id) == -1) {
            lovedPost.loves.push(userDetails);
          }
          lovedPost.save().then(function () {
            res.redirect(req.headers.referer);
          })
        })
    })
})

router.get('/like/:postid', function (req, res) {
  userModel.findOne({ username: req.session.passport.user })
    .then(function (userDetails) {
      postModel.findOne({ _id: req.params.postid })
        .then(function (likedPost) {
          if (likedPost.likes.indexOf(userDetails._id) == -1) {
            likedPost.likes.push(userDetails);
          }
          likedPost.save().then(function () {
            res.redirect(req.headers.referer);
          })
        })
    })
})

router.get('/dislike/:postid', function (req, res) {
  userModel.findOne({ username: req.session.passport.user })
    .then(function (userDetails) {
      postModel.findOne({ _id: req.params.postid })
        .then(function (dislikedPost) {
          if (dislikedPost.dislikes.indexOf(userDetails._id) == -1) {
            dislikedPost.dislikes.push(userDetails);
          }
          dislikedPost.save().then(function () {
            res.redirect(req.headers.referer);
          })
        })
    })
})

router.get('/login', function (req, res) {
  res.render('login', {isLoggedIn: false});
});

router.get('/logout', function (req, res) {
  req.logout();
  res.redirect('/');
})

// POST ROUTES AND DATA ROUTES ARE STARTING

router.post('/register', function (req, res) {
  const detailsWithoutPassword = new userModel({
    name: req.body.name,
    username: req.body.username,
    city: req.body.city,
    about: req.body.about,
    email: req.body.email,
    gender: req.body.gender,
    phone: req.body.phone
  });
  userModel.register(detailsWithoutPassword, req.body.password)
    .then(function (registeredUser) {
      passport.authenticate('local')(req, res, function () {
        res.redirect('/profile');
      });
    })
    .catch(function(userExists){
      console.log(userExists);
      res.redirect('/register');
    })
});

router.post('/update', function (req, res) {
  let searchParam = { username: req.session.passport.user };
  let updateParams = {
    name: req.body.name,
    username: req.body.username,
    about: req.body.about,
    city: req.body.city,
    phone: req.body.phone
  };
  userModel.findOneAndUpdate(searchParam, updateParams, { new: true })
    .then(function (updatedData) {
      res.redirect('/profile');
    })
});

router.post('/profilepic', upload.single('prfl'), function (req, res) {
  userModel.findOne({ username: req.session.passport.user })
    .then(function (loggedInUser) {
      loggedInUser.profilePic = '../images/uploads/' + req.file.filename;
      loggedInUser.save().then(function (savedUser) {
        res.redirect('/profile');
      })
    })
});


router.post('/login', passport.authenticate('local', {
  successRedirect: '/timeline',
  failureRedirect: '/login'
}), function (req, res) { });

router.post('/post', function (req, res) {
  postModel.create({
    postText: req.body.post
  }).then(function (postedPost) {
    userModel.findOne({ username: req.session.passport.user })
      .then(function (loggedInUser) {
        loggedInUser.posts.push(postedPost);
        postedPost.postedBy = loggedInUser;
        loggedInUser.save().then(function () {
          postedPost.save().then(function () {
            res.redirect('/profile');
          })
        })
      })
  })
})



function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  else {
    res.redirect('/login');
  }
}

function redirectUser(req, res, next) {
  if (req.isAuthenticated()) {
    res.redirect('/profile')
  }
  else{
    return next();
  }
}


module.exports = router; 