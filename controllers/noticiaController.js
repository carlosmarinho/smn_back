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

class NoticiaController {
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
        
        console.log("minhas noticias: ", stripe_noticias.data, "\n\n");
        
        this.findMysqlNoticias(noticias => {
            let ar_noticias = noticias.map(noticia => {
                console.log("\nnoticia: ", noticia);
                let has_noticia = this.getNoticiaByWpid(jwt.data.jwt, stripe_noticias.data, noticia.ID)
                //console.log("\n\n\nnoticia: ", noticia, " \n\n----\n\n  has noticia: ", has_noticia.length);
                if(has_noticia.length == 0){
                    if( this.insertNoticia(jwt.data.jwt, noticia) )
                        console.log("noticia: ", noticia.name, " incluido com sucesso!");
                    else
                        console.log("ERRO: noticia: ", noticia.name, " não foi incluido!");
                }
                else
                        console.log("Categoria ", noticia.name, " já foi incluida!");

            }) 
            
        });
   

        res.json("Importação finalizada com sucesso");
        
    }

    async insertNoticia(jwt, noticia){
        let cidade = ObjectId("5b99723235e1ea4e64bbe68f");


        let obj = {
                wpid: noticia.ID,
                nome: noticia.name,
                slug: slugify(noticia.name, {remove: /[*+~.()'"!:@]/g, lower: true}),
                descricao: noticia.description,
                cidade: cidade
            }    

        console.log("obj: ", obj)
        let ret = await this.insertStrypeNoticia(jwt, obj);
        return ret;
    }

    getNoticiaByWpid(jwt, noticias, wpid) {
    //    let noticias = await this.getNoticias(jwt)

        //console.log("meus noticias: ", noticias);

        return noticias.filter(noticia => {
            console.log("\n", noticia.wpid , " --- ", wpid)
            if(noticia.nome == name)
                return noticia;
        })
    }

    async insertStrypeNoticia(jwt, noticia){
        let config = { headers: { 'Authorization': `Bearer ${jwt}` } };
        
        //console.log("\n\nconfig: ", config);
        try{
            let ret = await axios.post('http://localhost:1337/noticia/', noticia, config);
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
            let ret = await axios.get('http://localhost:1337/noticia/',  config);
            return ret;
        }
        catch(e){
            console.log("\n\n\n error: ", e);
        }
    }


    findMysqlNoticias(cb){
        let sql = "SELECT t.term_id, t.name, t.slug, tt.description, tt.count FROM nkty_terms t " +
        " INNER JOIN nkty_term_taxonomy tt ON t.term_id = tt.term_id AND tt.taxonomy = 'category' " +
        " WHERE description like 'Noticia%'" 

        console.log("\n\n", sql, "\n\n\n")
        let noticia = mysqlJson.query( sql, (error, noticias) => {
            //console.log("aasdfsd: ", noticias)
            if(!error){
                cb(noticias);
            }
            else{
                console.log("erro: ", error);
            }
        })
        
    }
}

module.exports = new NoticiaController