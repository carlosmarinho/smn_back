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

class associaNoticiaTagController {
    constructor(){

    }

    viewAll(req, res){

    }

    async authenticate(req){

        let ret
        console.log("sessao: ", req.session.jwt)
        if(!req.session.jwt){
            ret = await axios.post('http://localhost:1337/auth/local', { identifier: 'adm_manager', password: 'carlos' })
            req.session.jwt = ret;
        }
        
        return req.session.jwt;
    }

    async migrate(req, res){

        let jwt = await this.authenticate(req);
        //console.log("jwt: ", jwt.data.jwt);
        
        
            this.findMysqlNoticia(async noticia_cb => {

                if(noticia_cb.length > 0){

                    try {
                        //console.log("Noticia::::: ", noticia_cb);

                        
                        await Promise.all(noticia_cb.map(async news => {
                            let guia = null;
                            let not = null;
                            if(news.post_type == 'item' || news.post_type == 'servico'){
                                guia =  await this.getGuiaByWpid(jwt.data.jwt, news.ID)
                                let tags = guia.data[0].tags;
                            
                                if(guia.data.length > 0){
                                    let new_guia = guia.data[0];
                                    //console.log("GUIA: ", guia.data[0]);
                                    let cat =  await this.getTagByWpid(jwt.data.jwt, news.term_id)
    
                                    if(cat.data.length > 0){
                                        //console.log("tags: ", new_guia.tags);
                                        
                                        let result = new_guia.tags.filter( tag => {
                                            return tag._id == cat.data[0]._id;
                                        })


                                        if(result.length == 0){
                                            tags.push(cat.data[0]);
                                            await this.updateStrypeGuiaAssociacao(jwt.data.jwt, new_guia._id, {imported_tag: true, tags: tags});
                                        }
                                    }
    
                                }
                            }
                            else{
                                not =  await this.getNoticiaByWpid(jwt.data.jwt, news.ID)
                            
                                if(not.data.length > 0){
                                    let new_noticia = not.data[0];
                                    //console.log("GUIA: ", guia.data[0]);
                                    let cat =  await this.getTagByWpid(jwt.data.jwt, news.term_id)
    
                                    if(cat.data.length > 0){
                                        //console.log("tags: ", new_guia.tags);
                                        let result = new_noticia.tags.filter( tag => {
                                            return tag._id == cat.data[0]._id;
                                        })

                                        if(result.length == 0){
                                            new_noticia.tags.push(cat.data[0]);
                                            await this.updateStrypeAssociacao(jwt.data.jwt, new_noticia._id, {imported_tag: true, tags: new_noticia.tags});
                                        }
                                    }
    
                                }
                            }

                            let update = `UPDATE nkty_term_relationships set imported = 1 where object_id = ${news.ID} AND term_taxonomy_id = ${news.term_taxonomy_id}`;
                            console.log("\n\n\nupdate: ", update)
                            
                            conn.query(update, err => {
                                if(err)
                                    console.log('o post de id ', noticia_cb[0] , ' não foi marcado como importado \nErro:', err)
                            });

                        }))

                        


                        /*

                        let obj = {
                            tags: tags,
                            imported_tag: true
                        }

                        console.log("o objeto: ", obj);

                        let assoc = await this.updateStrypeAssociacao(jwt.data.jwt, noticia._id, obj);

                        let update = `UPDATE nkty_term_relationships set imported = 1 where object_id = ${noticia_cb[0].ID} AND term_taxonomy_id = ${noticia_cb[0].term_taxonomy_id}`;
                        console.log("\n\n\nupdate: ", update)
                        
                        conn.query(update, err => {
                            if(err)
                                console.log('o post de id ', noticia_cb[0] , ' não foi marcado como importado \nErro:', err)
                        });
                        */

                    } catch (e) {
                    console.error("\n\n", e)
                    } 

                }
            } )

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

    async updateStrypeGuiaAssociacao(jwt, guia_id, obj){
        let config = { headers: { 'Authorization': `Bearer ${jwt}` } };
        
        //console.log("\n\nconfig: ", config);
        console.log("\n\n\n\n\nOBJ a ser atualizado: ", obj)
        try{
            let ret = await axios.put(`http://localhost:1337/guia/${guia_id}`, obj, config);
            return ret;
        }
        catch(e){
            console.log("\n\n\n error: ", e.message);
        } 
    }

    async updateStrypeAssociacao(jwt, noticia_id, obj){
        let config = { headers: { 'Authorization': `Bearer ${jwt}` } };
        
        console.log("\n\n\n\n\nOBJ a ser atualizado: ", obj)

        //console.log("\n\nconfig: ", config);
        try{
            let ret = await axios.put(`http://localhost:1337/noticia/${noticia_id}`, obj, config);
            return ret;
        }
        catch(e){
            console.log("\n\n\n error: ", e.message);
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

    async getGuiaByWpid(jwt, wpid){
        let config = { headers: { 'Authorization': `Bearer ${jwt}` } };
        //console.log(`\n\nPegando a tag: http://localhost:1337/tag?wpid=${wpid}`);
        //console.log("\n\nconfig: ", config);
        try{
            let ret = await axios.get(`http://localhost:1337/guia?wpid=${wpid}`,  config);
            //console.log("\n\nretorno: ", ret);
            return ret;
        }
        catch(e){
            console.log("\n\n\n error: ", e);
        }
    }

    async getNoticiaByWpid(jwt, wpid){
        let config = { headers: { 'Authorization': `Bearer ${jwt}` } };
        //console.log(`\n\nPegando a tag: http://localhost:1337/tag?wpid=${wpid}`);
        //console.log("\n\nconfig: ", config);
        try{
            let ret = await axios.get(`http://localhost:1337/noticia?wpid=${wpid}`,  config);
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
            let ret = await axios.get('http://localhost:1337/noticia?imported_tag=false&_start=100&_limit=100',  config);
            return ret;
        }
        catch(e){
            console.log("\n\n\n error: ", e);
        }
    }

    findMysqlNoticia(cb){

        //console.log("\n\n\n Noticia: ", noticia);

        let sql = ` select p.ID, p.post_title, t.term_id, t.name, p.post_type, t.slug, tt.taxonomy, tt.term_taxonomy_id
        FROM nkty_posts p
        inner join nkty_term_relationships tr on p.ID = tr.object_id
        inner join nkty_term_taxonomy tt on tr.term_taxonomy_id = tt.term_taxonomy_id and tt.taxonomy = 'post_tag'
        inner join nkty_terms t on t.term_id = tt.term_id
        where t.name != 'Uncategorized' limit 200`

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

module.exports = new associaNoticiaTagController