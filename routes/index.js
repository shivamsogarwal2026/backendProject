var express = require('express');
var router = express.Router();
const userModel =require("./users");
const postModel =require("./post");
const passport = require('passport');
const localStrategy = require('passport-local');
const upload = require('./multer');

passport.use(new localStrategy(userModel.authenticate()));

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { error: req.flash('error') }); // Corrected syntax
  });

router.get('/register', function(req, res, next) {
  res.render('register');
});



router.post('/register', function(req, res, next) {
  const data = new userModel({
    username: req.body.username,
    name: req.body.name,
    email: req.body.email,
    contact: req.body.contact
  })
  userModel.register(data, req.body.password)
  .then(function(){
    passport.authenticate("local")(req, res, function(){
      res.redirect("/profile");
    })
  })
});

// router.post('/login', passport.authenticate("local", {
//   failureRedirect: "/",
//   successRedirect: "/profile",
// }),function(req, res, next) {
  
// });
router.post("/login", passport.authenticate("local", {
  successRedirect: "/profile",
  failureRedirect: "/",
  failureFlash: true,
}), function(req,res){
});

router.get('/logout', function(req, res, next) {
  req.logout(function(err){
    if(err){return next(err);}
    res.redirect('/');
  })
});

// function isLoggedIn(req, res, next){
//   if(req.isAuthenticated()){
//     return next();
//   }
//   res.redirect("/");
// }
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/");
}

router.post('/fileupload', isLoggedIn, upload.single("image"), async function(req, res, next) {
  // Handle file upload here
  const user = await userModel.findOne({username: req.session.passport.user});   //this line is taking the data of user
  user.profileImage = req.file.filename;  //put the name of image in profileImage of user
  await user.save();
  res.redirect('profile');
});

router.post('/createpost', isLoggedIn, upload.single("postimage"), async function(req, res, next) {
  // it is to add post  postmodel will use
  const user = await userModel.findOne({username: req.session.passport.user});   //this line is taking the data of user
  const post = await postModel.create({
    user: user._id,
    title: req.body.title,
    description: req.body.description,
    image: req.file.filename
  });

  user.posts.push(post._id);
  await user.save();
  res.redirect('profile');
});




// router.get('/profile',  isLoggedIn , async function(req, res, next) {
//   const user = await userModel.findOne({username: req.session.passport.user});

//   res.render('profile', {user});
// });
router.get('/profile', isLoggedIn, async function(req, res, next) {
  const user = await userModel
  .findOne({ username: req.session.passport.user })
  .populate("posts");
  res.render('profile', { user });
});

router.get('/show/posts', isLoggedIn, async function(req, res, next) {
  const user = await userModel
  .findOne({ username: req.session.passport.user })
  .populate("posts");
  res.render('show', { user });
});

// router.get('/feed', isLoggedIn, async function(req, res, next) {
//   const user = await userModel.findOne({ username: req.session.passport.user });
//   const posts = await postModel.find()
//   .populate("user")
  
//   res.render("feed", {user, posts});
// });
router.get('/feed', isLoggedIn, async function(req, res, next) {
  try {
    const user = await userModel.findOne({ username: req.session.passport.user });
    const posts = await postModel.find().populate("user", "username name"); // Populate only necessary fields of the user

    res.render("feed", { user, posts });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});


router.get('/add',  isLoggedIn , async function(req, res, next) {
  const user = await userModel
  .findOne({username: req.session.passport.user})
  .populate("posts");
  //here populate line is sending or posting the posts to profile page   here posts is in postSchema
  res.render('add', {user});
});

module.exports = router;



router.get("/logout", function(req,res){
  req.logout(function(err){
    if(err) {return next(err);}
    res.redirect('/login');
  });
});

function isLoggedIn(req, res, next){
  if(req.isAuthenticated()) return next();
  res.redirect("/login");
}
