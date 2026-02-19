const mongoose = require('mongoose');
const postSchema = new mongoose.Schema({
    name: String,
    thought: String,
    imageURL: String,
    user: {type:
        mongoose.Schema.Types.ObjectId, ref: 'User' 
    },
    likes: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}], // Array of users who liked
    comments: [
        { 
            text: String,
            user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
            createdAt: { 
                type: Date,
                 default: Date.now
                 },
     },
    ],
});
module.exports = mongoose.model('Post',postSchema);