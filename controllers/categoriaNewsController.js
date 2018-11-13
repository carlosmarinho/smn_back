const {ObjectId} = require('mongodb');
const _ = require ('lodash/core');
var slugify = require('slugify')
const MysqlJson = require('mysql-json');
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

class CategoriaNewsController {
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
        let stripe_categorys = await this.getCategorys(jwt.data.jwt)
        
        console.log("minhas categorias: ", stripe_categorys.data, "\n\n");
        
        this.findMysqlCategorys(categorys => {
            let ar_categorys = categorys.map(category => {
                console.log("\ncategoria: ", category);
                let has_category = this.getCategoryByTermid(jwt.data.jwt, stripe_categorys.data, category.term_id)
                //console.log("\n\n\ncategory: ", category, " \n\n----\n\n  has category: ", has_category.length);
                if(has_category.length == 0) {
                    if( this.insertCategory(jwt.data.jwt, category) ){
                        console.log("categoria: ", category.name, " incluido com sucesso!");
                        let update = `UPDATE nkty_term_taxonomy set imported = 1 where imported = 0 and term_taxonomy_id = ${category.term_taxonomy_id}`;
                        console.log("\n\nUPDATE: ", update, "\n")
                        conn.query(update, err => {
                            if(err)
                                console.log('o post de id ', cat_cb[0] , ' não foi marcado como importado \nErro:', err)
                        });
                    }
                    else
                        console.log("ERRO: categoria: ", category.name, " não foi incluido!");
                }
                else
                        console.log("Categoria ", category.name, " já foi incluida!");

            }) 
            
        });
   

        res.json("Importação finalizada com sucesso");
        
    }

    async insertCategory(jwt, category){
        
        let obj = {
            wpid: category.term_id,
            nome: category.name,
            slug: "noticias/" + slugify(category.name, {remove: /[*+~.()'"!:@]/g, lower: true}),
            slug_wp: category.slug,
            descricao: category.description,
            count: category.count,
            tipo: 'notícia',
            wp_parent_id: category.parent,
        }    

        console.log("obj: ", obj)
        let ret = await this.insertStrypeCategory(jwt, obj);
        return ret;
    }

    getCategoryByTermid(jwt, categorys, term_id) {
    //    let categorys = await this.getCategorys(jwt)

        //console.log("meus categorys: ", categorys);

        return categorys.filter(category => {
            //console.log(category.categoryname , " --- ", categoryname)
            if(category.wpid == term_id)
                return category;
        })
    }

    async insertStrypeCategory(jwt, category){
        let config = { headers: { 'Authorization': `Bearer ${jwt}` } };
        
        //console.log("\n\nconfig: ", config);
        try{
            let ret = await axios.post('http://localhost:1337/categoria/', category, config);
            //console.log(ret);
            return ret;
        }
        catch(e){
            console.log("\n\n\n error insertstrypecategory: ", e.message);
        } 
    }

    async getCategorys(jwt){
        let config = { headers: { 'Authorization': `Bearer ${jwt}` } };
        
        //console.log("\n\nconfig: ", config);
        try{
            let ret = await axios.get('http://localhost:1337/categoria/?populateAssociation=false',  config);
            return ret;
        }
        catch(e){
            console.log("\n\n\n error getcategorys: ", e.message);
        }
    }


    findMysqlCategorys(cb){
        let sql = "SELECT tt.term_taxonomy_id, t.term_id, t.name, t.slug, tt.description, tt.parent, tt.count FROM nkty_terms t " +
        " INNER JOIN nkty_term_taxonomy tt ON t.term_id = tt.term_id AND tt.taxonomy = 'category' AND tt.imported = 0 " +
        " WHERE t.term_id >= 37 and t.term_id < 83 or t.term_id in (3,16,17,252,253,254)" 

        console.log("\n\n", sql, "\n\n\n")
        let category = mysqlJson.query( sql, (error, categorys) => {
            //console.log("aasdfsd: ", categorys)
            if(!error){
                cb(categorys);
            }
            else{
                console.log("erro findmysqlcategorys: ", error.message);
            }
        })
        
    }
}

module.exports = new CategoriaNewsController