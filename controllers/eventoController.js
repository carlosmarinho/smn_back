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

class EventoController {
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
        let stripe_eventos = await this.getEventos(jwt.data.jwt)
        
        //console.log("minhas eventos: ", stripe_eventos.data, "\n\n");
        
        this.findMysqlEventos(eventos => {
            let ar_eventos = eventos.map(evento => {
                //console.log("\nevento: ", evento);
                let has_evento = this.getEventoByWpid(jwt.data.jwt, stripe_eventos.data, evento.ID)
                //console.log("\n\n\nevento: ", evento, " \n\n----\n\n  has evento: ", has_evento.length);
                if(has_evento.length == 0){
                    if( this.insertEvento(jwt.data.jwt, evento) ) {
                        console.log("evento: ", evento.post_title, " incluido com sucesso!");
                        let update = `UPDATE nkty_posts set imported = 1 where post_type = 'jv_events' and ID = ${evento.ID}`;
                        console.log("\n\nUPDATE: ", update, "\n")
                        conn.query(update, err => {
                            if(err)
                                console.log('o post de id ', cat_cb[0] , ' não foi marcado como importado \nErro:', err)
                        });
                    }
                    else
                        console.log("ERRO: evento: ", evento.name, " não foi incluido!");
                }
                else
                        console.log("Categoria ", evento.name, " já foi incluida!");

            }) 
            
        });
   

        res.json("Importação finalizada com sucesso");
        
    }

    async insertEvento(jwt, evento){
        let cidade = ObjectId("5ba26f813a018f42215a36a0");

        let classificacao_indicativa = 'sem classificação indicativa';
        if(evento.classificacao_indicativa)
            classificacao_indicativa = evento.classificacao_indicativa;

        let recorrencia = 'sem recorrência';
        if( evento.recorrencia)
            recorrencia = evento.recorrencia;

        

        let obj = {
                wpid: evento.ID,
                titulo: evento.post_title,
                descricao: evento.post_content,
                slug: evento.slug,
                createdAt: evento.post_date,
                updatedAt: evento.post_modified,
                wp_user_id: evento.post_author,
                classificacao_indicativa: classificacao_indicativa,
                preco: evento.preco,
                couvert: evento.couvert,
                recorrencia: recorrencia,
                inicio: evento.inicio,
                fim: evento.fim,
                hora_inicio: evento.hora_inicio,
                hora_fim: evento.hora_fim,
                cidade: cidade,
                imported_category: false,
                imported_tag: false
            }    

        //console.log("obj: ", obj)
        let ret = await this.insertStrypeEvento(jwt, obj);
        return ret;
    }

    getEventoByWpid(jwt, eventos, ID) {
    //    let eventos = await this.getEventos(jwt)

        //console.log("meus eventos: ", eventos);

        return eventos.filter(evento => {
            //console.log("\n ------------------------->>>>>>", evento.wpid , " --- ", ID)
            if(evento.wpid == ID)
                return evento;
        })
    }

    async insertStrypeEvento(jwt, evento){
        let config = { headers: { 'Authorization': `Bearer ${jwt}` } };
        
        //console.log("\n\nconfig: ", config);
        try{
            let ret = await axios.post('http://localhost:1337/evento/', evento, config);
            //console.log(ret);
            return ret;
        }
        catch(e){

            console.log("\n\n\n error insert strypeevento: ", e, "\n\nevento object erro: ", evento);
        } 
    }

    async getEventos(jwt){
        let config = { headers: { 'Authorization': `Bearer ${jwt}` } };
        
        //console.log("\n\nconfig: ", config);
        try{
            let ret = await axios.get('http://localhost:1337/evento/',  config);
            return ret;
        }
        catch(e){
            console.log("\n\n\n error getEventos: ", e.Error);
        }
    }


    findMysqlEventos(cb){

        let sql = "SELECT p.ID, p.post_author, p.post_title, p.post_content, p.post_name as slug, p.post_date, p.post_modified, " +
        "(SELECT meta_value FROM nkty_postmeta WHERE meta_key = 'events_classify' and post_id = p.ID ) as classificacao_indicativa, " +
        "(SELECT meta_value FROM nkty_postmeta WHERE meta_key = 'events_price' and post_id = p.ID) as preco, " +
        "(SELECT meta_value FROM nkty_postmeta WHERE meta_key = 'events_couvert' and post_id = p.ID) as couvert, " +
        "(SELECT meta_value FROM nkty_postmeta WHERE meta_key = 'events_recurrency' and post_id = p.ID) as recorrencia, " +
        "(SELECT meta_value FROM nkty_postmeta WHERE meta_key = 'begin_date' and post_id = p.ID) as inicio, " +
        "(SELECT meta_value FROM nkty_postmeta WHERE meta_key = 'end_date' and post_id = p.ID) as fim, " +
        "(SELECT meta_value FROM nkty_postmeta WHERE meta_key = 'begin_hour' and post_id = p.ID) as hora_inicio, " +
        "(SELECT meta_value FROM nkty_postmeta WHERE meta_key = 'end_hour' and post_id = p.ID) as hora_fim " +
        " FROM nkty_posts p " +
        " WHERE p.imported = 1 and (p.post_status = 'publish' or p.post_status = 'published') and p.post_type = 'jv_events' " +
        " order by ID asc limit 300 ";
        //"  ) limit 100";

        console.log("\n\n", sql, "\n\n\n")
        let evento = mysqlJson.query( sql, (error, eventos) => {
            //console.log("aasdfsd: ", eventos)
            if(!error){
                cb(eventos);
            }
            else{
                console.log("erro mysql eventos: ", error);
            }
        })
        
    }
}

module.exports = new EventoController