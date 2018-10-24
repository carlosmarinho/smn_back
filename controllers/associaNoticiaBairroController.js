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
        let ret = await axios.post('http://localhost:1337/auth/local', { identifier: 'adm_manager', password: 'carlos' })
        
        return ret;
    }

    async migrate(req, res){

        let jwt = await this.authenticate();
        //console.log("jwt: ", jwt.data.jwt);
        let stripe_noticias = await this.getNoticias(jwt.data.jwt)
        console.log('stripe_noticias: ', stripe_noticias.data.length);

        stripe_noticias.data.map(noticia => {
            this.findMysqlNoticia(noticia, async noticia_cb => {
                //console.log("vai ver a noticia de id", noticia_cb);
                if(noticia_cb.length == 0){
                    await this.updateStrypeAssociacao(jwt.data.jwt, noticia._id, {imported_bairro: true});
                }
                else if(noticia_cb.length > 0){

                    try {
                            //console.log("Noticia::::: ", noticia_cb);

                            let bairros = [] 
                            await Promise.all(noticia_cb.map(async news => {
                                let cat =  await this.getBairroByWpid(jwt.data.jwt, news.term_id)
                                
                                //console.log('cat', cat);
                                if(cat.data.length > 0)
                                    bairros.push(cat.data[0]);
                            }))

                        if(bairros.length == 0 ){
                            console.log("hum está caindo aqui");
                            await this.updateStrypeAssociacao(jwt.data.jwt, noticia._id, {imported_bairro: true});
                            return;
                        }


                        let obj = {
                            bairros: bairros,
                            imported_bairro: true
                        }

                        console.log("o objeto: ", obj);

                        let assoc = await this.updateStrypeAssociacao(jwt.data.jwt, noticia._id, obj);

                        let update = `UPDATE nkty_term_relationships set imported = 1 where object_id = ${noticia_cb[0].ID} AND term_taxonomy_id = ${noticia_cb[0].term_taxonomy_id}`;
                        console.log("\n\n\nupdate: ", update)
                        
                        conn.query(update, err => {
                            if(err)
                                console.log('o post de id ', noticia_cb[0] , ' não foi marcado como importado \nErro:')
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
        console.log("obj para atualizar o payload: ", obj);
        try{
            let ret = await axios.put(`http://localhost:1337/noticia/${noticia_id}`, obj, config);
            
            return ret;
        }
        catch(e){
            console.log("\n\n\n error updateStrypeAssociacao: ", e.message);
        } 
    }

  

    async getBairroByWpid(jwt, wpid){
        let config = { headers: { 'Authorization': `Bearer ${jwt}` } };
        //console.log(`\n\nPegando o bairro: http://localhost:1337/bairro?wpid=${wpid}`);
        //console.log("\n\nconfig: ", config);
        try{
            let ret = await axios.get(`http://localhost:1337/bairro?wpid=${wpid}`,  config);
            //console.log("\n\nretorno: ", ret);
            return ret;
        }
        catch(e){
            console.log("\n\n\n error: getbairrowpid");
        }
    }

    async getNoticias(jwt){
        let config = { headers: { 'Authorization': `Bearer ${jwt}` } };
        
        //console.log("\n\nconfig: ", config);
        try{
            //let ret = await axios.get('http://localhost:1337/noticia?imported_category=false&_start=0&_limit=100',  config);
            let ret = await axios.get('http://localhost:1337/noticia?imported_bairro=false&_limit=500',  config);
            //let ret = await axios.get('http://localhost:1337/noticia?wpid=2465&_limit=100',  config);

            return ret;
        }
        catch(e){
            //console.log("\n\n\n error getnoticias: " );
        }
    }

    findMysqlNoticia(noticia, cb){

        //console.log("\n\n\n Noticia: ", noticia);

        let sql = ` select p.ID, p.post_title, t.term_id, t.name, t.slug, tt.taxonomy, tt.term_taxonomy_id
        FROM nkty_posts p
        inner join nkty_term_relationships tr on p.ID = tr.object_id
        inner join nkty_term_taxonomy tt on tr.term_taxonomy_id = tt.term_taxonomy_id and tt.taxonomy = 'category'
        inner join nkty_terms t on t.term_id = tt.term_id
        where t.name != 'Uncategorized' and tr.imported = 0 and description like 'Bairro%'
        and p.ID = ${noticia.wpid}`


        mysqlJson.query( sql, (error, noticia) => {
            
        if(!error){
                cb(noticia);
            }
            else{
                console.log("erro no findmysqlnoticia: ");
            }
        })
        
    }

}

module.exports = new associaNoticiaCategoriaController