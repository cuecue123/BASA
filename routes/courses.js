const express = require('express');
const router = express.Router();
// const passport = require('passport');
const Course = require('../models/course');
const Section = require('../models/section');
const Comment = require('../models/comment');
const { needAuth, hasAuth, hasPermission} = require('../config/authenticate');

router.get('/catalog', hasAuth, (req, res) => {
    Course.find({}, (err, doc) => {
        if (err) {
            console.log("Failed to retrieve courses");
        }
        var educator = false;
        if (req.user.role == "educator") {
            educator = true;
        }
        res.render('catalog', {layout: 'navbar', user: false, educator: educator, username: req.user.username, doc: doc});
    })
});

router.get('/:courseId', (req, res) => {
    const { courseId } = req.body;
    Course.find({ courseId: courseId })
        .populate('sections')
        .exec(function(err, doc) {
        if (err) {
            console.log("Failed to retrieve sections");
        }
        console.log("get all sections:", doc);
        res.render('catalog', {layout: 'navbar', doc: doc.sections});
    })
});


router.get('/:courseId/:sectionId', (req, res) => {
    const { courseId, sectionId } = req.body;
    Section.findOne({ sectionId: sectionId, courseId: courseId })
        .populate('comments')
        .exec(function (err, doc) {
            if (err) {
                console.log("Failed to retrieve sections");
            }
            console.log("get section:", doc);
            res.render('catalog', {layout: 'navbar', doc: doc});
        })
});

router.get('/:courseId/:sectionId/:commentId', (req, res) => {
    const { courseId, sectionId, commentId } = req.body;
    Comment.findOne({ sectionId: sectionId, courseId: courseId, commentId: commentId })
        .exec(function (err, doc) {
            if (err) {
                console.log("Failed to retrieve comments");
            }
            console.log("get comment:", doc);
            res.render('catalog', {layout: 'navbar', doc: doc});
        })
});

router.post('/:courseId/:sectionId/addComment', (req, res) => {
    const { courseId, sectionId, commentId, time, content } = req.body;

    if (!sectionId || !courseId || !commentId || !content) {
        err.push({ msg: 'Missing entries' });
    } else{
        const newComment = new Comment({
            courseId: courseId,
            sectionId: sectionId,
            commentId: commentId,
            content: content,
            time: time,
            replies: []
        });

        newComment.save(function (err) {
            if (err) return handleError(err);
        });

        Section.findOneAndUpdate({courseId: courseId, sectionId: sectionId}, {$push: {comments: newComment }} , {new: true}, (err, doc) => {
            if (err) {
                console.log("Failed to add comment");
            }
            req.flash(
                'success_msg',
                'Comment is now added'
            );
            //console.log("new comment is", newComment);
            console.log("successful save to database");
            console.log(doc);

            res.redirect('/:courseId/:sectionId');
        });
    }
});

router.post('/:courseId/:sectionId/:commentId/addReply', (req, res) => {
    const { courseId, sectionId, original_id, reply_id, time, content } = req.body;

    if (!sectionId || !courseId || !original_id || !reply_id || !content) {
        err.push({ msg: 'Missing entries' });
    } else{
        const newComment = new Comment({
            courseId: courseId,
            sectionId: sectionId,
            commentId: reply_id,
            content: content,
            time: time,
            replies: []
        });

        Comment.findOneAndUpdate({courseId: courseId, sectionId: sectionId, commentId: original_id}, {$push: {replies: newComment }} , {new: true}, (err, doc) => {
            if (err) {
                console.log("Failed to add reply");
            }
            req.flash(
                'success_msg',
                'reply is now added'
            );
            console.log("successful save to database");
            console.log(doc);
            res.redirect('/:courseId/:sectionId');
        });
    }
});


router.post('/:courseId/addSection', (req, res) => {
    console.log(req.body);

    const { courseId, sectionId, videos, description } = req.body;

    let err = [];

    if (!sectionId || !courseId) {
        err.push({ msg: 'Missing sectionId' });
    } else{
        const newSection = new Section({
            courseId: courseId,
            sectionId: sectionId,
            videos: videos,
            description: description,
            comments: []
        });

        newSection.save(function (err) {
            if (err) return handleError(err);
        });
        Course.findOneAndUpdate({courseId: courseId}, {$push: {sections: newSection }} , {new: true}, (err, doc) => {
            if (err) {
                console.log("Failed to add sections");
            }
            req.flash(
                'success_msg',
                'Section is now added'
            );
            console.log("successful save to database");
            console.log(doc);
            res.redirect('/courses/catalog');
        });
    }
});


router.get('/create', hasPermission, (req, res) => {
    var educator = false;
        if (req.user.role == "educator") {
            educator = true;
    }
    res.render('create', {layout: 'navbar', user: false, username: req.user.username, educator: educator})
})


router.post('/create', hasAuth, (req, res) => {
    console.log(req.body);

    const { courseId, courseName, age, description, subject} = req.body;

    let err = [];

    if (!courseId || !courseName || !age || !subject) {
         err.push({ msg: 'Missing Entries' });
    }

    if (err.length > 0) {
         console.log(err);
         res.render('create', {
             err,
         });
    } else {
        Course.findOne({courseId: courseId}).then(course => {
            if (course) {
                err.push({ msg: 'Course Already Exist' });
                res.render('create', {
                    err,
                });
            } else {
                const newCourse = new Course({
                    courseId: courseId,
                    courseName: courseName,
                    age: age,
                    subject: subject,
                    description: req.body.description,
                    educatorId: req.user.userId
                });
                console.log("new course:", newCourse);
                newCourse
                    .save()
                    .then(() => {
                        req.flash(
                            'success_msg',
                            'Course are now created'
                        );
                        console.log("successful save to database");
                        res.redirect('/courses/catalog');
                    })
                    .catch(err => console.log(err));
            }
        })
    }
});

module.exports = router;