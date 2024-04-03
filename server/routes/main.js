const express = require('express');
const router = express.Router();
const Post = require('../models/Post');

const mainLayout = '../views/layouts/main';

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const multer = require('multer');
const fs = require('fs');

// Router

router.get('/contact', (req, res) => {
    const locals = {
        title: "Contact",
        description: "Simple Blog"
    }
    res.render('contact', { locals });
})


router.get('/about', (req, res) => {
    const locals = {
        title: "about",
        description: "Simple Blog"
    }
    res.render('about', { locals });
})

// Get home
router.get('', async(req, res) => {
    try {
        const locals = {
            title : "Home",
            description: "Simple Blog"
        }

        let perPage = 4;
        let page = req.query.page || 1;

        const data = await Post.aggregate([ { $sort: { createAt: - 1} }])
            .skip(perPage * page - perPage)
            .limit(perPage)
            .exec();

        const count = await Post.countDocuments();
        // const count = await Post.count();
        const nextPage = parseInt(page) + 1;
        const hasNextPage = nextPage <= Math.ceil(count / perPage);

        const limit = await Post.find().limit(5);

        res.render('index', { 
            locals,
            data,
            limit,
            current: page,
            nextPage: hasNextPage ? nextPage : null,
            layout: mainLayout
        });
    } catch (error) {
        console.log(error)
    }
});

/* Get
***
* 
Giới hạn 5 bản ghi*/
// router.get('', async (req, res) => {
//     try {
        
//         const limit = await Post.find().limit(5);
//         res.render('index', {
//             limit,
//             layout: mainLayout
//         });
//     } catch (error) {
//         console.log(error)
//     }
// });

// Get/
// home post:id

router.get('/post/:id', async (req, res) => {
    try {
        let slug = req.params.id;
        const data = await Post.findById({_id : slug});
        const locals = {
            title: data.title,
            description: "Simple Blog"
        }
        res.render('detail', { 
            locals, 
            data,
            layout: mainLayout
        });
    } catch (error) {
        console.log(error);
    }
});


// Post/
// post - searchTerm
// router.post('/search', async (req, res) => {
//     try {
//         const locals = {
//             title: "search",
//             description: "Simple Blog"
//         }
//         let searchTerm = req.body.searchTerm;
//         const searchNoSpecialChar = searchTerm.replace(/[^a-zA-Z0-9 ]/g, "");

//         const data = await Post.find({
//             $or: [
//                 {name: {$regex: new RegExp(searchNoSpecialChar, 'i')}},
//                 {title: {$regex: new RegExp(searchNoSpecialChar, 'i')}},

//             ]
//         });

//         res.render("search", { 
//             locals,
//             data,
//             layout: mainLayout
//         });
//     } catch (error) {
//         console.log(error);
//     }
// });

router.post('/search', async (req, res) => {
    try {
        const locals = {
            title: "search",
            description: "Simple Blog"
        };
        const searchTerm = req.body.searchTerm;

        const data = await Post.find({
            $or: [
                { name: { $regex: new RegExp(searchTerm, 'i') } },
                { title: { $regex: new RegExp(searchTerm, 'i') } },
            ]
        });

        res.render("search", {
            locals,
            data,
            layout: mainLayout
        });
    } catch (error) {
        console.log(error);
    }
});





module.exports = router;