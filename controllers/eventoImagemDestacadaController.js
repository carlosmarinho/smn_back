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
        let ret = await axios.post('http://localhost:1337/auth/local', { identifier: 'adm_manager', password: 'carlos' })
        
        return ret;
    }

    async downloadImageAndSave(jwt, evento, url, ID, evento_id ){
        if(! ID){
            console.log("\n\n\nId não está definido no downloadImageAndSave então não vai atualizar a imagem do evento\n\n");
            return false;
        }

        await this.updateStrypeEvento(jwt.data.jwt, evento_id, {old_imagem_destacada: url});


        const path_image = '/uploads/evento/destacada/';
        let options = {
            url: url,
            dest: '/home/carlos/projects/work/node/smn_strapi_new/public' + path_image                  // Save to /path/to/dest/image.jpg
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
                    related: [related],
                    old_url: url
                }
                
                let img = await this.insertStrypeImage(jwt.data.jwt, img_obj);

                let update = `UPDATE nkty_posts set imported = 1 where ID = ${ID}`;
                
                conn.query(update, err => {
                    if(err)
                        console.log('o post de id ', ID , ' não foi marcado como importado \nErro:', err)
                });
                console.log("\n\n\n Inseriu a imagem do evento" , evento.titulo , " minha imagem: ", url);
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
                console.log("O evento: ", evento.titulo, " dentro já do mysql \n")
                if(evento_cb.length > 0){
                        this.getMysqlPostMeta(evento_cb[0].ID, async evento_cb1 => {
                            let guid = '';
                            if(evento_cb1.length > 0){
                                let s3 = false;
                                let attached = false;
                                evento_cb1.map(ev => {
                                    if(ev.meta_key == 'amazonS3_info'){
                                        s3 = true;
                                        guid = ev.meta_value;
                                        guid = "http://soumaisniteroi.com.br.s3-sa-east-1.amazonaws.com/" + guid.split("key")[1].split(':"')[1].split('";')[0]

                                        console.log("\n\nEvento ", evento.titulo , " vai atualizar image do S3 e ID: ", evento_cb[0].ID);

                                        this.downloadImageAndSave(jwt, evento, guid, evento_cb[0].ID, evento._id)
                                        return;
                                    }
                                })

                                if(!s3){
                                    evento_cb1.map(ev => {
                                        if(ev.meta_key == '_wp_attached_file'){
                                            attached = true;
                                            guid = ev.meta_value;
                                            guid = "http://soumaisniteroi.com.br/wp-content/uploads/" + guid
        
                                            console.log("\n\n ", evento.titulo , " vai atualizar image do ATTACHED e ID: ", evento_cb[0].ID);
                                            this.downloadImageAndSave(jwt, evento, guid, evento_cb[0].ID, evento._id)
                                            return;
                                        }
                                    })
                                }

                                if( !s3 && !attached){
                                    if(evento_cb[0].guid.includes('.jpg') || evento_cb[0].guid.includes('.jpeg') || 
                                        evento_cb[0].guid.includes('.png') || evento_cb[0].guid.includes('.gif') || 
                                        evento_cb[0].guid.includes('.tif') || evento_cb[0].guid.includes('.bmp') || 
                                        evento_cb[0].guid.includes('.tiff')
                                    ){
                                        console.log("\n\n ", evento.titulo , " vai atualizar image direto do post.GUID e ID: ", evento_cb[0].ID);
                                        this.downloadImageAndSave(jwt, evento, evento_cb[0].guid, evento_cb[0].id, evento._id);
                                    }
                                }

                                /* if(evento_cb1[0].meta_key == 'amazonS3_info'){
                                    guid = evento_cb1[0].meta_value;
                                    guid = "http://soumaisniteroi.com.br.s3-sa-east-1.amazonaws.com/" + guid.split("key")[1].split(':"')[1].split('";')[0]

                                    this.downloadImageAndSave(jwt, evento, guid, evento_cb[0].ID, guid)
                                }
                                else if(evento_cb1[1].meta_key == 'amazonS3_info') {
                                    guid = evento_cb1[1].meta_value;
                                    guid = "http://soumaisniteroi.com.br.s3-sa-east-1.amazonaws.com/" + guid.split("key")[1].split(':"')[1].split('";')[0]
                                    
                                    this.downloadImageAndSave(jwt, evento, guid, evento_cb[0].ID, guid)
                                }
                                else if(evento_cb1[2].meta_key == 'amazonS3_info') {
                                    guid = evento_cb1[2].meta_value;
                                    guid = "http://soumaisniteroi.com.br.s3-sa-east-1.amazonaws.com/" + guid.split("key")[1].split(':"')[1].split('";')[0]
                                    
                                    this.downloadImageAndSave(jwt, evento, guid, evento_cb[0].ID, guid)
                                }
                                else if(evento_cb1[0].meta_key == '_wp_attached_file'){
                                    guid = evento_cb1[0].meta_value;
                                    guid = "http://soumaisniteroi.com.br/wp-content/uploads/" + guid

                                    this.downloadImageAndSave(jwt, evento, guid, evento_cb[0].ID, guid)
                                }
                                else if(evento_cb1[1].meta_key == '_wp_attached_file'){
                                    guid = evento_cb1[1].meta_value;
                                    guid = "http://soumaisniteroi.com.br/wp-content/uploads/" + guid

                                    this.downloadImageAndSave(jwt, evento, guid, evento_cb[0].ID, guid)
                                } */
                            }
                        })

                    

                    
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

    async updateStrypeEvento(jwt, evento_id, obj){
        let config = { headers: { 'Authorization': `Bearer ${jwt}` } };
        if(!evento_id)
        {
            console.log("\n\n\nId não está definido não vai atualizar o evento\n\n");
            return false;
        }
        //console.log("\n\nconfig: ", config);
        try{
            console.log("\nId: " , evento_id, " Vai atualizar a imagem: ", obj )
            let ret = await axios.put(`http://localhost:1337/evento/${evento_id}`, obj, config);
            return ret;
        }
        catch(e){
            console.log("\n\n\n error: ", e.Error);
        } 
    }

    async insertStrypeImage(jwt, image){
        let config = { headers: { 'Authorization': `Bearer ${jwt}` } };
        
        //console.log("\n\nconfig: ", image);
        try{
            let ret = await axios.post('http://localhost:1337/uploadfile', image, config);
            //console.log("\n\n\nvai fazer upload:", ret);
            return ret;
        }
        catch(e){
            console.log("\n\n\n error insertStrypeImage: ", e.Error);
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
            console.log("\n\n\n error: ", e.Error);
        } 
    }

    async getEventos(jwt){
        let config = { headers: { 'Authorization': `Bearer ${jwt}` } };
        
        //console.log("\n\nconfig: ", config);
        try{
            let ret = await axios.get('http://localhost:1337/evento?old_imagem_destacada=',  config);
            //let ret = await axios.get('http://localhost:1337/evento?wpid=152634',  config);
            return ret;
        }
        catch(e){
            console.log("\n\n\n error: ", e.Error);
        }
    }

    getMysqlPostMeta(post_id, cb) {
        //console.log("\n\n\n post_id: ", post_id);
        let sql = ` SELECT pt.* FROM nkty_postmeta pt 
        WHERE (pt.meta_key = 'amazonS3_info' OR pt.meta_key = '_wp_attached_file' ) and  pt.post_id = ${post_id} 
        order by meta_key asc`

        //console.log("\n\nquery-sql: ", sql, "\n\n\n")
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

        //console.log("\n\n\n Evento: ", evento);
        let sql = ` SELECT p.* FROM nkty_posts p 
        INNER JOIN nkty_postmeta pt on pt.meta_value = p.ID
        WHERE imported = 0 and p.post_type = 'attachment' and p.post_parent = ${evento.wpid} `

        console.log("\n\n", sql, "\n\n\n")
        mysqlJson.query( sql, (error, evento1) => {
            
            if(!error){
                if(evento1.length > 0){
                    cb(evento1);
                }
                else{
                    console.log("O Evento é vazio");
                    let sql = `SELECT p.* FROM nkty_posts p 
                    WHERE p.id = ( SELECT pt.meta_value FROM nkty_postmeta pt WHERE  pt.meta_key = '_thumbnail_id' and pt.post_id = ${evento.wpid} ) `
                    console.log("segunda query do mysql evento: ", sql);
                    mysqlJson.query( sql, (error, evento2) => {
                        if(!error){
                            cb(evento2)
                        }
                        else{
                            console.log("erro na segunda query: ", error)
                        }
                    })
                }
            }
            else{
                console.log("erro: ", error);
            }
        })
        
    }

}

module.exports = new eventoImagemDestacadaController