const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User.js');
const Place = require('./models/Place.js');
const Booking = require('./models/Booking.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const imageDownloader = require('image-downloader');
const fs = require('fs');
const app = express();

const bcryptSalt = bcrypt.genSaltSync(10);
const jwtSecret = 'avgjfanvavfjkvfiavah';

app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static('C:/Users/Admin/Downloads/HTML DAY 5/react/clientapi/uploads'));
app.use(cors({
    credentials: true,
    origin: 'https://admirable-custard-e082d0.netlify.app',
  }));


mongoose.connect(process.env.MONGODB_URL);

function getUserDataFromToken(req) {
    return new Promise((resolve,reject) => {
        jwt.verify(req.cookies.token, jwtSecret, {},  async (err,userData)=>{
            if (err) throw err;
            resolve(userData);
        });
    });
}

app.get('/test', (req,res) =>{
    res.json('test ok');
});

app.post('/login', async(req,res) =>{
    const {email,password} = req.body;
    const userDoc = await User.findOne({email});
    if(userDoc){
        const passOk = bcrypt.compareSync(password, userDoc.password)
        
        if (passOk){
            jwt.sign({email:userDoc.email, id:userDoc._id}, jwtSecret ,{},(err,token)=>{
                if(err) throw err;
                res.cookie('token',token).json(userDoc);
                console.log(token,userDoc,cookie)
            });
        }
        else{
            res.status(422).json('pass not ok');
        }
    }
    else{
        res.json('not found');
    }
    });


app.post('/register', async (req,res) =>{
    const {name,email,password} = req.body;
    try {
        const userDoc = await User.create({
            name,
            email,
            password:bcrypt.hashSync(password, bcryptSalt),
        })
        res.json(userDoc);
    } catch (e) {
        res.status(422).json(e);
    }
});


app.get('/profile',(req,res)=>{
    const {token} = req.cookies;
    if(token){
        jwt.verify(token, jwtSecret, {},  (err,userData)=>{
            if(err) throw (err);
            res.json(userData);
        });
    }else{
        res.json(null);
    }
    res.json({token});
});

app.post('/logout', (req,res)=>{
    res.cookie('token','').json(true);
});

app.post('/uploadbylink', async (req,res) => {
    const {link} = req.body;
    const dirname = 'C:/Users/Admin/Downloads/HTML DAY 5/react/clientapi'
    const newname = 'photo' + Date.now() + '.jpg';
    await imageDownloader.image({
        url: link,
        dest: dirname + '/uploads/' + newname,
    });
    res.json(newname);
});

app.post('/places' , (req,res) =>{
    const {token} = req.cookies;
    const {
        title,address,addedPhotos,description,
        extraInfo,checkIn,checkOut,maxGuests,price,
    } = req.body;
    jwt.verify(token, jwtSecret, {},  async (err,userData)=>{
        if(err) throw (err);
        const placeDoc = await Place.create({
            owner: userData.id,
            title,address,photos:addedPhotos,description,
            extraInfo,checkIn,checkOut,maxGuests,price,
        });
        res.json(placeDoc);
    });
    
});

app.get('/places', (req,res) =>{
    const {token} = req.cookies;
    jwt.verify(token, jwtSecret, {},  async (err,userData)=>{
        const {id} = userData;
        console.log({id}, id);
        res.json(await Place.find({owner:id}));
    });
});

app.get('/places/:id', async (req,res) => {
    const {id} = req.params;
    res.json(await Place.findById(id));
});

app.get('/allplaces', async (req,res) => {
    res.json(await Place.find());
})

app.post('/bookings', async (req,res) => {
    const userData = await getUserDataFromToken(req);
    const {
        place,checkIn,checkOut,numberofGuests,name,phone,price,
    } = req.body;
    const bookingDoc = await Booking.create({
        place,checkIn,checkOut,numberofGuests,name,phone,price,
        user:userData.id,
    });
    res.json(bookingDoc);
    console.log(bookingDoc)
})



app.get('/bookings', async (req,res) => {
    const userData = await getUserDataFromToken(req);
    res.json(await Booking.find({user:userData.id}).populate('place'));
});

app.listen(8000); 