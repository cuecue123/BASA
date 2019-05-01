const express = require('express');
const router = express.Router();
// const passport = require('passport');
const Course = require('../models/Course');
const Section = require('../models/Section');
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



router.post('/:courseId/addSection', needAuth, (req, res) => {
    console.log(req.body);

    const { courseId, sectionId, videos, description } = req.body;

    let err = [];

    if (!sectionId || !courseId) {
        err.push({ msg: 'Missing sectionId' });
    } else{
        const newSection = new Section({
            sectionId: sectionId,
            videos: videos,
            description: description,
            comments: []
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