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

class guiaImagemDestacadaController {
    constructor(){

    }

    viewAll(req, res){

    }

    async authenticate(){
        let ret = await axios.post('http://localhost:1337/auth/local', { identifier: 'adm_manager', password: 'carlos' })
        
        return  ret;
    }

    async downloadImageAndSave(jwt, guia, url, ID, guia_id ){
        if(! ID){
            console.log("\n\n\nId não está definido no downloadImageAndSave então não vai atualizar a imagem do guia\n\n");
            return false;
        }

        await this.updateStrypeGuia(jwt.data.jwt, guia_id, {old_imagem_destacada: url});


        const path_image = '/uploads/guia/destacada/';
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
                        ref: guia._id,
                        kind: 'Guia',
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
                console.log("\n\n\n Inseriu a imagem do guia" , guia.titulo , " minha imagem: ", url);
            })

            //console.log(filename) // => /path/to/dest/image.jpg 
        } catch (e) {
            console.error("\n\n", e)
        }

    }

    async migrate(req, res){

        let jwt = await this.authenticate();
        //console.log("jwt: ", jwt.data.jwt);
        let stripe_guias = await this.getGuias(jwt.data.jwt)
        //console.log('stripe_guias: ', stripe_guias.data);
        

        stripe_guias.data.map(guia => {
            
            this.findMysqlGuia(guia, async guia_cb => {
                console.log("O guia: ", guia.titulo, " dentro já do mysql \n")
                if(guia_cb.length > 0){
                        this.getMysqlPostMeta(guia_cb[0].ID, async guia_cb1 => {
                            let guid = '';
                            if(guia_cb1.length > 0){
                                let s3 = false;
                                let attached = false;
                                guia_cb1.map(ev => {
                                    if(ev.meta_key == 'amazonS3_info'){
                                        s3 = true;
                                        guid = ev.meta_value;
                                        guid = "http://soumaisniteroi.com.br.s3-sa-east-1.amazonaws.com/" + guid.split("key")[1].split(':"')[1].split('";')[0]

                                        console.log("\n\nGuia ", guia.titulo , " vai atualizar image do S3 e ID: ", guia_cb[0].ID);

                                        this.downloadImageAndSave(jwt, guia, guid, guia_cb[0].ID, guia._id)
                                        return;
                                    }
                                })

                                if(!s3){
                                    guia_cb1.map(ev => {
                                        if(ev.meta_key == '_wp_attached_file'){
                                            attached = true;
                                            guid = ev.meta_value;
                                            guid = "http://soumaisniteroi.com.br/wp-content/uploads/" + guid
        
                                            console.log("\n\n ", guia.titulo , " vai atualizar image do ATTACHED e ID: ", guia_cb[0].ID);
                                            this.downloadImageAndSave(jwt, guia, guid, guia_cb[0].ID, guia._id)
                                            return;
                                        }
                                    })
                                }

                                if( !s3 && !attached){
                                    if(guia_cb[0].guid.includes('.jpg') || guia_cb[0].guid.includes('.jpeg') || 
                                        guia_cb[0].guid.includes('.png') || guia_cb[0].guid.includes('.gif') || 
                                        guia_cb[0].guid.includes('.tif') || guia_cb[0].guid.includes('.bmp') || 
                                        guia_cb[0].guid.includes('.tiff')
                                    ){
                                        console.log("\n\n ", guia.titulo , " vai atualizar image direto do post.GUID e ID: ", guia_cb[0].ID);
                                        this.downloadImageAndSave(jwt, guia, guia_cb[0].guid, guia_cb[0].id, guia._id);
                                    }
                                }

                            }
                        })

                    
                    //console.log("\n no calllback: ", guia_cb[0]);
                }
            } )
        }) 

        res.json("Importação finalizada com sucesso");
        
    }

    
    getGuiaByTermid(jwt, guias, term_id) {
    //    let guias = await this.getGuias(jwt)

        //console.log("meus guias: ", guias);

        return guias.filter(guia => {
            //console.log(guia.guianame , " --- ", guianame)
            if(guia.wpid == term_id)
                return guia;
        })
    }

    async updateStrypeGuia(jwt, guia_id, obj){
        let config = { headers: { 'Authorization': `Bearer ${jwt}` } };
        if(!guia_id)
        {
            console.log("\n\n\nId não está definido não vai atualizar o guia\n\n");
            return false;
        }
        //console.log("\n\nconfig: ", config);
        try{
            console.log("\nId: " , guia_id, " Vai atualizar a imagem: ", obj )
            let ret = await axios.put(`http://localhost:1337/guia/${guia_id}`, obj, config);
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

    async insertStrypeGuia(jwt, guia){
        let config = { headers: { 'Authorization': `Bearer ${jwt}` } };
        
        //console.log("\n\nconfig: ", config);
        try{
            let ret = await axios.post('http://localhost:1337/guia', guia, config);
            //console.log(ret);
            return ret;
        }
        catch(e){
            console.log("\n\n\n error: ", e.Error);
        } 
    }

    async getGuias(jwt){
        let config = { headers: { 'Authorization': `Bearer ${jwt}` } };
        
        //console.log("\n\nconfig: ", config);
        try{
            let ret = await axios.get('http://localhost:1337/guia?_start=1&_limit=200&old_imagem_destacada=',  config);
            //let ret = await axios.get('http://localhost:1337/guia?wpid=152634',  config);
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
        mysqlJson.query( sql, (error, guia) => {
            
            if(!error){
                cb(guia);
            }
            else{
                console.log("erro: ", error);
            }
        })
    }

    findMysqlGuia(guia, cb){

        //console.log("\n\n\n Guia: ", guia);
        let sql = ` SELECT p.* FROM nkty_posts p 
        INNER JOIN nkty_postmeta pt on pt.meta_value = p.ID
        WHERE imported = 0 and p.post_type = 'attachment' and p.post_parent = ${guia.wpid} `

        console.log("\n\n", sql, "\n\n\n")
        mysqlJson.query( sql, (error, guia1) => {
            
            if(!error){
                if(guia1.length > 0){
                    cb(guia1);
                }
                else{
                    console.log("O Guia é vazio");
                    let sql = `SELECT p.* FROM nkty_posts p 
                    WHERE p.id = ( SELECT pt.meta_value FROM nkty_postmeta pt WHERE  pt.meta_key = '_thumbnail_id' and pt.post_id = ${guia.wpid} ) `
                    console.log("segunda query do mysql guia: ", sql);
                    mysqlJson.query( sql, (error, guia2) => {
                        if(!error){
                            cb(guia2)
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

module.exports = new guiaImagemDestacadaController