const _ = require ('lodash/core');
const MysqlJson = require('mysql-json');
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
        let ret = await axios.post('http://localhost:1337/auth/local', { identifier: 'adm_manager', password: '3ngenhoc2' })
        
        return ret;
    }

    async migrate(req, res){

        let jwt = await this.authenticate();
        console.log("jwt: ", jwt.data.jwt)
        let stripe_users = await this.getUsers(jwt.data.jwt)

        console.log("meus usuarios: ", stripe_users.data, "\n\n");

        let users = this.findMysqlUsers(users => {
            users.map(user => {
                console.log("\n\n\nusuario: ", user);
            }) 
            
        });
        /* let ar_user = users.map(user => {
            return user;    
        }) */

        //console.log("\n\n\n\n mysql user: ", ar_user)

        res.json(stripe_users.data);
        
    }

    async getUsers(jwt){
        let config = { headers: { 'Authorization': `Bearer ${jwt}` } };
        
        console.log("\n\nconfig: ", config);
        try{
            let ret = await axios.get('http://localhost:1337/user/',  config);
            return ret;
        }
        catch(e){
            console.log("\n\n\n error: ", e);
        }
    }

    findMysqlUsers(cb){
        
        let user = mysqlJson.query("SELECT * FROM nkty_users", (error, users) => {
            console.log("aasdfsd: ", users)
            if(!error){
                
                cb(users);
            }
        })

        
        
    }
}

module.exports = new UserController