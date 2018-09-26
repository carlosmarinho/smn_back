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

class associaEventoBairroController {
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
        let stripe_eventos = await this.getEventos(jwt.data.jwt)
        //console.log('stripe_eventos: ', stripe_eventos.data);

        stripe_eventos.data.map(evento => {
            this.findMysqlEvento(evento, async evento_cb => {
                console.log("vai ver a evento de id", evento_cb);
                if(evento_cb.length == 0){
                    await this.updateStrypeAssociacao(jwt.data.jwt, evento._id, {imported_bairro: true});
                }
                else if(evento_cb.length > 0){

                    try {
                            //console.log("Evento::::: ", evento_cb);

                            let bairros = [] 
                            await Promise.all(evento_cb.map(async news => {
                                let cat =  await this.getBairroBySlug(jwt.data.jwt, news.slug)
                                
                                console.log('cat', cat);
                                if(cat.data.length > 0)
                                    bairros.push(cat.data[0]);
                            }))

                        if(bairros.length == 0 ){
                            console.log("hum está caindo aqui");
                            await this.updateStrypeAssociacao(jwt.data.jwt, evento._id, {imported_bairro: true});
                            return;
                        }


                        let obj = {
                            bairros: bairros,
                            imported_bairro: true
                        }

                        console.log("o objeto: ", obj);

                        let assoc = await this.updateStrypeAssociacao(jwt.data.jwt, evento._id, obj);

                        let update = `UPDATE nkty_term_relationships set imported = 1 where object_id = ${evento_cb[0].ID} AND term_taxonomy_id = ${evento_cb[0].term_taxonomy_id}`;
                        console.log("\n\n\nupdate: ", update)
                        
                        conn.query(update, err => {
                            if(err)
                                console.log('o post de id ', evento_cb[0] , ' não foi marcado como importado \nErro:', err)
                        });

                    } catch (e) {
                    console.error("\n\n", e)
                    }

                }
            } )
        }) 

        res.json("Importação finalizada com sucesso");
        
    }

    
    getEventoByTermid(jwt, eventos, term_id) {
    //    let eventos = await this.getEventos(jwt)

        //console.log("meus eventos: ", eventos);

        return eventos.filter(evento => {
            //console.log(evento.eventoname , " --- ", eventoname)
            if(evento.wpid == term_id)
                return evento;
        })
    }

    async updateStrypeAssociacao(jwt, evento_id, obj){
        let config = { headers: { 'Authorization': `Bearer ${jwt}` } };
        
        //console.log("\n\nconfig: ", config);
        try{
            let ret = await axios.put(`http://localhost:1337/evento/${evento_id}`, obj, config);
            
            return ret;
        }
        catch(e){
            console.log("\n\n\n error: ", e);
        } 
    }

  

    async getBairroBySlug(jwt, slug){
        let config = { headers: { 'Authorization': `Bearer ${jwt}` } };
        //console.log(`\n\nPegando o bairro: http://localhost:1337/bairro?wpid=${wpid}`);
        //console.log("\n\nconfig: ", config);
        try{
            let ret = await axios.get(`http://localhost:1337/bairro?slug=${slug}`,  config);
            //console.log("\n\nretorno: ", ret);
            return ret;
        }
        catch(e){
            console.log("\n\n\n error: ", e);
        }
    }

    async getEventos(jwt){
        let config = { headers: { 'Authorization': `Bearer ${jwt}` } };
        
        //console.log("\n\nconfig: ", config);
        try{
            //let ret = await axios.get('http://localhost:1337/evento?imported_category=false&_start=0&_limit=100',  config);
            let ret = await axios.get('http://localhost:1337/evento?imported_bairro=false&_limit=500',  config);
            //let ret = await axios.get('http://localhost:1337/evento?wpid=2465&_limit=100',  config);

            return ret;
        }
        catch(e){
            console.log("\n\n\n error: ", e);
        }
    }

    findMysqlEvento(evento, cb){

        //console.log("\n\n\n Evento: ", evento);

        let sql = ` select p.ID, p.post_title, t.term_id, t.name, t.slug, tt.taxonomy, tt.term_taxonomy_id
        FROM nkty_posts p
        inner join nkty_term_relationships tr on p.ID = tr.object_id
        inner join nkty_term_taxonomy tt on tr.term_taxonomy_id = tt.term_taxonomy_id and tt.taxonomy = 'item_location'
        inner join nkty_terms t on t.term_id = tt.term_id
        where t.name != 'Uncategorized' and tr.imported = 0 
        and p.ID = ${evento.wpid}`

        console.log("\n\n", sql, "\n\n\n")
        mysqlJson.query( sql, (error, evento) => {
            
        if(!error){
                cb(evento);
            }
            else{
                console.log("erro: ", error);
            }
        })
        
    }

}

module.exports = new associaEventoBairroController