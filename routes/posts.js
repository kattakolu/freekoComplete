const mongoose = require('mongoose');
const plm = require('passport-local-mongoose');

const postSchema = mongoose.Schema({
    postedAt: {
        type: String,
        default: Date
    },
    likes: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
    dislikes: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
    loves: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
    postText: String,
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('Post', postSchema);