const express = require('express');
const router = express.Router();

const Post = require('../models/Post');
const User = require('../models/User');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const multer = require('multer');
const fs = require('fs');



const AdminLayout = '../views/layouts/admin';
const DataLayout = '../views/layouts/Ls';

const jwtSecret = process.env.JWT_SECRET;


// check login
const authMiddleware = (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.redirect('/login');
    }
    try {
        const decoded = jwt.verify(token, jwtSecret);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        return res.redirect('/dashboard');
    }

}

// // Get/
// // login page

router.get('/login', async (req, res) => {
    try {
        const locals = {
            title: "login",
            description: "Simple Blog"
        }
        res.render('admin/login', { locals, layout: DataLayout });
    } catch (error) {
        console.log(error);
    }
});

// // post /
// // login page - check login

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            // return res.status(401).json({ message: 'Invalid credentials' });
            return res.render('admin/login', { layout: DataLayout });;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user._id }, jwtSecret)
        res.cookie('token', token, { httpOnly: true });

        res.redirect('/dashboard');
    } catch (error) {
        console.log(error);
    }
});

router.post('/logout', (req, res) => {
    res.cookie('token', '');
    res.redirect('/');
})



// // Get/
// // regiest page

router.get('/register', authMiddleware, async (req, res) => {
    try {
        const locals = {
            title: "Register",
            description: "Simple Blog"
        }
        res.render('admin/register', {
            locals,
            layout: DataLayout
        });
    } catch (error) {
        console.log(error);
    }
});

// post /
// register page - check login

router.post('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        try {
            const user = await User.create({ name, email, password: hashedPassword });
            res.redirect('/login');
            // res.status(201).json({ message: 'User Create', user })
        } catch (error) {
            if (error.code === 11000) {
                res.redirect('/login');
                // res.status(409).json({message:  'User already in use'});
            }
            res.redirect('/register');
            // res.status(500).json({message : 'Internal server error'})
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal server error' })
    }
});

// Get/
// dashboard

router.get('/dashboard', authMiddleware, async (req, res) => {
    try {
        const locals = {
            title: "dashboard",
            description: "Simple Blog"
        }
        res.render('admin/dashboard', {
            locals,
            layout: AdminLayout,
        });
    } catch (error) {
        console.log(error);
    }
});


// get /
// index admin

router.get('/user', authMiddleware, async (req, res) => {
    try {
        const locals = {
            title: "List User",
            description: "Simple Blog"
        }

        let perPage = 5;
        let page = req.query.page || 1;

        const data = await User.aggregate([{ $sort: { createAt: - 1 } }])
            .skip(perPage * page - perPage)
            .limit(perPage)
            .exec();

        const count = await User.countDocuments();
        const nextPage = parseInt(page) + 1;
        const hasNextPage = nextPage <= Math.ceil(count / perPage)

        res.render('admin/user', {
            locals,
            data,
            current: page,
            nextPage: hasNextPage ? nextPage : null,
            layout: AdminLayout
        });
    } catch (error) {
        console.log(error);
    }
});


// get /
// index admin

router.get('/blog', authMiddleware, async (req, res) => {
    try {
        const locals = {
            title: "List blog",
            description: "Simple Blog"
        }

        let perPage = 4;
        let page = req.query.page || 1;

        const data = await Post.aggregate([{ $sort: { createAt: - 1 } }])
            .skip(perPage * page - perPage)
            .limit(perPage)
            .exec();

        const count = await Post.countDocuments();
        const nextPage = parseInt(page) + 1;
        const hasNextPage = nextPage <= Math.ceil(count / perPage)

        res.render('admin/index', {
            locals,
            data,
            current: page,
            nextPage: hasNextPage ? nextPage : null,
            layout: AdminLayout
        });
    } catch (error) {
        console.log(error);
    }
});

/* Post 
* *
*
Search blog */

router.post('/search-blog', async (req, res) => {
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

        res.render("admin/search-blog", {
            locals,
            data,
            layout: AdminLayout
        });
    } catch (error) {
        console.log(error);
    }
});


/* Get 
* *
*
Detail blog */

router.get('/blog/:id', async (req, res) => {
    try {
        let slug = req.params.id;
        const data = await Post.findById({ _id: slug });
        const locals = {
            title: data.name,
            description: "Simple Blog"
        }
        res.render('admin/detail', {
            locals,
            data,
            layout: AdminLayout
        });
    } catch (error) {
        console.log(error);
    }
});


