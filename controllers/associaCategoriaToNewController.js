const {ObjectId} = require('mongodb');
const _ = require ('lodash/core');
const slugify = require('slugify')
const download = require('image-downloader')
const MysqlJson = require('mysql-json');
const imageInfo = require('image-info');
const path = require("path");
const uuid = require('uuid/v4');
const mysql = require('mysql');

const mysql_con = {
    host:'127.0.0.1',
    user:'root',
    password:'carlos',
    database:'niteroi'
}

const mysqlJson = new MysqlJson(mysql_con);

const conn = mysql.createConnection(mysql_con);

const axios = require('axios');

class associaCategoriaToNewController {
    constructor(){

    }

    viewAll(req, res){

    }

    async authenticate(){
        let ret = await axios.post('http://localhost:1337/auth/local', { identifier: 'adm_manager', password: 'carlos' })
        
        return ret;
    }

    async migrate(req, res){

        let jwt = await this.authenticate();
        //console.log("jwt: ", jwt.data.jwt);
        let stripe_categorias = await this.getCategoriasToUpdate(jwt.data.jwt)
        //console.log('stripe_categorias: ', stripe_categorias.data);

         stripe_categorias.data.map( async categoria => {
                let hasOneService = categoria.guias.some(guia => {
                    return guia.tipo == 'guia de serviços';
                })

                if(hasOneService){
                    let newCat = categoria;
                    newCat.slug = newCat.slug.replace('comercial','servicos');
                    newCat.guias = [];
                    console.log("\n\n\n Categoria a ser inserida é: ", newCat);
                }

                //this.insertStrypeCategoria(jwt.data.jwt);

            /* if(cat[0]){
                let new_cat = {parent_id: cat[0]._id}
                console.log("\n\n Categoria ", cat[0].nome, " ------> categoria pai: ", categoria.nome , "\n");
                await this.updateStrypeCategory(jwt.data.jwt, categoria._id, new_cat)
            }*/
        

        }) 

        res.json("Importação finalizada com sucesso");
        
    }

    
    async updateStrypeCategory(jwt, categoria_id, obj){
        let config = { headers: { 'Authorization': `Bearer ${jwt}` } };
        
        console.log("\n\nno strype update: ", categoria_id, 'obj: ', obj);
        //console.log("\n\nconfig: ", config);
        try{
            let ret = await axios.put(`http://localhost:1337/categoria/${categoria_id}`, obj, config);
            return ret;
        }
        catch(e){
            console.log("\n\n\n error: ", e);
        } 
    }

    async insertStrypeCategoria(jwt, categoria){
        let config = { headers: { 'Authorization': `Bearer ${jwt}` } };
        
        //console.log("\n\nconfig: ", config);
        try{
            let ret = await axios.post('http://localhost:1337/categoria', categoria, config);
            //console.log(ret);
            return ret;
        }
        catch(e){
            console.log("\n\n\n error: ", e);
        } 
    }

    async getCategoryByWpid(jwt, wpid){
        let config = { headers: { 'Authorization': `Bearer ${jwt}` } };
        //console.log(`\n\nPegando a categoria: http://localhost:1337/categoria?wpid=${wpid}`);
        //console.log("\n\nconfig: ", config);
        try{
            let ret = await axios.get(`http://localhost:1337/categoria?wpid=${wpid}`,  config);
            //console.log("\n\nretorno: ", ret);
            return ret;
        }
        catch(e){
            console.log("\n\n\n error: ", e);
        }
    }

    async getCategoriasToUpdate(jwt){
        let config = { headers: { 'Authorization': `Bearer ${jwt}` } };
        
        //console.log("\n\nconfig: ", config);
        try{
            //let ret = await axios.get('http://localhost:1337/categoria?imported_category=false&_start=0&_limit=100',  config);
            let ret = await axios.get('http://localhost:1337/categoria?tipo=guia comercial&_limit=500',  config);
            return ret;
        }
        catch(e){
            console.log("\n\n\n error: ", e);
        }
    }

    async getCategoriasByName(jwt, name){
        let config = { headers: { 'Authorization': `Bearer ${jwt}` } };
        
        //console.log("\n\nconfig: ", config);
        try{
            //let ret = await axios.get('http://localhost:1337/categoria?imported_category=false&_start=0&_limit=100',  config);
            let ret = await axios.get(`http://localhost:1337/categoria?nome=${name}_&tipo=guia serviço&_limit=1`,  config);
            return ret;
        }
        catch(e){
            console.log("\n\n\n error: ", e);
        }
    }

}

module.exports = new associaCategoriaToNewController