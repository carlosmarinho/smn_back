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
        let ret = await axios.post('http://localhost:1337/auth/local', { identifier: 'adm_manager', password: '3ngenhoc2' })
        
        return ret;
    }

    async migrate(req, res){

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
                        dest: '/home/carlos/projects/work/node/smn_strapi/public' + path_image                  // Save to /path/to/dest/image.jpg
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

    async insertStrypeImage(jwt, image){
        let config = { headers: { 'Authorization': `Bearer ${jwt}` } };
        
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
            let ret = await axios.get('http://localhost:1337/noticia',  config);
            return ret;
        }
        catch(e){
            console.log("\n\n\n error: ", e);
        }
    }

    findMysqlNoticia(noticia, cb){

        console.log("\n\n\n Noticia: ", noticia);
        let sql = ` SELECT p.* FROM nkty_posts p 
        INNER JOIN nkty_postmeta pt on pt.meta_key = '_thumbnail_id' and pt.meta_value = p.ID
        WHERE p.imported = 0 and p.post_type = 'attachment' and p.post_parent = ${noticia.wpid} `

        //console.log("\n\n", sql, "\n\n\n")
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

module.exports = new noticiaImagemDestacadaController