const mongoose = require('mongoose');

const { Schema } = mongoose;

const userSchema = new Schema ({
    username: {type: String, required: true},
    first_name: {type: String, required: "Primeiro nome é obrigatório"},
    last_name: {type: String, required: false},
}) 


mongoose.model('users', userSchema);