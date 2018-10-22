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

class ServicoController {
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
        let stripe_servicos = await this.getServicos(jwt.data.jwt)
        
        console.log("minhas servicos: ", stripe_servicos.data, "\n\n");
        
        this.findMysqlServicos(servicos => {
            let ar_servicos = servicos.map(servico => {
                //console.log("\nservico: ", servico);
                let has_servico = this.getServicoByWpid(jwt.data.jwt, stripe_servicos.data, servico.ID)
                //console.log("\n\n\nservico: ", servico, " \n\n----\n\n  has servico: ", has_servico.length);
                if(has_servico.length == 0){
                    if( this.insertServico(jwt.data.jwt, servico) ) {
                        console.log("servico: ", servico.post_title, " incluido com sucesso!");
                        let update = `UPDATE nkty_posts set imported = 1 where post_type = 'servico' and ID = ${servico.ID}`;
                        console.log("\n\nUPDATE: ", update, "\n")
                        conn.query(update, err => {
                            if(err)
                                console.log('o post de id ', cat_cb[0] , ' não foi marcado como importado \nErro:', err)
                        });
                    }
                    else
                        console.log("ERRO: servico: ", servico.name, " não foi incluido!");
                }
                else
                        console.log("Categoria ", servico.name, " já foi incluida!");

            }) 
            
        });
   

        res.json("Importação finalizada com sucesso");
        
    }

    async insertServico(jwt, servico){
        let cidade = ObjectId("5ba26f813a018f42215a36a0");

        let nao_existe_mais = false;
        if(servico.javo_this_exist_no_more_servico == 'use')
            nao_existe_mais = true;

        let obj = {
                wpid: servico.ID,
                titulo: servico.post_title,
                descricao: servico.post_content,
                slug: servico.slug,
                createdAt: servico.post_date,
                updatedAt: servico.post_modified,
                wp_user_id: servico.post_author,
                endereco: servico.endereco,
                complemento: servico.complemento,
                cep: servico.cep,
                telefone: servico.telefone,
                celular: servico.celular,
                email: servico.email,
                latitude: servico.latitude,
                longitude: servico.longitude,
                website: servico.website,
                facebook: servico.facebook,
                googleplus: servico.googleplus,
                twitter: servico.twitter,
                nao_existe_mais: nao_existe_mais,
                cidade: cidade,
                imported_category: false,
                imported_tag: false,
                tipo: 'guia de serviços'
            }    

        console.log("obj: ", obj)
        let ret = await this.insertStrypeServico(jwt, obj);
        return ret;
    }

    getServicoByWpid(jwt, servicos, ID) {
    //    let servicos = await this.getServicos(jwt)

        //console.log("meus servicos: ", servicos);

        return servicos.filter(servico => {
            //console.log("\n ------------------------->>>>>>", servico.wpid , " --- ", ID)
            if(servico.wpid == ID)
                return servico;
        })
    }

    async insertStrypeServico(jwt, servico){
        let config = { headers: { 'Authorization': `Bearer ${jwt}` } };
        
        //console.log("\n\nconfig: ", config);
        try{
            let ret = await axios.post('http://localhost:1337/guia/', servico, config);
            //console.log(ret);
            return ret;
        }
        catch(e){

            console.log("\n\n\n error insert strypeservico: ", e.Error, "\nservico object erro: ", servico);
        } 
    }

    async getServicos(jwt){
        let config = { headers: { 'Authorization': `Bearer ${jwt}` } };
        
        //console.log("\n\nconfig: ", config);
        try{
            let ret = await axios.get('http://localhost:1337/guia?tipo=guia de serviços',  config);
            return ret;
        }
        catch(e){
            console.log("\n\n\n error getServicos: ", e.Error);
        }
    }


    findMysqlServicos(cb){


        let sql = "SELECT p.ID, p.post_author, p.post_title, p.post_content, p.post_name as slug, p.post_date, p.post_modified, " +
        "(SELECT meta_value FROM nkty_postmeta WHERE meta_key = 'jv_servico_address' and post_id = p.ID order by post_id desc limit 1 ) as endereco, " +
        "(SELECT meta_value FROM nkty_postmeta WHERE meta_key = 'jv_servico_complemento' and post_id = p.ID order by post_id desc limit 1) as complemento, " +
        "(SELECT meta_value FROM nkty_postmeta WHERE meta_key = 'jv_servico_cep' and post_id = p.ID order by post_id desc limit 1) as cep, " +
        "(SELECT meta_value FROM nkty_postmeta WHERE meta_key = 'jv_servico_phone' and post_id = p.ID order by post_id desc limit 1) as telefone, " +
        "(SELECT meta_value FROM nkty_postmeta WHERE meta_key = 'jv_servico_celular' and post_id = p.ID order by post_id desc limit 1) as celular, " +
        "(SELECT meta_value FROM nkty_postmeta WHERE meta_key = 'jv_servico_email' and post_id = p.ID order by post_id desc limit 1) as email, " +
        "(SELECT meta_value FROM nkty_postmeta WHERE meta_key = 'jv_servico_lat' and post_id = p.ID order by post_id desc limit 1) as latitude, " +
        "(SELECT meta_value FROM nkty_postmeta WHERE meta_key = 'jv_servico_lng' and post_id = p.ID order by post_id desc limit 1) as longitude, " +
        "(SELECT meta_value FROM nkty_postmeta WHERE meta_key = 'jv_servico_website' and post_id = p.ID order by post_id desc limit 1) as website, " +
        "(SELECT meta_value FROM nkty_postmeta WHERE meta_key = 'jv_servico_facebook' and post_id = p.ID order by post_id desc limit 1) as facebook, " +
        "(SELECT meta_value FROM nkty_postmeta WHERE meta_key = 'jv_servico_googleplus' and post_id = p.ID order by post_id desc limit 1) as googleplus, " +
        "(SELECT meta_value FROM nkty_postmeta WHERE meta_key = 'jv_servico_twitter' and post_id = p.ID order by post_id desc limit 1) as twitter, " +
        "(SELECT meta_value FROM nkty_postmeta WHERE meta_key = 'javo_this_exist_no_more_servico' and post_id = p.ID order by post_id desc limit 1) as nao_existe_mais " +
        " FROM nkty_posts p " +
        " WHERE p.imported = 0 and (p.post_status = 'publish' or p.post_status = 'published') and p.post_type = 'servico' " +
        " order by ID asc limit 300 ";
        //"  ) limit 100";

        console.log("\n\n", sql, "\n\n\n")
        let servico = mysqlJson.query( sql, (error, servicos) => {
            //console.log("aasdfsd: ", servicos)
            if(!error){
                cb(servicos);
            }
            else{
                console.log("erro mysql servicos: ", error);
            }
        })
        
    }
}

module.exports = new ServicoController