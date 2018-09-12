const express = require('express');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const passport = require('passport');
const mongoose = require('mongoose');
const keys = require('./config/keys');
const multer  = require('multer');
const path = require('path');
const fs = require('fs');

require('./models/User');
require("./services/passport"); //we don't assign to nothing because we just wanna to execute the code into passport.js





var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null,  file.originalname ) 
    }
})
  
var upload = multer({ storage: storage });

require('./models/User');


mongoose.connect(keys.mongoURI);


const app = express();

var cors = require('cors');


// use it before all route definitions
app.use(cors({origin: 'http://localhost:3000'}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
    cookieSession({
        maxAge: 30 * 24 * 60 * 60 * 1000,
        keys: [keys.cookieKey]
    })
)

app.use(passport.initialize());
app.use(passport.session());


/* app.post("/users", upload.single('files'), (req, res) => {

    console.log("request: ", req.file);
    console.log("request body: ", req.body);
    res.status(200).json(`Usuário ehehehhe!`);

} ) */

//Routes
require('./routes/userRoutes')(app,upload);
require('./routes/authRoutes')(app, passport);
require('./routes/imageRoutes')(app);


const PORT = process.env.PORT || 3001;
console.log("listening on port http://localhost:" + PORT);
app.listen(PORT);