const _ = require ('lodash/core');
const mongoose = require('mongoose');
const User = mongoose.model('users');
const path = require('path');
const fs = require('fs');
const appRoot = require('app-root-path');
class UserController {
    constructor(){

    }

    async view(req, res){
        const users =await User.findById(req.params.id)
        console.log(users);
        res.json(users)
    }

    async viewImage(req, res){
        const users =await User.findById(req.params.id)
        console.log(users);
        //res.sendFile('/uploads/' + uid + '/' + file);
        res.sendFile(path.dirname(require.main.filename) + "/" + JSON.parse(users.image).path);
        //res.json(JSON.parse(users.image).path)
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

    async updateField(req, res) {
        console.log("\n\n\no body aqui: ", req.body);
        const user = await User.findById(req.body.id)
        try{
            user[req.body.field] = req.body.value;
            let res_user = await user.save()
            let obj_ret = {obj: res_user, message: `Usuário ${res_user.username} editado com sucesso!`}
            res.status(200).json(obj_ret)
        }
        catch(err){
            res.status(400).json(err.errors)
        }
        
    }

    async edit(req, res){
        if(req.body.username == 'erro'){
            res.status(400).json("meu erro não vai cadastrar")
            return;
        }
        
        console.log("o body no edit: ", req.body, "\n\n\n");

        const user = await User.findById(req.params.id)
        try{
            this.deleteImages(req, user);
            await this.prepareImages(req, );
            

            user.set(req.body)
            let res_user = await user.save()
            //res_user.mensagem = `Usuário ${res_user.username} editado com sucesso!`
            let obj_ret = {obj: res_user, message: `Usuário ${res_user.username} editado com sucesso!`}
            res.status(200).json(obj_ret)
            
        }
        catch(err){
            res.status(400).json(err.errors)
        }
    }

    

    async add(req, res, next) {

        console.log('body: ', req.body, "\n\n\n");
        console.log('files: ', req.files, "\n\n\n");
        
        try{
            
            let user = new User();
            user.set(req.body)
            let res_user = await user.save()
            
            await this.prepareImages(req, res_user);
            res_user.set(req.body);
            console.log('body no try: ', req.body, "\n\n\n");
            await res_user.save()
            
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
    
    async deleteImages(req, user){
        
        if(req.files.length > 0 ){
            let imgs = await this.getAllImagesFields();

            imgs.map(img => {
                //console.log("\n\nbody::::::", req.body[img.path][]);
                if(req.body[img.path]){
                    //console.log(user[])

                    fs.unlink( JSON.parse(user[img.path]).path, err => {
                        if(err)
                            console.log(err);
                        else
                            console.log("arquivo excluido com sucesso")

                    })
                }
            })

            /* req.files.map(file => {

   
            }) */
    
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

    async prepareImages(req, user) {
        let imgs = await this.getAllImagesFields();

        if(imgs.length > 0){
            if(imgs.length == 1){
                console.log("arquivos: ", req.files[0]);
                req.body[imgs.path] = JSON.stringify(req.files[0]);
            }
            else {
                await imgs.map(async (img,i) => {
                    //if(req.files[i] && req.files[i] != undefined) {
                    if(req.body[img.path] !== undefined ) {

                        await req.files.map(async file => {
                            if(img.path && req.body[img.path] == file.originalname){
                                await this.moveImage(file, req, img.path);
                                console.log("\n\n\nbody no prepare images: ", req.body);
                            }
                        })
                    }
                })
            }
        }
    }

    async moveImage(file, req, db_field){
        let dt = new Date();
        let year = dt.getFullYear()
        let year_month = dt.getFullYear() + "/" + (dt.getMonth() + 1)
        let new_path = file.path.replace("uploads/", `uploads/${req.body.resource}/${year_month}/`)

        if (! fs.existsSync(`uploads/${req.body.resource}/${year_month}`)) {
            if (! fs.existsSync(`uploads/${req.body.resource}/`)) {
                console.log("vai criar o diretorio upload user resource");
                fs.mkdirSync(`${appRoot}/uploads/${req.body.resource}/`)
            }
            
            if (! fs.existsSync(`uploads/${req.body.resource}/${year}`)) {
                console.log("vai criar o diretorio upload user resource year");
                fs.mkdirSync(`${appRoot}/uploads/${req.body.resource}/${year}`)
            }

            if (! fs.existsSync(`uploads/${req.body.resource}/${year_month}`)) {
                console.log("vai criar o diretorio upload user resource year mes");
                fs.mkdirSync(`${appRoot}/uploads/${req.body.resource}/${year_month}`)
            }
        }

        console.log("oooo file: ", file);

        if(!fs.existsSync(new_path)) {
            fs.renameSync(file.path, new_path);
        }
        else{
            new_path = new_path.replace('.','_1.');
            
            if(!fs.existsSync(new_path)) {
                    fs.renameSync(file.path, new_path);
            }
            else {
                new_path = new_path.replace('_1','_2');
                
                if(!fs.existsSync(new_path)) {
                    fs.renameSync(file.path, new_path);
                }
            }
        }
        

        file.path = new_path;

        req.body[db_field] = JSON.stringify(file);
        console.log("\n\n\nbody movefile: ", req.body);
        
    }

    async getAllImagesFields(){
        try {
            let fields = await User.schema.paths;
            //Não posso deletar pois buga o mongo depois
            let new_fields = await Promise.all(_.filter(fields, field => {
                return field.options.image
            }))
            
            return (new_fields);

        }
        catch(err){
            return err;
        }
    }
}

module.exports = new UserController