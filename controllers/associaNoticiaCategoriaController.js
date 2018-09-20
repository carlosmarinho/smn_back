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

class associaNoticiaCategoriaController {
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
        let stripe_noticias = await this.getNoticias(jwt.data.jwt)
        console.log('stripe_noticias: ', stripe_noticias.data);

        stripe_noticias.data.map(noticia => {
            this.findMysqlNoticia(noticia, async noticia_cb => {

                if(noticia_cb.length > 0){

                    try {
                            console.log("Noticia::::: ", noticia_cb);

                            let categories = [] 
                            await Promise.all(noticia_cb.map(async news => {
                                let cat =  await this.getCategoryByWpid(jwt.data.jwt, news.term_id)
                                if(cat.data.length > 0)
                                    categories.push(cat.data[0]);
                            }))

                        if(categories.length == 0 )
                            return;


                        let obj = {
                            categorias: categories,
                            imported_category: true
                        }

                        console.log("o objeto: ", obj);

                        let assoc = await this.updateStrypeAssociacao(jwt.data.jwt, noticia._id, obj);

                        let update = `UPDATE nkty_term_relationships set imported = 1 where object_id = ${noticia_cb[0].ID} AND term_taxonomy_id = ${noticia_cb[0].term_taxonomy_id}`;
                        console.log("\n\n\nupdate: ", update)
                        
                        conn.query(update, err => {
                            if(err)
                                console.log('o post de id ', noticia_cb[0] , ' não foi marcado como importado \nErro:', err)
                        });

                    } catch (e) {
                    console.error("\n\n", e)
                    }

                }
            } )
        }) 

        res.json("Importação finalizada com sucesso");
        
    }

    
    getNoticiaByTermid(jwt, noticias, term_id) {
    //    let noticias = await this.getNoticias(jwt)

        //console.log("meus noticias: ", noticias);

        return noticias.filter(noticia => {
            //console.log(noticia.noticianame , " --- ", noticianame)
            if(noticia.wpid == term_id)
                return noticia;
        })
    }

    async updateStrypeAssociacao(jwt, noticia_id, obj){
        let config = { headers: { 'Authorization': `Bearer ${jwt}` } };
        
        //console.log("\n\nconfig: ", config);
        try{
            let ret = await axios.put(`http://localhost:1337/noticia/${noticia_id}`, obj, config);
            return ret;
        }
        catch(e){
            console.log("\n\n\n error: ", e);
        } 
    }

    async insertStrypeNoticia(jwt, noticia){
        let config = { headers: { 'Authorization': `Bearer ${jwt}` } };
        
        //console.log("\n\nconfig: ", config);
        try{
            let ret = await axios.post('http://localhost:1337/noticia', noticia, config);
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

    async getNoticias(jwt){
        let config = { headers: { 'Authorization': `Bearer ${jwt}` } };
        
        //console.log("\n\nconfig: ", config);
        try{
            let ret = await axios.get('http://localhost:1337/noticia?imported_category=false&_start=0&_limit=100',  config);
            return ret;
        }
        catch(e){
            console.log("\n\n\n error: ", e);
        }
    }

    findMysqlNoticia(noticia, cb){

        //console.log("\n\n\n Noticia: ", noticia);

        let sql = ` select p.ID, p.post_title, t.term_id, t.name, t.slug, tt.taxonomy, tt.term_taxonomy_id
        FROM nkty_posts p
        inner join nkty_term_relationships tr on p.ID = tr.object_id
        inner join nkty_term_taxonomy tt on tr.term_taxonomy_id = tt.term_taxonomy_id and tt.taxonomy = 'category'
        inner join nkty_terms t on t.term_id = tt.term_id
        where t.name != 'Uncategorized' and tr.imported = 0
        and p.ID = ${noticia.wpid}`

        console.log("\n\n", sql, "\n\n\n")
        mysqlJson.query( sql, (error, noticia) => {
            
        if(!error){
                cb(noticia);
            }
            else{
                console.log("erro: ", error);
            }
        })
        
    }

}

module.exports = new associaNoticiaCategoriaController