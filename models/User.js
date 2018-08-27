const mongoose = require('mongoose');
const beautifyUnique = require('mongoose-beautiful-unique-validation');

const { Schema } = mongoose;

const userSchema = new Schema ({
    image: {type: String, image:true},
    username: {type: String, required: true, unique: "Username '{VALUE}' já está em uso. Favor escolher outro!"},
    first_name: {type: String, required: "Primeiro nome é obrigatório"},
    last_name: {type: String, required: false},
    age: {type: Number, min: [18, "Você deve ser maior de 18 anos"], max: [80, "você não deve ser maior que 80 anos"] }
}) 

userSchema.plugin(beautifyUnique);
mongoose.model('users', userSchema);