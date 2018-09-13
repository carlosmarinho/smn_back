const {ObjectId} = require('mongodb');
const _ = require ('lodash/core');
var slugify = require('slugify')
const MysqlJson = require('mysql-json');
const mysqlJson = new MysqlJson({
  host:'127.0.0.1',
  user:'root',
  password:'carlos',
  database:'niteroi'
});

const axios = require('axios');

class CategoriaNewsController {
    constructor(){

    }

    viewAll(req, res){

    }

    async authenticate(){
        let ret = await axios.post('http://localhost:1337/auth/local', { identifier: 'adm_manager', password: '3ngenhoc2' })
        
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
                if(has_category.length == 0){
                    if( this.insertCategory(jwt.data.jwt, category) )
                        console.log("categoria: ", category.name, " incluido com sucesso!");
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
                slug: slugify(category.name, {remove: /[*+~.()'"!:@]/g, lower: true}),
                slug_wp: category.slug,
                descricao: category.description,
                count: category.count
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
            console.log("\n\n\n error: ", e);
        } 
    }

    async getCategorys(jwt){
        let config = { headers: { 'Authorization': `Bearer ${jwt}` } };
        
        //console.log("\n\nconfig: ", config);
        try{
            let ret = await axios.get('http://localhost:1337/categoria/',  config);
            return ret;
        }
        catch(e){
            console.log("\n\n\n error: ", e);
        }
    }


    findMysqlCategorys(cb){
        let sql = "SELECT t.term_id, t.name, t.slug, tt.description, tt.count FROM nkty_terms t " +
        " INNER JOIN nkty_term_taxonomy tt ON t.term_id = tt.term_id AND tt.taxonomy = 'category' " +
        " WHERE t.term_id > 41 and t.term_id < 81 or t.term_id in (16,17)" 

        console.log("\n\n", sql, "\n\n\n")
        let category = mysqlJson.query( sql, (error, categorys) => {
            //console.log("aasdfsd: ", categorys)
            if(!error){
                cb(categorys);
            }
            else{
                console.log("erro: ", error);
            }
        })
        
    }
}

module.exports = new CategoriaNewsController