/* Get 
* *
*
Add blog */

router.get('/Add-post', authMiddleware, async (req, res) => {
    try {
        const locals = {
            title: "Add Post",
            description: "Simple Blog"
        }
        res.render('admin/add', {
            locals,
            layout: AdminLayout,
        });
    } catch (error) {
        console.log(error);
    }
});


// Multer storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './upload');
    },
    filename: function (req, file, cb) {
        // cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
        cb(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
    }
});

const upload = multer({ storage: storage }).single("image");

// // post

// Add Post
router.post('/Add-post', authMiddleware, upload, async (req, res) => {
    try {
        console.log(req.body);
        console.log(req.file);

        const newPost = new Post({
            name: req.body.name,
            title: req.body.title,
            body: req.body.body,
            author: req.body.author,
            image: req.file.filename
        });
        await newPost.save();
        

            res.redirect('/blog');
    } catch (error) {
        console.log(error);
        // res.json({ message: err.message, type: 'danger' });
    }
});

/* 
**
*   const
image */





/* 
**
*   post
Add Blog */

// router.post('/Add-post', authMiddleware, async (req, res) => {
//     try {
//         console.log(req.body);
//         try {
//             const newPost = new Post({
//                 name: req.body.name,
//                 title: req.body.title,
//                 body: req.body.body,
//                 author: req.body.author,
//                 createAt: Date.now(),
//             });
//             await Post.create(newPost);
//             res.redirect('/blog');
//         } catch (error) {
//             console.log(error);
//         }
//     } catch (error) {
//         console.log(error);
//     }
// });


/* post
* *
*
Edit blog */

router.post('/Edit-blog/:id', authMiddleware, upload, async (req, res) => {
    const id = req.params.id;
    let new_image = "";

    if (req.file) {
        new_image = req.file.fieldname;
        try {
            fs.unlinkSync("./uploads" + req.body.old_image);
        } catch (err) {
            console.log(err);
        }
    } else {
        new_image = req.body.old_image;
    }

    try {
        const updatedPost = await Post.findByIdAndUpdate(id, {
            name: req.body.name,
            title: req.body.title,
            author: req.body.author,
            body: req.body.body,
            new_image: new_image,
            updateAt: Date.now()
        });

        if (!updatedPost) {
            res.status(404).json({ message: "Post not found", type: 'danger' });
            return;
        }

        req.session.message = {
            type: 'success',
            message: 'User updated successfully!',
        };
        res.redirect('/blog');
    } catch (err) {
        res.status(500).json({ message: err.message, type: 'danger' });
    }
});


// router.post('/Edit-blog/:id', authMiddleware, upload, async (req, res) => {
//     const id = req.params.id;
//     let new_image = "";

//     if (req.file) {
//         new_image = req.file.fieldname;
//         try {
//             fs.unlinkSync("./uploads" + req.body.old_image);
//         } catch (err) {
//             console.log(err);
//         }
//     } else {
//         new_image = req.body.old_image;
//     }
//     await Post.findByIdAndUpdate(id, {
//         name: req.body.name,
//         title: req.body.title,
//         author: req.body.author,
//         body: req.body.body,
//         new_image: new_image,
//         updateAt: Date.now()
//     }, (err, result) => {
//         if (err) {
//             res.json({ message: err.message, type: 'danger' });
//         } else {
//             req.session.message = {
//                 type: 'success',
//                 message: 'User updated successfully!',
//             };
//         }
//     });
//     res.redirect('/blog');
// });

/* Get 
* *
*
Edit blog */

router.get('/edit-blog/:id', authMiddleware, async (req, res) => {
    try {
        const locals = {
            title: "Edit Post",
            description: "Simple Blog"
        }
        const data = await Post.findOne({ _id: req.params.id });

        res.render('admin/edit', {
            locals,
            data,
            layout: AdminLayout,
        });
    } catch (error) {
        console.log(error);
    }
});


/* delete 
* *
*
delete blog */
router.post('/delete-blog/:id', authMiddleware, async (req, res) => {
    try {
        await Post.deleteOne({ _id: req.params.id });
        res.redirect('/blog');
    } catch (error) {
        console.log(error);
    }
});


module.exports = router;