const mongoose = require('mongoose');
const plm = require('passport-local-mongoose');

const userSchema = mongoose.Schema({
  name: String,
  username: String,
  password: String,
  email: String,
  city: String,
  gender: String,
  about: String,
  phone: Number,
  messages: [],
  profilePic: {
    type: String,
    default: '../images/uploads/default.png'
  },
  posts: [{type: mongoose.Schema.Types.ObjectId, ref: 'Post'}]
});

userSchema.plugin(plm);

module.exports = mongoose.model('User', userSchema);