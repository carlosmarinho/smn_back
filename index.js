const express = require('express');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const multer  = require('multer');
const path = require('path');
const fs = require('fs');


const app = express();

var cors = require('cors');


// use it before all route definitions
app.use(cors({origin: 'http://localhost:3000'}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cookieSession({
    name: 'session',
    keys: ["key1"],

    // Cookie Options
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))


/* app.post("/users", upload.single('files'), (req, res) => {

    console.log("request: ", req.file);
    console.log("request body: ", req.body);
    res.status(200).json(`Usuário ehehehhe!`);

} ) */

//Routes
require('./routes/userRoutes')(app);


const PORT = process.env.PORT_SMN_BACK_INDEX || process.env.PORT || 3001;
console.log("listening on port http://localhost:" + PORT);
app.listen(PORT);
