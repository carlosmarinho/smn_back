const mongoose = require('mongoose')
const User = mongoose.model('users');

class UserController {
    constructor(){

    }

    async view(req, res){
        const users =await User.findById(req.params.id)
        console.log(users);
        res.json(users)
    }

    async viewAll(req, res){
        const users =await User.find({})
        console.log(users);
        res.json(users)
    }

    async add(req, res, next) {
        if(req.body.username == 'erro'){
            res.status(400).json("meu erro não vai cadastrar")
            return;
        }
        console.log('\n\n', req.body, "\n\n");
        let user = new User(req.body);
        try{
            console.log("deveria ter criado aqui");
            let res_user = await user.save()
            res.status(200).json(`Usuário ${res_user.username} cadastrado com sucesso!`)
        }
        catch(err){
            res.status(400).json(err.errors)
            console.log("Usuário não foi inserido", err)
        }
    }

    async getAllFields(req, res){
        try {
            //console.log("aqui no getAllfields");
            let fields = await User.schema.paths;
            //Não posso deletar pois buga o mongo depois
            //delete fields['_id'];
            //delete fields['__v'];
            res.json(fields);

        }
        catch(err){
            console.log(err);
            res.status(400).json("erro ao pegar os campos")
        }

    }
}

module.exports = new UserController