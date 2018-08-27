const _ = require ('lodash/core')
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
        const users =await User.find({}).sort({_id: -1})
        console.log(users);
        res.json({users: users})
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
                res.status(200).json({action: 'remove', return: [{id: user._id, status: true, message: `Usuário '${user.username}' excluido com sucesso!`}]});
            }
            else {
                res.status(200).json({action: 'remove', return: [{id: user._id, status: true, message: `Usuário com o id '${req.params.id}' não existe!`}]});
            }
        }
        catch(err){
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
            res.status(400).json(err.errors)
        }
    }



    async add(req, res, next) {

        console.log('body: ', req.body, "\n\n\n");
        console.log('files: ', req.files, "\n\n\n");
        
        try{
            let imgs = await this.getAllImagesFields();

            if(imgs.length > 0){
                if(imgs.lenght == 1){
                    req.body[imgs.path] = JSON.stringify(req.files[0]);
                }
                else {
                    imgs.map((img,i) => {

                        if(req.files[i] && req.files[i] != undefined) {
                            req.body[img.path] = JSON.stringify(req.files[i]);
                        }
                    })
                }
            }

            console.log("\n\n\nnovo body: ", req.body);

            let user = new User(req.body);
            let res_user = await user.save();
            
            res.status(200).json(`Usuário ${res_user.username} cadastrado com sucesso!`);
        }
        catch(err){
            console.log("\n\n\ndeu ruim: ", err);
            if(err.errors)
                res.status(400).json(err.errors)
            else{
                res.status(500).json("Houve um erro ao cadastrar o usuário!");
                console.log(err)
            }
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

    async getAllImagesFields(req, res){
        try {
            //console.log("aqui no getAllfields");
            let fields = await User.schema.paths;
            //Não posso deletar pois buga o mongo depois
            let new_fields = await Promise.all(_.filter(fields, field => {
                return field.options.image
            }))
            

            return (new_fields);

        }
        catch(err){
            console.log(err);
            return err;
        }
    }
}

module.exports = new UserController