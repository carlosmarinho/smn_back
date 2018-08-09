const express = require('express');
var bodyParser = require('body-parser');
const mongoose = require('mongoose');
const keys = require('./config/keys');
require('./models/User');


mongoose.connect(keys.mongoURI);


const app = express();

var cors = require('cors');

// use it before all route definitions
app.use(cors({origin: 'http://localhost:3000'}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

//Routes
require('./routes/userRoutes')(app)



const PORT = process.env.PORT || 3001;
console.log("listening on port http://localhost:" + PORT);
app.listen(PORT);