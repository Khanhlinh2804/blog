const express = require('express');
const app = express();
const cors = require('cors');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const { default: mongoose } = require('mongoose');
const User = require('./models/User');
const Place = require('./models/Place');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const imageDownloader = require('image-downloader');
const multer = require('multer');
const fs = require('fs');

app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(__dirname + '/uploads'));

const bcryptSalt = bcrypt.genSaltSync(10);
const jwtSecret = 'jwtSecretString'
app.use(cors({
    credentials: true,
    origin: 'http://localhost:5173',

}));

mongoose.connect(process.env.MONGO_URL)

app.get('/test', (req, res) => {
    res.json('test');
})


// USER MANAGEMENT
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const userDoc = await User.create({
            username,
            email,
            password: bcrypt.hashSync(password, bcryptSalt),
        })
        res.json(userDoc.password);
    } catch (e) {
        res.status(422).json(e);
    }
})

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const userDoc = await User.findOne({ email });
    if (userDoc) {
        console.log(userDoc.password);
        const passCheck = bcrypt.compareSync(password, userDoc.password);
        if (passCheck) {
            jwt.sign({ email: userDoc.email, id: userDoc._id, username: userDoc.username }, jwtSecret, {}, (err, token) => {
                if (err) throw err;
                res.cookie('token', token).json(userDoc);
            })
        } else {
            return res.status(422).json('pass not ok');
        }
    } else {
        res.status(422).json('not found');
    }
})

app.get('/profile', (req, res) => {
    const { token } = req.cookies;
    if (token) {
        jwt.verify(token, jwtSecret, {}, async (err, userData) => {
            if (err) throw err;
            const { username, email, _id } = await User.findById(userData.id);
            res.json({ username, email, _id });
        })
    } else {
        res.json(null)
    }
})

app.post('/logout', (req, res) => {
    res.cookie('token', '').json(true);
})

// PLACE MANAGEMENT
app.post('/upload-by-link', async (req, res) => {
    const { link } = req.body;
    const newName = 'photo' + Date.now() + '.jpg';
    try {
        await imageDownloader.image({
            url: link,
            dest: __dirname + '/uploads/' + newName
        })
        res.json(newName);
    }
    catch (err) {
        console.log(err);
        res.status(400).json('failed');
    }
})

const photoMiddleware = multer({ dest: 'uploads/' });

app.post('/upload', photoMiddleware.array('photos', 100), (req, res) => {
    const uploadedFiles = [];
    for (let i = 0; i < req.files.length; i++) {

        const { path, originalname } = req.files[i];
        const parts = originalname.split('.');
        const ext = parts[parts.length - 1];
        const newPath = path + '.' + ext;

        fs.renameSync(path, newPath);
        uploadedFiles.push(newPath.replace('uploads\\', ''));
    }
    res.json(uploadedFiles);
})

app.post('/places', (req, res) => {
    const { token } = req.cookies;
    const { title, address, addedPhotos, description, perks, notes, checkIn, checkOut, maxGuests } = req.body;
    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
        if (err) throw err;
        const placeDoc = await Place.create({
            owner: userData.id, title, address, photos: addedPhotos, description, perks, notes, checkIn, checkOut, maxGuests,
        });
        res.json(placeDoc)
    })

})

app.get('/places', (req, res) => {
    const { token } = req.cookies;
    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
        const { id } = userData;
        res.json(await Place.find({ owner: id }));
    })
})

app.get('/places/:id', async (req, res) => {
    const { id } = req.params;

    res.json(await Place.findById(id));
})

app.put('/places/', async (req, res) => {
    const { token } = req.cookies;
    const { id, title, address, addedPhotos, description, perks, notes, checkIn, checkOut, maxGuests } = req.body;


    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
        if (err) throw err;
        const placeDoc = await Place.findById(id);
        if (userData.id == placeDoc.owner.toString()) {
            placeDoc.delete({ title, address, photos: addedPhotos, description, perks, notes, checkIn, checkOut, maxGuests, });
            await placeDoc.save();
            res.json('okay');
        }
    })
})

app.listen(4000);


<%  if ({ success }) { %>
        <div class="alert alert-success alert-dismissible fade show" role="alert">
            <%= message.success %>
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
        </div>
    <% } else if ({ danger }) { %>
        <div class="alert alert-danger alert-dismissible fade show" role="alert">
            <%= message.danger %>
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
        </div>
    <% } %>