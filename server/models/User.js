const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const jwt = require('jsonwebtoken');

const userSchema = mongoose.Schema({
  name: {
    type: String,
    maxlength: 50
  },
  email: {
    type: String,
    trim: true,
    unique: 1
  },
  password: {
    type: String,
    minlength: 5
  },
  lastname: {
    type: String,
    maxlength: 50
  },
  role: {
    type: Number,
    default: 0
  },
  image: String,
  token: {
    type: String
  },
  tokenExp: {
    type: Number
  }
});

userSchema.pre('save', function(next) {
  const user = this; 

  // 비밀번호 변경시에만 
  if(user.isModified('password')) {
    // 비밀번호 암호화
    bcrypt.genSalt(saltRounds, (err, salt) => {
      if(err) return next(err);

      bcrypt.hash(user.password, salt, (err, hash) => {
        if(err) return next(err);

        user.password = hash;
        next();
      });
    });
  } else {
    next();
  }
});

userSchema.methods.comparePassword = function(plainPassword, cb) {
  bcrypt.compare(plainPassword, this.password, function(err, isMatched) {

    if(err) return cb(err)

    cb(null, isMatched)

  });
}

userSchema.methods.generateToken = function(cb) {
  const user = this;
  // jwt를 이용해 token 생성 
  const token = jwt.sign(user._id.toHexString(), 'secretToken');
  user.token = token;
  user.save(function(err, user) {
    if (err) return cb(err);
    cb(null, user);
  })
}

userSchema.statics.findByToken = function(token, cb) {
  const user = this;

  jwt.verify(token, 'secretToken', function(err)  {
    user.findOne({ "token": token }, function(err, user) {
      if (err) return cb(err);

      cb(null, user);
    })
  });
}

const User = mongoose.model('User', userSchema);

module.exports = { User }