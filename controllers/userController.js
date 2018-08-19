const _ = require ('lodash/core')
const mongoose = require('mongoose')
const User = mongoose.model('users');

class UserController {
    constructor(){

    }

    async deleteUsers(req, res) {

        let ar = []
        let ret = await Promise.all( _.map(req.query, async (user_id) => {
            console.log("delete users: ", user_id)
            try{
                let user = await User.findByIdAndDelete(user_id)
                if(user) 
                    return ({id: user._id, status: true, message: `Usuário '${user.username}' excluido com sucesso!`});
                else {
                    return ({id: user_id, status: false, message: `Usuário com o id '${user_id}' não existe!`});
                }
            }
            catch(err){
                console.log("\n\n\nErro ao excluir: ", err, "\n\n\n\n");
                
                return ({id: user_id, status: false, message: `Houve um problema ao excluir o usuário com o id '${req.params.id}`});
            }
            
        }) )

        

        res.status(200).json({action:"remove", return: ret});
    }

    async deleteUser(req, res) {

        console.log("vai deletar o user");
        try{
            let user = await User.findByIdAndDelete(req.params.id);
            if(user) {
                console.log("o user existe e foi excluido: ", user);
                res.status(200).json({action: 'remove', return: [{id: user._id, status: true, message: `Usuário '${user.username}' excluido com sucesso!`}]});
            }
            else {
                console.log("o user não existe e não foi excluido: ", user);
                res.status(200).json({action: 'remove', return: [{id: user._id, status: true, message: `Usuário com o id '${req.params.id}' não existe!`}]});
            }
        }
        catch(err){
            console.log("\n\n\nErro ao excluir: ", err, "\n\n\n\n");
            res.status(500).json("Houve um problema ao excluir o usuário");
        }
    }

    async edit(req, res){
        if(req.body.username == 'erro'){
            res.status(400).json("meu erro não vai cadastrar")
            return;
        }

        const user = await User.findById(req.params.id)
        try{
            user.set(req.body)
            let res_user = await user.save()
            //res_user.mensagem = `Usuário ${res_user.username} editado com sucesso!`
            let obj_ret = {obj: res_user, message: `Usuário ${res_user.username} editado com sucesso!`}
            res.status(200).json(obj_ret)

            //const users =await User.find({})
            //res.status(200).json(users)

            //res.status(200).json(`Usuário ${res_user.username} editado com sucesso!`)

            
        }
        catch(err){
            console.log("\n\n\nerrors: ", err, "\n\n\n");
            res.status(400).json(err.errors)
        }
    }

    async view(req, res){
        const users =await User.findById(req.params.id)
        console.log(users);
        res.json(users)
    }

    async viewAll(req, res){
        const users =await User.find({})
        console.log(users);
        res.json({users: users})
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