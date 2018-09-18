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

class eventoImagemDestacadaController {
    constructor(){

    }

    viewAll(req, res){

    }

    async authenticate(){
        let ret = await axios.post('http://localhost:1337/auth/local', { identifier: 'adm_manager', password: '3ngenhoc2' })
        
        return ret;
    }

    async downloadImageAndSave(jwt, evento, url, ID ){
        const path_image = '/uploads/evento/destacada/';
        let options = {
            url: url,
            dest: '/home/carlos/projects/work/node/smn_strapi/public' + path_image                  // Save to /path/to/dest/image.jpg
        }

        try {
            const { filename, image } = await download.image(options)
            imageInfo(filename, async (err, info) => {
                if (err) return console.warn(err);
                //console.log("\n\n\ninfo da image: ", info);

               
                let related = {
                        _id: new ObjectId(),
                        ref: evento._id,
                        kind: 'Evento',
                        field: 'imagem_destacada'
                }

                let img_obj = {
                    name: path.basename(filename),
                    sha256: info.sha1,
                    hash: path.parse(filename).name,
                    ext: '.' + info.ext,
                    mime: info.mime,
                    size: info.bytes,
                    url: path_image + path.basename(filename),
                    provider: 'local',
                    related: [related]
                }

                let img = await this.insertStrypeImage(jwt.data.jwt, img_obj);

                let update = `UPDATE nkty_posts set imported = 1 where ID = ${ID}`;
                
                conn.query(update, err => {
                    if(err)
                        console.log('o post de id ', $ID , ' não foi marcado como importado \nErro:', err)
                });
                console.log("\n\n\n minha imagem: ", img_obj);
            })

            //console.log(filename) // => /path/to/dest/image.jpg 
        } catch (e) {
            console.error("\n\n", e)
        }

    }

    async migrate(req, res){

        let jwt = await this.authenticate();
        //console.log("jwt: ", jwt.data.jwt);
        let stripe_eventos = await this.getEventos(jwt.data.jwt)
        //console.log('stripe_eventos: ', stripe_eventos.data);
        

        stripe_eventos.data.map(evento => {
            this.findMysqlEvento(evento, async evento_cb => {
                if(evento_cb.length > 0){
                    
                    if(evento_cb[0].guid.includes('attachment_id=')){
                        this.getMysqlPostMeta(evento_cb[0].ID, async evento_cb1 => {
                            let guid = '';
                            if(evento_cb1.length > 0){
                                if(evento_cb1[0].meta_key == 'amazonS3_info'){
                                    guid = evento_cb1[0].meta_value;
                                    guid = "http://soumaisniteroi.com.br.s3-sa-east-1.amazonaws.com/" + guid.split("key")[1].split(':"')[1].split('";')[0]

                                    this.downloadImageAndSave(jwt, evento, guid, evento_cb[0].ID)
                                }
                                else if(evento_cb1[1].meta_key == 'amazonS3_info') {
                                    guid = evento_cb1[1].meta_value;
                                    guid = "http://soumaisniteroi.com.br.s3-sa-east-1.amazonaws.com/" + guid.split("key")[1].split(':"')[1].split('";')[0]
                                    
                                    this.downloadImageAndSave(jwt, evento, guid, evento_cb[0].ID)
                                }
                                else if(evento_cb1[0].meta_key == '_wp_attached_file'){
                                    guid = evento_cb1[0].meta_value;
                                    guid = "http://soumaisniteroi.com.br/wp-content/uploads/" + guid

                                    this.downloadImageAndSave(jwt, evento, guid, evento_cb[0].ID)
                                }
                            }
                        })
                    }
                    else {
                        this.downloadImageAndSave(jwt, evento, evento_cb[0].guid, evento_cb[0].id);
                    }

                    
                    //console.log("\n no calllback: ", evento_cb[0]);
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

    async insertStrypeImage(jwt, image){
        let config = { headers: { 'Authorization': `Bearer ${jwt}` } };
        
        console.log("\n\nconfig: ", image);
        try{
            let ret = await axios.post('http://localhost:1337/uploadfile', image, config);
            console.log("\n\n\nvai fazer upload:", ret);
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

    async getEventos(jwt){
        let config = { headers: { 'Authorization': `Bearer ${jwt}` } };
        
        //console.log("\n\nconfig: ", config);
        try{
            let ret = await axios.get('http://localhost:1337/evento',  config);
            return ret;
        }
        catch(e){
            console.log("\n\n\n error: ", e);
        }
    }

    getMysqlPostMeta(post_id, cb) {
        console.log("\n\n\n post_id: ", post_id);
        let sql = ` SELECT pt.* FROM nkty_postmeta pt 
        WHERE (pt.meta_key = 'amazonS3_info' OR pt.meta_key = '_wp_attached_file') and  pt.post_id = ${post_id} 
        order by meta_key asc`

        console.log("\n\nquery-sql: ", sql, "\n\n\n")
        mysqlJson.query( sql, (error, evento) => {
            
            if(!error){
                cb(evento);
            }
            else{
                console.log("erro: ", error);
            }
        })
    }

    findMysqlEvento(evento, cb){

        console.log("\n\n\n Evento: ", evento);
        let sql = ` SELECT p.* FROM nkty_posts p 
        INNER JOIN nkty_postmeta pt on pt.meta_key = '_thumbnail_id' and pt.meta_value = p.ID
        WHERE p.imported = 0 and p.post_type = 'attachment' and p.post_parent = ${evento.wpid} `

        //console.log("\n\n", sql, "\n\n\n")
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

module.exports = new eventoImagemDestacadaController