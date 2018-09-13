const {ObjectId} = require('mongodb');
const _ = require ('lodash/core');
var slugify = require('slugify')
const MysqlJson = require('mysql-json');
const mysqlJson = new MysqlJson({
  host:'127.0.0.1',
  user:'root',
  password:'carlos',
  database:'niteroi'
});

const axios = require('axios');

class BairroController {
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
        let stripe_bairros = await this.getBairros(jwt.data.jwt)
        
        console.log("minhas bairros: ", stripe_bairros.data, "\n\n");
        
        this.findMysqlBairros(bairros => {
            let ar_bairros = bairros.map(bairro => {
                console.log("\nbairro: ", bairro);
                let has_bairro = this.getBairroByName(jwt.data.jwt, stripe_bairros.data, bairro.name)
                //console.log("\n\n\nbairro: ", bairro, " \n\n----\n\n  has bairro: ", has_bairro.length);
                if(has_bairro.length == 0){
                    if( this.insertBairro(jwt.data.jwt, bairro) )
                        console.log("bairro: ", bairro.name, " incluido com sucesso!");
                    else
                        console.log("ERRO: bairro: ", bairro.name, " não foi incluido!");
                }
                else
                        console.log("Categoria ", bairro.name, " já foi incluida!");

            }) 
            
        });
   

        res.json("Importação finalizada com sucesso");
        
    }

    async insertBairro(jwt, bairro){
        let cidade = ObjectId("5b99723235e1ea4e64bbe68f");


        let obj = {
                wpid: bairro.term_id,
                nome: bairro.name,
                slug: slugify(bairro.name, {remove: /[*+~.()'"!:@]/g, lower: true}),
                descricao: bairro.description,
                cidade: cidade
            }    

        console.log("obj: ", obj)
        let ret = await this.insertStrypeBairro(jwt, obj);
        return ret;
    }

    getBairroByName(jwt, bairros, name) {
    //    let bairros = await this.getBairros(jwt)

        //console.log("meus bairros: ", bairros);

        return bairros.filter(bairro => {
            console.log("\n", bairro.nome , " --- ", name)
            if(bairro.nome == name)
                return bairro;
        })
    }

    async insertStrypeBairro(jwt, bairro){
        let config = { headers: { 'Authorization': `Bearer ${jwt}` } };
        
        //console.log("\n\nconfig: ", config);
        try{
            let ret = await axios.post('http://localhost:1337/bairro/', bairro, config);
            //console.log(ret);
            return ret;
        }
        catch(e){
            console.log("\n\n\n error: ", e);
        } 
    }

    async getBairros(jwt){
        let config = { headers: { 'Authorization': `Bearer ${jwt}` } };
        
        //console.log("\n\nconfig: ", config);
        try{
            let ret = await axios.get('http://localhost:1337/bairro/',  config);
            return ret;
        }
        catch(e){
            console.log("\n\n\n error: ", e);
        }
    }


    findMysqlBairros(cb){
        let sql = "SELECT t.term_id, t.name, t.slug, tt.description, tt.count FROM nkty_terms t " +
        " INNER JOIN nkty_term_taxonomy tt ON t.term_id = tt.term_id AND tt.taxonomy = 'category' " +
        " WHERE description like 'Bairro%'" 

        console.log("\n\n", sql, "\n\n\n")
        let bairro = mysqlJson.query( sql, (error, bairros) => {
            //console.log("aasdfsd: ", bairros)
            if(!error){
                cb(bairros);
            }
            else{
                console.log("erro: ", error);
            }
        })
        
    }
}

module.exports = new BairroController