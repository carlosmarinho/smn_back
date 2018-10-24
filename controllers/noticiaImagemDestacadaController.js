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

class noticiaImagemDestacadaController {
    constructor(){

    }

    viewAll(req, res){

    }

    async authenticate(){
        let ret = await axios.post('http://localhost:1337/auth/local', { identifier: 'adm_manager', password: 'carlos' })
        
        return ret;
    }

    async downloadImageAndSave(jwt, noticia, url, ID, noticia_id ){
        if(! ID){
            console.log("\n\n\nId não está definido no downloadImageAndSave então não vai atualizar a imagem do noticia\n\n");
            return false;
        }

        await this.updateStrypeNoticia(jwt.data.jwt, noticia_id, {old_imagem_destacada: url, imported_imagem_destacada: true});

        /* Não quero fazer downloads das imagens antigas */
        return;

        const path_image = '/uploads/noticia/destacada/';
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
                        ref: noticia._id,
                        kind: 'Noticia',
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
                console.log("\n\n\n Inseriu a imagem do noticia" , noticia.titulo , " minha imagem: ", url);
            })

            //console.log(filename) // => /path/to/dest/image.jpg 
        } catch (e) {
            console.error("\n\n", e)
        }

    }

    async migrate(req, res){

        let jwt = await this.authenticate();
        let stripe_noticias = await this.getNoticias(jwt.data.jwt)
        console.log('stripe_noticias: ', stripe_noticias.data.length);
        

        stripe_noticias.data.map(noticia => {
            
            this.updateStrypeNoticia(jwt.data.jwt, noticia._id, {imported_imagem_destacada: true});


            this.findMysqlNoticia(noticia, async noticia_cb => {
                if(noticia_cb.length > 0){
                        this.getMysqlPostMeta(noticia_cb[0].ID, async noticia_cb1 => {
                            let guid = '';
                            if(noticia_cb1.length > 0){
                                let s3 = false;
                                let attached = false;
                                noticia_cb1.map(ev => {
                                    if(ev.meta_key == 'amazonS3_info'){
                                        s3 = true;
                                        guid = ev.meta_value;
                                        guid = "http://soumaisniteroi.com.br.s3-sa-east-1.amazonaws.com/" + guid.split("key")[1].split(':"')[1].split('";')[0]

                                        console.log("\n\nNoticia ", noticia.titulo , " vai atualizar image do S3 e ID: ", noticia_cb[0].ID);

                                        this.downloadImageAndSave(jwt, noticia, guid, noticia_cb[0].ID, noticia._id)
                                        return;
                                    }
                                })

                                if(!s3){
                                    noticia_cb1.map(ev => {
                                        if(ev.meta_key == '_wp_attached_file'){
                                            attached = true;
                                            guid = ev.meta_value;
                                            guid = "http://soumaisniteroi.com.br/wp-content/uploads/" + guid
        
                                            console.log("\n\n ", noticia.titulo , " vai atualizar image do ATTACHED e ID: ", noticia_cb[0].ID);
                                            this.downloadImageAndSave(jwt, noticia, guid, noticia_cb[0].ID, noticia._id)
                                            return;
                                        }
                                    })
                                }

                                if( !s3 && !attached){
                                    if(noticia_cb[0].guid.includes('.jpg') || noticia_cb[0].guid.includes('.jpeg') || 
                                        noticia_cb[0].guid.includes('.png') || noticia_cb[0].guid.includes('.gif') || 
                                        noticia_cb[0].guid.includes('.tif') || noticia_cb[0].guid.includes('.bmp') || 
                                        noticia_cb[0].guid.includes('.tiff')
                                    ){
                                        console.log("\n\n ", noticia.titulo , " vai atualizar image direto do post.GUID e ID: ", noticia_cb[0].ID);
                                        this.downloadImageAndSave(jwt, noticia, noticia_cb[0].guid, noticia_cb[0].id, noticia._id);
                                    }
                                }

                            }
                        })

            
                    
                    //console.log("\n no calllback: ", noticia_cb[0]);
                }
            } )
        }) 

        res.json("Importação finalizada com sucesso");
        
    }

    /* async migrate(req, res){

        let jwt = await this.authenticate();
        //console.log("jwt: ", jwt.data.jwt);
        let stripe_noticias = await this.getNoticias(jwt.data.jwt)
        //console.log('stripe_noticias: ', stripe_noticias.data);
        const path_image = '/uploads/noticia/destacada/'

        stripe_noticias.data.map(noticia => {
            this.findMysqlNoticia(noticia, async noticia_cb => {
                if(noticia_cb.length > 0){
                    
                    let options = {
                        url: noticia_cb[0].guid,
                        dest: '/home/carlos/projects/work/node/smn_strapi_new/public' + path_image                  // Save to /path/to/dest/image.jpg
                    }

                    try {
                        const { filename, image } = await download.image(options)
                        imageInfo(filename, async (err, info) => {
                            if (err) return console.warn(err);
                            //console.log("\n\n\ninfo da image: ", info);

                           
                            let related = {
                                    _id: new ObjectId(),
                                    ref: noticia._id,
                                    kind: 'Noticia',
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

                            let update = `UPDATE nkty_posts set imported = 1 where ID = ${noticia_cb[0].ID}`;
                            
                            conn.query(update, err => {
                                if(err)
                                    console.log('o post de id ', noticia_cb[0] , ' não foi marcado como importado \nErro:', err)
                            });
                            console.log("\n\n\n minha imagem: ", img_obj);
                        })

                        //console.log(filename) // => /path/to/dest/image.jpg 
                    } catch (e) {
                    console.error("\n\n", e)
                    }

                    //console.log("\n no calllback: ", noticia_cb[0]);
                }
            } )
        }) 

        res.json("Importação finalizada com sucesso");
        
    } */

    
    getNoticiaByTermid(jwt, noticias, term_id) {
    //    let noticias = await this.getNoticias(jwt)

        //console.log("meus noticias: ", noticias);

        return noticias.filter(noticia => {
            //console.log(noticia.noticianame , " --- ", noticianame)
            if(noticia.wpid == term_id)
                return noticia;
        })
    }

    async updateStrypeNoticia(jwt, noticia_id, obj){
        let config = { headers: { 'Authorization': `Bearer ${jwt}` } };
        if(!noticia_id)
        {
            console.log("\n\n\nId não está definido não vai atualizar o noticia\n\n");
            return false;
        }
        //console.log("\n\nconfig: ", config);
        try{
            console.log("\nId: " , noticia_id, " Vai atualizar a imagem: ", obj )
            let ret = await axios.put(`http://localhost:1337/noticia/${noticia_id}`, obj, config);
            return ret;
        }
        catch(e){
            console.log("\n\n\n error: ", e.Error);
        } 
    }

    async insertStrypeImage(jwt, image){
        let config = { headers: { 'Authorization': `Bearer ${jwt}` } };
        
        //console.log("vai inserir a imagem no upload file: ", image)
        //console.log("\n\nconfig: ", config);
        try{
            let ret = await axios.post('http://localhost:1337/uploadfile', image, config);
            //console.log(ret);
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

    async getNoticias(jwt){
        let config = { headers: { 'Authorization': `Bearer ${jwt}` } };
        
        //console.log("\n\nconfig: ", config);
        try{
            let ret = await axios.get('http://localhost:1337/noticia?_limit=100&imported_imagem_destacada=false&old_imagem_destacada=',  config);
            //let ret = await axios.get('http://localhost:1337/noticia?wpid=407',  config);
            return ret;
        }
        catch(e){
            console.log("\n\n\n error: ", e);
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

    findMysqlNoticia(noticia, cb){

        //console.log("\n\n\n Noticia: ", noticia);
        let sql = ` SELECT p.* FROM nkty_posts p 
        INNER JOIN nkty_postmeta pt on pt.meta_value = p.ID
        WHERE p.imported = 0 and p.post_type = 'attachment' and p.post_parent = ${noticia.wpid} `

        //console.log("\n\n", sql, "\n\n\n")
        mysqlJson.query( sql, (error, noticia1) => {
            
            if(!error){
                if(noticia1.length > 0){
                    cb(noticia1);
                }
                else{
                    //console.log("A Noticia é vazio");
                    let sql = `SELECT p.* FROM nkty_posts p 
                    WHERE p.id = ( SELECT pt.meta_value FROM nkty_postmeta pt WHERE  pt.meta_key = '_thumbnail_id' and pt.post_id = ${noticia.wpid} ) `
                    //console.log("segunda query do mysql noticia: ", sql);
                    mysqlJson.query( sql, (error, noticia2) => {
                        if(!error){
                            cb(noticia2)
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

module.exports = new noticiaImagemDestacadaController