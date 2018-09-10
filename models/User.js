const mongoose = require('mongoose');
const beautifyUnique = require('mongoose-beautiful-unique-validation');
const {isEmail} = require('validator');

const { Schema } = mongoose;

const userSchema = new Schema ({
    image: {type: String, image:true, featured: true},
    username: {type: String, required: true, unique: "Username '{VALUE}' já está em uso. Favor escolher outro!"},
    password: {type: String, inputForm: 'password'},
    email: {type: String, required: true, unique: "Email '{VALUE}' já está cadastado!", validate: [ isEmail, 'Email inválido' ]},
    first_name: {type: String, required: "Primeiro nome é obrigatório"},
    last_name: {type: String, required: false},
    age: {type: Number, min: [18, "Você deve ser maior de 18 anos"], max: [80, "você não deve ser maior que 80 anos"] },
    information: {type: String, inputForm: 'quill'},
    
    type: {type: String, enum: ['administrador', 'editor', 'usuário'], default: 'usuário'},
    status: {type: Boolean, default: true},
    
    //information1: {type: String, inputForm: 'quillBig'}, modify widht of quill
    //information2: {type: String, inputForm: 'quillSmall'},

    //Se quiser o valor não ser obrigatório coloque o campo ''
    //type: {type: String, enum: ['', 'administrador', 'editor', 'usuário'], default: 'usuário'},

    //Se eu quiser formar o tipo que o elemento vai ser no formulário é só usar o campo inputForm
    //type: {type: String, enum: ['administrador', 'editor', 'usuário'], default: 'user', inputForm: 'radio'},
    //status: {type: Boolean, inputForm: 'select'},
}) 

userSchema.plugin(beautifyUnique);
mongoose.model('users', userSchema);