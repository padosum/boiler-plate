const express = require('express');
const app = express();
const port = 3000;
const { auth } = require('./middleware/auth');
const { User } = require('./models/User');
const config = require('./config/key');
const cookieParser = require('cookie-parser');
app.use(express.json());
app.use(cookieParser());

const mongoose = require('mongoose');
mongoose.connect(config.mongoURI, {
}).then(() => console.log('MongoDB Connected...'))
  .catch(err => console.log(err));

app.get('/', (req, res) => {
  res.send('๐ Hello World!')
});

app.post('/api/users/register', (req, res) => {
  const user = new User(req.body);
  user.save((err, useInfo) => {
    if(err) return res.json({ success: false, err});
    return res.status(200).json({
      success: true
    })
  })
});

app.post('/api/users/login', (req, res) => {
  const user = new User(req.body);
  // ์์ฒญํ ์ด๋ฉ์ผ์ด DB์ ์๋์ง ํ์ธ 
  User.findOne({ email: req.body.email }, (err, userInfo) => {
    if(!userInfo) {
      return res.json({
        loginSuccess: false,
        message: "email์ ํด๋นํ๋ User๊ฐ ์์ต๋๋ค."
      });
    }

    // ์์ฒญํ ์ด๋ฉ์ผ์ด DB์ ์๋ค๋ฉด ๋น๋ฐ๋ฒํธ ํ์ธ 
    userInfo.comparePassword(req.body.password, (err, isMatched) => {
      if(!isMatched)
        return res.json({loginSuccess: false, message: "๋น๋ฐ๋ฒํธ๊ฐ ๋ง์ง ์์ต๋๋ค."})

      // ๋น๋ฐ๋ฒํธ๊ฐ ์ผ์นํ๋ฉด User์ token ์์ฑํ๊ธฐ 
      userInfo.generateToken((err, user) => {
        if(err) return res.status(400).send(err);

        // ํ ํฐ์ ์ฟ ํค์ ์ ์ฅ 
        res.cookie("x_auth", user.token)
           .status(200)
           .json({ loginSuccess: true, userId: user._id });
      });
      
    });
  });
});

app.get('/api/users/auth', auth, (req, res) => {
  res.status(200).json({
    _id: req.user._id,
    isAdmin: req.user.role === 0 ? false : true,
    isAuth: true,
    email: req.user.email,
    name: req.user.name,
    lastname: req.user.lastname,
    role: req.user.role,
    image: req.user.image,
  });
});

app.get('/api/users/logout', auth, (req, res) => {
  User.findOneAndUpdate({ _id: req.user._id },
    { token: "" }
    , (err, user) => {
      if (err) return res.json({ success: false, err });

      return res.status(200).send({
        success: true
      });
    });
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
});