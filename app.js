//jshint esversion:6
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy; // require for google aunthentication
const findOrCreate = require('mongoose-findorcreate');


const app = express();

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({ // configure session package
  secret: process.env.SECRET_SESSION,
  resave: false,
  saveUninitialized: false,

}));

app.use(passport.initialize()); // initialize the passport package
app.use(passport.session()); // here passport deal eith session

mongoose.connect("mongodb://127.0.0.1/userDB", {
  useNewUrlParser: true
});

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  googleId:String
});

userSchema.plugin(passportLocalMongoose); // this will be hashing and salting user password and save user's data in db
userSchema.plugin(findOrCreate); //to enable work of findOrCreate package


const User = mongoose.model('User', userSchema);


passport.use(User.createStrategy());

// This is the serialize or deserialize user for all strategy
passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, {
      id: user.id,
      username: user.username,
      picture: user.picture
    });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({
      googleId: profile.id,
      username: profile.id
    }, function(err, user) {
      return cb(err, user);
    });
  }
));



app.get('/', (req, res) => {
  res.render('home'); // res.render() is used to render html file and send it back to the client
});

app.get('/auth/google',
  passport.authenticate('google', {
    scope: ['profile']
  }));

  app.get('/auth/google/secrets',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function(req, res) {
      // Successful authentication, redirect secrets
      res.redirect('/secrets');
    });

app.get('/register', (req, res) => {
  res.render('register');
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/secrets', (req, res) => {
  if (req.isAuthenticated()) {
    res.render('secrets');
  } else {
    res.redirect('/login');
  }
});

// logout needs a callback
app.get("/logout", (req, res, next) => {
  req.logout(function(err) {
    if (err) {
      return next(err);
    }
    res.redirect('/');
  });
});

app.post('/register', (req, res) => {
  User.register({
    username: req.body.username,
    active: false
  }, req.body.password, function(err, user) {
    if (err) {
      console.log(err);
      res.redirect('/register');
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect('/secrets');
      });
    }

  });

});


app.post('/login', (req, res) => {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, (err) => {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/secrets");
      });
    }
  });

});



app.listen(3000, () => {
  console.log('Server started on port 3000');
});




///////////////////////////////// old methods and packages //////////////////


// const encrypt = require('mongoose-encryption');
// const md5=require('md5');
// const bcrypt = require('bcrypt');
// const saltRounds = 10; // no of saltRounds we want



// app.post('/register', (req, res) => {
//   try {
//
//     bcrypt.hash(req.body.password, saltRounds, async function(err, hash) {
//
//
//       const newUser = await new User({
//         email: req.body.username,
//         password: hash
//       });
//
//       await newUser.save();
//       res.render('secrets');
//     });
//   } catch (err) {
//     res.send(err);
//   }
// });


// app.post('/login', (req, res) => {
//   const userName = req.body.username;
//   const userPassword = req.body.password;
//   User.findOne({
//     email: userName
//   }).then((foundItem) => { //check entered email is available or not
//     if (foundItem) {
//       bcrypt.compare(userPassword, foundItem.password, function(err, result) { // here we compare user provided password with hash stored in database for that perrticular username
//         if (result === true) {
//           res.render('secrets');
//         } else {
//           res.send('Password is incorrect, Please check again.');
//         }
//       });
//     } else {
//       res.send('Wrong Username, Please put a correct username');
//     }
//   }).catch((err) => {
//     res.send(err);
//   });
//
// });
