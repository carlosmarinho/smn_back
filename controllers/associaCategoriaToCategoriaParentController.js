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

class associaCategoriaToCategoriaParentController {
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
            if(categoria.wp_parent_id && categoria.wp_parent_id != 0)
            {
                console.log("vai achar o parent: ", categoria.nome + " --- " + categoria.wp_parent_id)
                let stripe_categorias1 = await this.getCategorias(jwt.data.jwt)

                let cat = this.getCategoriaByParentWpId(stripe_categorias1.data, categoria.wp_parent_id)
                console.log("cat[0]: ", cat[0]);
                if(cat[0]){
                    let new_cat = {parent_id: cat[0]._id}
                    console.log("\n\n Categoria ", cat[0].nome, " ------> categoria pai: ", categoria.nome , "\n");
                    await this.updateStrypeCategory(jwt.data.jwt, categoria._id, new_cat)
                }
            }

        }) 

        res.json("Importação finalizada com sucesso");
        
    }

    
    getCategoriaByParentWpId(categorias, id) {
    //    let categorias = await this.getCategorias(jwt)

    
        return categorias.filter(categoria => {
            //console.log("minhas categorias: ", categoria.nome, " - ", categoria.wpid, " == ", id);
            if(categoria.wpid == id){
                console.log("vai retornar somente esta de id: ", id , "\n\n\n");
                return categoria;
            }
        })
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
            let ret = await axios.get('http://localhost:1337/categoria?parent_id=&_limit=500',  config);
            return ret;
        }
        catch(e){
            console.log("\n\n\n error: ", e);
        }
    }

    async getCategorias(jwt){
        let config = { headers: { 'Authorization': `Bearer ${jwt}` } };
        
        //console.log("\n\nconfig: ", config);
        try{
            //let ret = await axios.get('http://localhost:1337/categoria?imported_category=false&_start=0&_limit=100',  config);
            let ret = await axios.get('http://localhost:1337/categoria?_limit=500',  config);
            return ret;
        }
        catch(e){
            console.log("\n\n\n error: ", e);
        }
    }

    findMysqlCategoria(categoria, cb){

        //console.log("\n\n\n Categoria: ", categoria);

        let sql = ` select p.ID, p.post_title, t.term_id, t.name, t.slug, tt.taxonomy, tt.term_taxonomy_id
        FROM nkty_posts p
        inner join nkty_term_relationships tr on p.ID = tr.object_id
        inner join nkty_term_taxonomy tt on tr.term_taxonomy_id = tt.term_taxonomy_id and tt.taxonomy = 'category'
        inner join nkty_terms t on t.term_id = tt.term_id
        where t.name != 'Uncategorized' and tr.imported = 0
        and p.ID = ${categoria.wpid}`

        console.log("\n\n", sql, "\n\n\n")
        mysqlJson.query( sql, (error, categoria) => {
            
        if(!error){
                cb(categoria);
            }
            else{
                console.log("erro: ", error);
            }
        })
        
    }

}

module.exports = new associaCategoriaToCategoriaParentController