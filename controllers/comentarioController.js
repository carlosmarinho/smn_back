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

class ComentarioController {
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
        let stripe_comentarios = await this.getComentarios(jwt.data.jwt)
        
        console.log("minhas comentarios: ", stripe_comentarios.data, "\n\n");
        
        this.findMysqlComentarios(comentarios => {
            let ar_comentarios = comentarios.map(comentario => {
                console.log("\ncomentario: ", comentario);
                let has_comentario = this.getComentarioByCommentId(jwt.data.jwt, stripe_comentarios.data, comentario.comment_ID)
                //console.log("\n\n\ncomentario: ", comentario, " \n\n----\n\n  has comentario: ", has_comentario.length);
                if(has_comentario.length == 0){
                    if( this.insertComentario(jwt.data.jwt, comentario) )
                        console.log("comentario: ", comentario.comment_ID, " incluido com sucesso!");
                    else
                        console.log("ERRO: comentario: ", comentario.comment_ID, " não foi incluido!");
                }
                else
                        console.log("comentario ", comentario.comment_ID, " já foi incluida!");

            }) 
            
        });
   

        res.json("Importação finalizada com sucesso");
        
    }

    async insertComentario(jwt, comentario){
        let cidade = ObjectId("5b99723235e1ea4e64bbe68f");


        let obj = {
                wpid: comentario.comment_ID,
                descricao: comentario.comment_content,
                author_name: comentario.comment_author,
                author_email: comentario.comment_author_email,
                author_ip: comentario.comment_author_IP,
                aprovado: true,
                wp_post_id: comentario.comment_post_ID,
                wp_user_id: comentario.user_id
            }    

        console.log("obj: ", obj)
        let ret = await this.insertStrypeComentario(jwt, obj);
        return ret;
    }

    getComentarioByCommentId(jwt, comentarios, comment_id) {
    //    let comentarios = await this.getComentarios(jwt)

        //console.log("meus comentarios: ", comentarios);

        return comentarios.filter(comentario => {
            console.log("\n", comentario.wpid , " --- ", comment_id)
            if(comentario.wpid == comment_id)
                return comentario;
        })
    }

    async insertStrypeComentario(jwt, comentario){
        let config = { headers: { 'Authorization': `Bearer ${jwt}` } };
        
        //console.log("\n\nconfig: ", config);
        try{
            let ret = await axios.post('http://localhost:1337/comentario/', comentario, config);
            //console.log(ret);
            return ret;
        }
        catch(e){
            console.log("\n\n\n error: ", e);
        } 
    }

    async getComentarios(jwt){
        let config = { headers: { 'Authorization': `Bearer ${jwt}` } };
        
        //console.log("\n\nconfig: ", config);
        try{
            let ret = await axios.get('http://localhost:1337/comentario/',  config);
            return ret;
        }
        catch(e){
            console.log("\n\n\n error: ", e);
        }
    }


    findMysqlComentarios(cb){
  
        let sql = "SELECT * " +
        " FROM nkty_comments " +
        " WHERE comment_approved = 1" 

        console.log("\n\n", sql, "\n\n\n")
        let comentario = mysqlJson.query( sql, (error, comentarios) => {
            //console.log("aasdfsd: ", comentarios)
            if(!error){
                cb(comentarios);
            }
            else{
                console.log("erro: ", error);
            }
        })
        
    }
}

module.exports = new ComentarioController