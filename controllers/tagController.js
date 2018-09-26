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

class TagController {
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
        let stripe_tags = await this.getTags(jwt.data.jwt)
        
        console.log("minhas tags: ", stripe_tags.data, "\n\n");
        
        this.findMysqlTags(tags => {
            let ar_tags = tags.map(tag => {
                //console.log("\ntag: ", tag);
                let has_tag = this.getTagBySlug(jwt.data.jwt, stripe_tags.data, tag.slug)
                //console.log("\n\n\ntag: ", tag, " \n\n----\n\n  has tag: ", has_tag.length);
                if(has_tag.length == 0){
                    if( this.insertTag(jwt.data.jwt, tag) )
                        console.log("tag: ", tag.name, " incluido com sucesso!");
                    else
                        console.log("ERRO: tag: ", tag.name, " não foi incluido!");
                }
                else
                        console.log("Tag ", tag.name, " já foi incluida!");

            }) 
            
        });
   

        res.json("Importação finalizada com sucesso");
        
    }

    async insertTag(jwt, tag){
        
        let obj = {
                wpid: tag.term_id,
                nome: tag.name,
                slug: slugify(tag.name, {remove: /[*+~.()'"!:@]/g, lower: true}),
                slug_wp: tag.slug,
                descricao: tag.description,
                count: tag.count
            }    

        console.log("obj: ", obj)
        let ret = await this.insertStrypeTag(jwt, obj);
        return ret;
    }

    getTagBySlug(jwt, tags, slug) {
        console.log(tags);
    //    let tags = await this.getTags(jwt)

        //console.log("meus tags: ", tags);

        return tags.filter(tag => {
            //console.log("\n\n", tag.slug , " --- ", slug)
            if(tag.slug == slug)
                return tag;
        })
    }

    async insertStrypeTag(jwt, tag){
        let config = { headers: { 'Authorization': `Bearer ${jwt}` } };
        
        //console.log("\n\nconfig: ", config);
        try{
            let ret = await axios.post('http://localhost:1337/tag/', tag, config);
            //console.log(ret);
            return ret;
        }
        catch(e){
            console.log("\n\n\n error: ", e);
        }  
    }

    async getTags(jwt){
        let config = { headers: { 'Authorization': `Bearer ${jwt}` } };
        
        //console.log("\n\nconfig: ", config);
        try{
            let ret = await axios.get('http://localhost:1337/tag/',  config);
            console.log("as tags **************************************: ", ret)
            return ret;
        }
        catch(e){
            console.log("\n\n\n error: ", e);
        }
    }


    findMysqlTags(cb){
        let sql = "SELECT t.term_id, t.name, t.slug, tt.description, tt.count FROM nkty_terms t " +
        " INNER JOIN nkty_term_taxonomy tt ON t.term_id = tt.term_id AND tt.taxonomy = 'post_tag' " +
        " WHERE (tt.term_id <161 or tt.term_id > 185) and tt.count > 0" 

        console.log("\n\n", sql, "\n\n\n")
        let tag = mysqlJson.query( sql, (error, tags) => {
            //console.log("aasdfsd: ", tags)
            if(!error){
                cb(tags);
            }
            else{
                console.log("erro: ", error);
            }
        })
        
    }
}

module.exports = new TagController