const {ObjectId} = require('mongodb');
const _ = require ('lodash/core');
const slugify = require('slugify')
const download = require('image-downloader')
const MysqlJson = require('mysql-json');
const imageInfo = require('image-info');
const path = require("path");
const uuid = require('uuid/v4');
const mysql = require('mysql');
const keys = require("../config/keys");


const mysql_con = {
    host:'127.0.0.1',
    user:'root',
    password:'carlos',
    database:'niteroi'
}

const mysqlJson = new MysqlJson(mysql_con);

const conn = mysql.createConnection(mysql_con);

const axios = require('axios');

class guiaObjectToArrayController {
    constructor(){

    }

    viewAll(req, res){

    }

    async authenticate(){
        let ret = await axios.post(`${keys.URL_API}/auth/local`, { identifier: 'adm_manager', password: keys.PASSWORD_API  })
        
        return ret;
    }

    async migrate(req, res){
	
	console.log("params: ", req.params, " --- ", req.query)
        
	let jwt = await this.authenticate();
        //console.log("jwt: ", jwt.data.jwt);
        let stripe_guias = await this.getGuias(jwt.data.jwt, req.query.start)
        console.log('stripe_guias: ', stripe_guias.data.length);

        await stripe_guias.data.map(async guia =>  {
	    
	    /*console.log("tamanho: ", guia.array_categorias.length);
   	    if(guia.array_categorias.length>0)
	    	return; */

            console.log("\n\n\n\nGuias ----------------->: ", guia.titulo, " --- wpid: ", guia.wpid)

            let categorias = guia.categorias.map(categoria => {
                if(! categoria)
                    return null;
                let obj = {}
                obj._id = categoria._id;
                obj.nome = categoria.nome;
                obj.descricao = categoria.descricao;
                obj.slug = categoria.slug;
                obj.parent_id = categoria.parent_id;

                return obj;
            })

            let bairros = guia.bairros.map(bairro => {
                if(! bairro)
                    return null;
                let obj = {}
                obj._id = bairro._id;
                obj.nome = bairro.nome;
                obj.descricao = bairro.descricao;
                obj.slug = bairro.slug;
                obj.cidade_id = bairro.cidade;

                return obj;
            })

            let tags = guia.tags.map(tag => {
                if(! tag)
                    return null;
                let obj = {}
                obj._id = tag._id;
                obj.nome = tag.nome;
                obj.descricao = tag.descricao;
                obj.slug = tag.slug;
                obj.cidade_id = tag.cidade;

                return obj;
            })
 

            let obj = {array_categorias: categorias, array_bairros: bairros, array_tags: tags}

            console.log("obj: ", obj);

            await this.updateStrypeAssociacao(jwt.data.jwt, guia._id, obj);

            
        }) 
	console.log("finalizou de inserir o await");

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

    async updateStrypeAssociacao(jwt, guia_id, obj){
        let config = { headers: { 'Authorization': `Bearer ${jwt}` } };
        
        //console.log("\n\nconfig: ", config);
        try{
	    let url_update = `${keys.URL_API}/guia/${guia_id}`
	    console.log('\n\nupdate: ', url_update);
            let ret = await axios.put(url_update, obj, config);
	    console.log("obj: ", obj);
            return ret;
        }
        catch(e){
            console.log("\n\n\n error updateStrypeAssociaaco: ", e.message, "\n\nobjeto q deu erro:", obj);
        } 
    }

    async insertStrypeGuia(jwt, guia){
        let config = { headers: { 'Authorization': `Bearer ${jwt}` } };
        
        //console.log("\n\nconfig: ", config);
        try{
            let ret = await axios.post(`${keys.URL_API}/guia`, guia, config);
            //console.log(ret);
            return ret;
        }
        catch(e){
            console.log("\n\n\n error insertStrypeGuia: ", e.message);
        } 
    }

    async getCategoryByWpid(jwt, wpid){
        let config = { headers: { 'Authorization': `Bearer ${jwt}` } };
        //console.log(`\n\nPegando a categoria: http://localhost:1337/categoria?wpid=${wpid}`);
        //console.log("\n\nconfig: ", config);
        try{
            let ret = await axios.get(`${keys.URL_API}/categoria?populateAssociation=false&wpid=${wpid}`,  config);
            //console.log("\n\nretorno: ", ret);
            return ret;
        }
        catch(e){
            console.log("\n\n\n error getCategoryByWpid: ", e.message);
        }
    }

    async getGuias(jwt, start){
        let config = { headers: { 'Authorization': `Bearer ${jwt}` } };
        
        //console.log("\n\nconfig: ", config);
        try{
	    let str_con = `${keys.URL_API}/guia?populateAssociation=true&_start=${start}&_limit=5`;
	    console.log("string conexao: ", str_con);
            //let ret = await axios.get(`${keys.URL_API}/guia?imported_category=false&_start=0&_limit=100`,  config);
            let ret = await axios.get(str_con,  config);
            return ret;
        }
        catch(e){
            console.log("\n\n\n error getGuias: ", e.message);
        }
    }


}

module.exports = new guiaObjectToArrayController
