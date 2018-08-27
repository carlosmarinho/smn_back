const express = require('express');
var bodyParser = require('body-parser');
const mongoose = require('mongoose');
const keys = require('./config/keys');
var multer  = require('multer')
var path = require('path')
const fs = require('fs');




var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        
        if(req.body.resource && req.body.resource != undefined && req.body.resource != ''){
            let upload_dir = path.dirname(require.main.filename) + "/uploads/" + req.body.resource;
            fs.exists(upload_dir, function(exists) {
                if(exists){
                    cb(null, `${req.body.resource}/` + Date.now() +  path.extname(file.originalname)) 
                }
                else{
                    cb(null, Date.now() +  path.extname(file.originalname)) 
                }
            })
        }
        else {
            cb(null,  Date.now() +  path.extname(file.originalname)) 
        }

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


/* app.post("/users", upload.single('files'), (req, res) => {

    console.log("request: ", req.file);
    console.log("request body: ", req.body);
    res.status(200).json(`Usuário ehehehhe!`);

} ) */

//Routes
require('./routes/userRoutes')(app,upload)
require('./routes/imageRoutes')(app)


const PORT = process.env.PORT || 3001;
console.log("listening on port http://localhost:" + PORT);
app.listen(PORT);