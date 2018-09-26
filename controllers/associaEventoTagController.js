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

class associaEventoTagController {
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
        console.log('stripe_eventos: ', stripe_eventos.data);

        stripe_eventos.data.map(evento => {
            this.findMysqlEvento(evento, async evento_cb => {

                if(evento_cb.length > 0){

                    try {

                        let tags = [] 
                        await Promise.all(evento_cb.map(async news => {
                            let cat =  await this.getTagByWpid(jwt.data.jwt, news.term_id)
                            if(cat.data.length > 0)
                                tags.push(cat.data[0]);
                        }))

                        if(tags.length == 0 ){
                            await this.updateStrypeAssociacao(jwt.data.jwt, noticia._id, {imported_tag: true});
                            return;
                        }

                        let obj = {
                            tags: tags,
                            imported_tag: true
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

    async insertStrypeEvento(jwt, evento){
        let config = { headers: { 'Authorization': `Bearer ${jwt}` } };
        
        //console.log("\n\nconfig: ", config);
        try{
            let ret = await axios.post('http://localhost:1337/evento', evento, config);
            //console.log(ret);
            return ret;
        }
        catch(e){
            console.log("\n\n\n error: ", e);
        } 
    }

    async getTagByWpid(jwt, wpid){
        let config = { headers: { 'Authorization': `Bearer ${jwt}` } };
        //console.log(`\n\nPegando a tag: http://localhost:1337/tag?wpid=${wpid}`);
        //console.log("\n\nconfig: ", config);
        try{
            let ret = await axios.get(`http://localhost:1337/tag?wpid=${wpid}`,  config);
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
            let ret = await axios.get('http://localhost:1337/evento?imported_tag=false&_start=0&_limit=100',  config);
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
        inner join nkty_term_taxonomy tt on tr.term_taxonomy_id = tt.term_taxonomy_id and tt.taxonomy = 'post_tag'
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

module.exports = new associaEventoTagController