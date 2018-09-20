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

class NoticiaController {
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
        
        //console.log("minhas noticias: ", stripe_noticias.data, "\n\n");
        
        this.findMysqlNoticias(noticias => {
            let ar_noticias = noticias.map(noticia => {
                //console.log("\nnoticia: ", noticia);
                let has_noticia = this.getNoticiaByWpid(jwt.data.jwt, stripe_noticias.data, noticia.ID)
                //console.log("\n\n\nnoticia: ", noticia, " \n\n----\n\n  has noticia: ", has_noticia.length);
                if(has_noticia.length == 0){
                    if( this.insertNoticia(jwt.data.jwt, noticia) ) {
                        console.log("noticia: ", noticia.post_title, " incluido com sucesso!");
                        let update = `UPDATE nkty_posts set imported = 1 where post_type = 'post' and ID = ${noticia.ID}`;
                        console.log("\n\nUPDATE: ", update, "\n")
                        conn.query(update, err => {
                            if(err)
                                console.log('o post de id ', cat_cb[0] , ' não foi marcado como importado \nErro:', err)
                        });
                    }
                    else
                        console.log("ERRO: noticia: ", noticia.name, " não foi incluido!");
                }
                else
                        console.log("Categoria ", noticia.name, " já foi incluida!");

            }) 
            
        });
   

        res.json("Importação finalizada com sucesso");
        
    }

    async insertNoticia(jwt, noticia){
        let cidade = ObjectId("5ba26f813a018f42215a36a0");

        let obj = {
                wpid: noticia.ID,
                titulo: noticia.post_title,
                descricao: noticia.post_content,
                slug: noticia.slug,
                createdAt: noticia.post_date,
                updatedAt: noticia.post_modified,
                wp_user_id: noticia.post_author
            }    

        //console.log("obj: ", obj)
        let ret = await this.insertStrypeNoticia(jwt, obj);
        return ret;
    }

    getNoticiaByWpid(jwt, noticias, ID) {
    //    let noticias = await this.getNoticias(jwt)

        //console.log("meus noticias: ", noticias);

        return noticias.filter(noticia => {
            //console.log("\n ------------------------->>>>>>", noticia.wpid , " --- ", ID)
            if(noticia.wpid == ID)
                return noticia;
        })
    }

    async insertStrypeNoticia(jwt, noticia){
        let config = { headers: { 'Authorization': `Bearer ${jwt}` } };
        
        //console.log("\n\nconfig: ", config);
        try{
            let ret = await axios.post('http://localhost:1337/noticia/', noticia, config);
            //console.log(ret);
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
            let ret = await axios.get('http://localhost:1337/noticia/',  config);
            return ret;
        }
        catch(e){
            console.log("\n\n\n error: ", e);
        }
    }


    findMysqlNoticias(cb){


        let sql = "SELECT ID, post_author, post_title, post_content, post_name as slug, post_date, post_modified " +
        " FROM nkty_posts " +
        " WHERE imported = 0 and (post_status = 'publish' or post_status = 'published') and post_type = 'post' " +
        "   and ID in ( " +
        "       SELECT distinct( tr.object_id ) FROM nkty_term_relationships tr  " +
        "           inner join nkty_term_taxonomy tt on tt.term_taxonomy_id = tr.term_taxonomy_id " +
        "           inner join nkty_terms t on t.term_id = tt.term_id " +
        "           where (tt.term_id > 37 and tt.term_id < 82) or tt.term_id in (16,17,18) or tt.description like 'Bairro%'" +
        " ) order by ID asc limit 1000 ";
        //"  ) limit 100";

        console.log("\n\n", sql, "\n\n\n")
        let noticia = mysqlJson.query( sql, (error, noticias) => {
            //console.log("aasdfsd: ", noticias)
            if(!error){
                cb(noticias);
            }
            else{
                console.log("erro: ", error);
            }
        })
        
    }
}

module.exports = new NoticiaController