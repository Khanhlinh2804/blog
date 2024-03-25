const express = require('express');
const router = express.Router();
const Post = require('../models/post');

// Router

// Get home
router.get('', async(req, res) => {
    try {
        const locals = {
            title : "Home",
            description: "Simple Blog"
        }
        let perPage = 3;
        let page = req.query.page || 1;

        const data = await Post.aggregate([ { $sort: {createAt: -1} }])
            .skip(perPage * page - perPage)
            .limit(perPage)
            .exec();

        const count = await Post.count();
        const nextPage = parseInt(page) + 1;
        const hasNextPage = nextPage <= Math.ceil(count / perPage)


        res.render('index', { 
            locals,
            data,
            current: page,
            nextPage: hasNextPage ? nextPage : null
        });
    } catch (error) {
        console.log(error)
    }
});

// router.get('', async (req, res) => {
//     const locals = {
//         title: "Home",
//         description: "Simple Blog"
//     }
//     try {
//         const data = await Post.find();
//         res.render('index', { locals, data });
//     } catch (error) {
//         console.log(error)
//     }
// });







router.get('/contact',(req,res)=>{
    const locals = {
        title: "Contact",
        description: "Simple Blog"
    }
    res.render('contact', { locals });
})

module.exports = router;