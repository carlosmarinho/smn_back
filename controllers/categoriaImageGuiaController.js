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

class CategoriaImageGuiaController {
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
        let stripe_categorys = await this.getCategorys(jwt.data.jwt)
        
        const path_image = '/uploads/guia-comercial/categoria/'

        stripe_categorys.data.map(cat => {
            this.findMysqlCategory(cat, async cat_cb => {
                if(cat_cb.length > 0){
                    
                    let options = {
                        url: cat_cb[0].guid,
                        dest: '/home/carlos/projects/work/node/smn_strapi/public' + path_image                  // Save to /path/to/dest/image.jpg
                    }
                    console.log("\n\nmeu option: ", options);
                    try {
                        const { filename, image } = await download.image(options)
                        imageInfo(filename, async (err, info) => {
                            if (err) return console.warn(err);
                            //console.log("\n\n\ninfo da image: ", info);

                           
                            let related = {
                                    _id: new ObjectId(),
                                    ref: cat._id,
                                    kind: 'Categoria',
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

                            let update = `UPDATE nkty_posts set imported = 1 where ID = ${cat_cb[0].ID}`;
                            
                            conn.query(update, err => {
                                if(err)
                                    console.log('o post de id ', cat_cb[0] , ' não foi marcado como importado \nErro:', err)
                            });
                            console.log("\n\n\n minha imagem: ", img_obj);
                        })

                        //console.log(filename) // => /path/to/dest/image.jpg 
                    } catch (e) {
                    console.error("\n\n", e)
                    }

                    //console.log("\n no calllback: ", cat_cb[0]);
                }
            } )
        }) 
        
        /* this.findMysqlCategorys(categorys => {
            let ar_categorys = categorys.map(category => {
                console.log("\ncategoria: ", category);
                let has_category = this.getCategoryByTermid(jwt.data.jwt, stripe_categorys.data, category.term_id)
                //console.log("\n\n\ncategory: ", category, " \n\n----\n\n  has category: ", has_category.length);
                if(has_category.length == 0){
                    if( this.insertCategory(jwt.data.jwt, category) )
                        console.log("categoria: ", category.name, " incluido com sucesso!");
                    else
                        console.log("ERRO: categoria: ", category.name, " não foi incluido!");
                }
                else
                        console.log("Categoria ", category.name, " já foi incluida!");

            }) 
            
        }); */
   

        res.json("Importação finalizada com sucesso");
        
    }

    async insertCategory(jwt, category){
        
        let obj = {
                wpid: category.term_id,
                nome: category.name,
                slug: "guia/" + category.slug,
                slug_wp: category.slug,
                descricao: category.description,
                count: category.count,
                tipo: 'guia-comercial',
                wp_parent_id: category.parent
            }    

        console.log("obj: ", obj)
        let ret = await this.insertStrypeCategory(jwt, obj);
        return ret;
    }

    getCategoryByTermid(jwt, categorys, term_id) {
    //    let categorys = await this.getCategorys(jwt)

        //console.log("meus categorys: ", categorys);

        return categorys.filter(category => {
            //console.log(category.categoryname , " --- ", categoryname)
            if(category.wpid == term_id)
                return category;
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

    async insertStrypeCategory(jwt, category){
        let config = { headers: { 'Authorization': `Bearer ${jwt}` } };
        
        //console.log("\n\nconfig: ", config);
        try{
            let ret = await axios.post('http://localhost:1337/categoria', category, config);
            //console.log(ret);
            return ret;
        }
        catch(e){
            console.log("\n\n\n error: ", e);
        } 
    }

    async getCategorys(jwt){
        let config = { headers: { 'Authorization': `Bearer ${jwt}` } };
        
        //console.log("\n\nconfig: ", config);
        try{
            let ret = await axios.get('http://localhost:1337/categoria?tipo=guia-comercial',  config);
            return ret;
        }
        catch(e){
            console.log("\n\n\n error: ", e);
        }
    }

    findMysqlCategory(cat, cb){
        let sql = `SELECT * FROM nkty_posts WHERE imported = 0 and  post_type = 'attachment' and post_name = '${cat.slug_wp}' `

        //console.log("\n\n", sql, "\n\n\n")
        mysqlJson.query( sql, (error, category) => {
            
            if(!error){
                cb(category);
            }
            else{
                console.log("erro: ", error);
            }
        })
        
    }

}

module.exports = new CategoriaImageGuiaController