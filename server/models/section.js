var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var SectionSchema = new mongoose.Schema({
    sectionId: {type: String},
    videos: [{
        video: Buffer
    }],
    description: {type: String},
    comments: [{
        comment: {
            type: Schema.Types.ObjectId,
            ref: "Comment"
        }
    }]
});

var Section = mongoose.model("Section", SectionSchema);
module.exports = Section;