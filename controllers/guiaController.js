const {ObjectId} = require('mongodb');
const _ = require ('lodash/core');
var slugify = require('slugify')
const MysqlJson = require('mysql-json');
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

class GuiaController {
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
        let stripe_guias = await this.getGuias(jwt.data.jwt)
        
        //console.log("minhas guias: ", stripe_guias.data, "\n\n");
        
        this.findMysqlGuias(guias => {
            let ar_guias = guias.map(guia => {
                //console.log("\nguia: ", guia);
                let has_guia = this.getGuiaByWpid(jwt.data.jwt, stripe_guias.data, guia.ID)
                //console.log("\n\n\nguia: ", guia, " \n\n----\n\n  has guia: ", has_guia.length);
                if(has_guia.length == 0){
                    if( this.insertGuia(jwt.data.jwt, guia) ) {
                        console.log("guia: ", guia.post_title, " incluido com sucesso!");
                        let update = `UPDATE nkty_posts set imported = 1 where post_type = 'item' and ID = ${guia.ID}`;
                        console.log("\n\nUPDATE: ", update, "\n")
                        conn.query(update, err => {
                            if(err)
                                console.log('o post de id ', cat_cb[0] , ' não foi marcado como importado \nErro:', err)
                        });
                    }
                    else
                        console.log("ERRO: guia: ", guia.name, " não foi incluido!");
                }
                else
                        console.log("Categoria ", guia.name, " já foi incluida!");

            }) 
            
        });
   

        res.json("Importação finalizada com sucesso");
        
    }

    async insertGuia(jwt, guia){
        let cidade = ObjectId("5ba26f813a018f42215a36a0");

        let nao_existe_mais = false;
        if(guia.javo_this_exist_no_more_item == 'use')
            nao_existe_mais = true;

        let obj = {
                wpid: guia.ID,
                titulo: guia.post_title,
                descricao: guia.post_content,
                slug: guia.slug,
                createdAt: guia.post_date,
                updatedAt: guia.post_modified,
                wp_user_id: guia.post_author,
                endereco: guia.endereco,
                complemento: guia.complemento,
                cep: guia.cep,
                telefone: guia.telefone,
                celular: guia.celular,
                email: guia.email,
                latitude: guia.latitude,
                longitude: guia.longitude,
                website: guia.website,
                facebook: guia.facebook,
                googleplus: guia.googleplus,
                twitter: guia.twitter,
                nao_existe_mais: nao_existe_mais,
                cidade: cidade,
                imported_category: false,
                imported_tag: false,
                tipo: 'guia comercial'
            }    

        console.log("obj: ", obj)
        let ret = await this.insertStrypeGuia(jwt, obj);
        return ret;
    }

    getGuiaByWpid(jwt, guias, ID) {
    //    let guias = await this.getGuias(jwt)

        //console.log("meus guias: ", guias);

        return guias.filter(guia => {
            //console.log("\n ------------------------->>>>>>", guia.wpid , " --- ", ID)
            if(guia.wpid == ID)
                return guia;
        })
    }

    async insertStrypeGuia(jwt, guia){
        let config = { headers: { 'Authorization': `Bearer ${jwt}` } };
        
        //console.log("\n\nconfig: ", config);
        try{
            let ret = await axios.post('http://localhost:1337/guia/', guia, config);
            //console.log(ret);
            return ret;
        }
        catch(e){

            console.log("\n\n\n error insert strypeguia: ", e.Error, "\nguia object erro: ", guia);
        } 
    }

    async getGuias(jwt){
        let config = { headers: { 'Authorization': `Bearer ${jwt}` } };
        
        //console.log("\n\nconfig: ", config);
        try{
            let ret = await axios.get('http://localhost:1337/guia/',  config);
            return ret;
        }
        catch(e){
            console.log("\n\n\n error getGuias: ", e.Error);
        }
    }


    findMysqlGuias(cb){


        let sql = "SELECT p.ID, p.post_author, p.post_title, p.post_content, p.post_name as slug, p.post_date, p.post_modified, " +
        "(SELECT meta_value FROM nkty_postmeta WHERE meta_key = 'jv_item_address' and post_id = p.ID order by post_id desc limit 1 ) as endereco, " +
        "(SELECT meta_value FROM nkty_postmeta WHERE meta_key = 'jv_item_complemento' and post_id = p.ID order by post_id desc limit 1) as complemento, " +
        "(SELECT meta_value FROM nkty_postmeta WHERE meta_key = 'jv_item_cep' and post_id = p.ID order by post_id desc limit 1) as cep, " +
        "(SELECT meta_value FROM nkty_postmeta WHERE meta_key = 'jv_item_phone' and post_id = p.ID order by post_id desc limit 1) as telefone, " +
        "(SELECT meta_value FROM nkty_postmeta WHERE meta_key = 'jv_item_celular' and post_id = p.ID order by post_id desc limit 1) as celular, " +
        "(SELECT meta_value FROM nkty_postmeta WHERE meta_key = 'jv_item_email' and post_id = p.ID order by post_id desc limit 1) as email, " +
        "(SELECT meta_value FROM nkty_postmeta WHERE meta_key = 'jv_item_lat' and post_id = p.ID order by post_id desc limit 1) as latitude, " +
        "(SELECT meta_value FROM nkty_postmeta WHERE meta_key = 'jv_item_lng' and post_id = p.ID order by post_id desc limit 1) as longitude, " +
        "(SELECT meta_value FROM nkty_postmeta WHERE meta_key = 'jv_item_website' and post_id = p.ID order by post_id desc limit 1) as website, " +
        "(SELECT meta_value FROM nkty_postmeta WHERE meta_key = 'jv_item_facebook' and post_id = p.ID order by post_id desc limit 1) as facebook, " +
        "(SELECT meta_value FROM nkty_postmeta WHERE meta_key = 'jv_item_googleplus' and post_id = p.ID order by post_id desc limit 1) as googleplus, " +
        "(SELECT meta_value FROM nkty_postmeta WHERE meta_key = 'jv_item_twitter' and post_id = p.ID order by post_id desc limit 1) as twitter, " +
        "(SELECT meta_value FROM nkty_postmeta WHERE meta_key = 'javo_this_exist_no_more_item' and post_id = p.ID order by post_id desc limit 1) as nao_existe_mais " +
        " FROM nkty_posts p " +
        " WHERE p.imported = 0 and (p.post_status = 'publish' or p.post_status = 'published') and p.post_type = 'item' " +
        " order by ID asc limit 300 ";
        //"  ) limit 100";

        console.log("\n\n", sql, "\n\n\n")
        let guia = mysqlJson.query( sql, (error, guias) => {
            //console.log("aasdfsd: ", guias)
            if(!error){
                cb(guias);
            }
            else{
                console.log("erro mysql guias: ", error);
            }
        })
        
    }
}

module.exports = new GuiaController