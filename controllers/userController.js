const {ObjectId} = require('mongodb');
const _ = require ('lodash/core');
const MysqlJson = require('mysql-json');
const keys = require("../config/keys");
const mysqlJson = new MysqlJson({
  host:'127.0.0.1',
  user:'root',
  password:'carlos',
  database:'niteroi'
});

const axios = require('axios');

class UserController {
    constructor(){

    }

    viewAll(req, res){

    }

    async authenticate(){
        let ret = await axios.post(`${keys.URL_API}/auth/local`, { identifier: 'adm_manager', password: keys.PASSWORD_API })
        
        return ret;
    }

    async migrate(req, res){

        let jwt = await this.authenticate();
        //console.log("jwt: ", jwt.data.jwt);
        let stripe_users = await this.getUsers(jwt.data.jwt)
        
        console.log("meus usuarios: ", stripe_users.data, "\n\n");
        
        this.findMysqlUsers(users => {
            let ar_users = users.map(user => {
                
                let has_user = this.getUserByUsername(jwt.data.jwt, stripe_users.data, user.user_login)
                //console.log("\n\n\nuser: ", user, " \n\n----\n\n  has user: ", has_user.length);
                if(has_user.length == 0){
                    if( this.insertUser(jwt.data.jwt, user) )
                        console.log("usuario: ", user.user_email, " incluido com sucesso!");
                    else
                        console.log("ERRO: usuario: ", user.user_login, " não foi incluido!");
                    //return user;
                }

            }) 

            //console.log("mysql_users: ", ar_users)
            
        });
        /* let ar_user = users.map(user => {
            return user;    
        }) */

        //console.log("\n\n\n\n mysql user: ", )

        res.json("Importação finalizada com sucesso");
        
    }

    async insertUser(jwt, user){
        
        let role = ObjectId("5ba26f813a018f42215a36a0");
        let obj = {
                username: user.user_login,
                email: user.user_email,
                password: user.user_pass,
                slug: user.user_nicename,
                createdAt: user.user_registered,
                apelido: user.nickname,
                nome: user.first_name,
                sobrenome: user.last_name,
                descricao: user.description,
                role: role
            }    

        let ret = await this.insertStrypeUser(jwt, obj);
        return ret;
        console.log("obj: ", obj.email)
    }

    getUserByUsername(jwt, users, username) {
    //    let users = await this.getUsers(jwt)

        //console.log("meus users: ", users);

        return users.filter(user => {
            //console.log(user.username , " --- ", username)
            if(user.user_login == username)
                return user;
        })
    }

    async insertStrypeUser(jwt, user){
        let config = { headers: { 'Authorization': `Bearer ${jwt}` } };
        
        //console.log("\n\nconfig: ", config);
        try{
            let ret = await axios.post(`${keys.URL_API}/user/`, user, config);
            //console.log(ret);
            return ret;
        }
        catch(e){
            console.log("\n\n\n error: ", e);
        }
    }

    async getUsers(jwt){
        let config = { headers: { 'Authorization': `Bearer ${jwt}` } };
        
        //console.log("\n\nconfig: ", config);
        try{
            let ret = await axios.get(`${keys.URL_API}/user/`,  config);
            return ret;
        }
        catch(e){
            console.log("\n\n\n error: ", e);
        }
    }


    findMysqlUsers(cb){
        let sql = "SELECT u.user_login, u.user_email, u.user_pass, u.user_nicename, u.user_registered, " +
        " ( SELECT um.meta_value FROM nkty_usermeta um WHERE um.user_id = u.ID AND um.meta_key = 'nickname' ) as nickname, " +
        " ( SELECT um.meta_value FROM nkty_usermeta um WHERE um.user_id = u.ID AND um.meta_key = 'first_name' ) as first_name, " +
        " ( SELECT um.meta_value FROM nkty_usermeta um WHERE um.user_id = u.ID AND um.meta_key = 'last_name' ) as last_name, " +
        " ( SELECT um.meta_value FROM nkty_usermeta um WHERE um.user_id = u.ID AND um.meta_key = 'description' ) as description " +
        " FROM nkty_users u limit 1100,100";

        console.log("\n\n", sql, "\n\n\n")
        let user = mysqlJson.query( sql, (error, users) => {
            //console.log("aasdfsd: ", users)
            if(!error){
                cb(users);
            }
            else{
                console.log("erro: ", error);
            }
        })

        
        
    }
}

module.exports = new UserController