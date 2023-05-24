//jshint esversion:6
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');


const app = express();

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

mongoose.connect("mongodb://127.0.0.1/userDB", {
  useNewUrlParser: true
});

const userSchema = new mongoose.Schema({
  email: String,
  password: String
});


userSchema.plugin(encrypt, {
  secret: process.env.SECRET, // access the value of our secret key from .env file
  encryptedFields: ["password"]
}); // here we just encrypt our password feild

const User = mongoose.model('User', userSchema);



app.get('/', (req, res) => {
  res.render('home'); // res.render() is used to render html file and send it back to the client
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.get('/login', (req, res) => {
  res.render('login');
});


app.post('/register', async (req, res) => {

  try {

    const newUser = await new User({
      email: req.body.username,
      password: req.body.password
    });

    await newUser.save();
    res.render('secrets');

  } catch (err) {
    res.send(err);
  }
});

app.post('/login', (req, res) => {
  const userName = req.body.username;
  const userPassword = req.body.password;
  User.findOne({
    email: userName
  }).then((foundItem) => { //check entered email is available or not
    if (foundItem) {
      if (foundItem.password === userPassword) { // if available password matched or not
        res.render('secrets');
      } else {
        res.send('Password is incorrect, Please check again.');
      }
    } else {
      res.send('Wrong Username, Please put a correct username');
    }
  }).catch((err) => {
    res.send(err);
  });

});



app.listen(3000, () => {
  console.log('Server started on port 3000');
});
