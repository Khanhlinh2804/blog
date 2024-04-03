require('dotenv').config();

const express = require('express');
const expressLayout = require('express-ejs-layouts');
// const methodOverride = require('method-override');

const cookieParser = require('cookie-parser');
const MongoStore = require('connect-mongo');

const connectDB = require('./server/config/db');
const session = require('express-session');

const multer = require('multer');

const app = express();
const PORT = 5000 || process.env.PORT;


// const uploads = multer({})



// connect to db 

connectDB();



app.use(express.urlencoded({ extended: true}));
app.use(express.json());
app.use(cookieParser());
// app.use(methodOverride('_method'));

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
        mongoUrl: process.env.URI
    }),
}));
app.use(express.static("upload"));

app.use(express.static('public'));

// app.locals.isActiveRoute = isActiveRoute; 

// Templating Engine 
app.use(expressLayout);
app.set('layout','./layouts/main');
app.set('view engine', 'ejs');


// router 
app.use('/',require('./server/routes/main'));
app.use('/',require('./server/routes/admin'));
// app.use('/',require('./server/routes/Ls'));

app.get('', (req, res) => {
    res.send("I can do it");
});

app.listen(PORT, ()=>{
    console.log(`Running ${PORT} `);
});

