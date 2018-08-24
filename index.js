const express = require('express');
var bodyParser = require('body-parser');
const mongoose = require('mongoose');
const keys = require('./config/keys');
var multer  = require('multer')
var path = require('path')





var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        console.log("\n\n\n\nrequest body", req.body, "\n\n\n");
        if(req.body.resource && req.body.resource != undefined && req.body.resource != ''){
            let upload_dir = path.dirname(require.main) + "/uploads/" + req.body.resource;
            console.log("uploaddir: ", upload_dir);
            fs.exists(upload_dir, function(exists) {
                if(exists){
                    console.log("\n\n\nexiste o upload dir vai cadastrar aqui: \n\n\n");
                    cb(null, `${req.body.resource}/` + Date.now() +  path.extname(file.originalname)) 
                }
                else{
                    console.log("\n\nnão existe\n\n");
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


app.post("/users", upload.single('files'), (req, res) => {

    console.log("request: ", req.file);
    console.log("request body: ", req.body);
    res.status(200).json(`Usuário ehehehhe!`);

} )

//Routes
require('./routes/userRoutes')(app,upload)



const PORT = process.env.PORT || 3001;
console.log("listening on port http://localhost:" + PORT);
app.listen(PORT);