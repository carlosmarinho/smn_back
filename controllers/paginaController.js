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

class PaginaController {
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
        let stripe_paginas = await this.getPaginas(jwt.data.jwt)
        
        //console.log("minhas paginas: ", stripe_paginas.data, "\n\n");
        
        this.findMysqlPaginas(paginas => {
            let ar_paginas = paginas.map(pagina => {
                //console.log("\npagina: ", pagina);
                let has_pagina = this.getPaginaByWpid(jwt.data.jwt, stripe_paginas.data, pagina.ID)
                //console.log("\n\n\npagina: ", pagina, " \n\n----\n\n  has pagina: ", has_pagina.length);
                if(has_pagina.length == 0){
                    if( this.insertPagina(jwt.data.jwt, pagina) ) {
                        console.log("pagina: ", pagina.post_title, " incluido com sucesso!");
                        let update = `UPDATE nkty_posts set imported = 1 where post_type = 'post' and ID = ${pagina.ID}`;
                        console.log("\n\nUPDATE: ", update, "\n")
                        conn.query(update, err => {
                            if(err)
                                console.log('o post de id ', cat_cb[0] , ' não foi marcado como importado \nErro:', err)
                        });
                    }
                    else
                        console.log("ERRO: pagina: ", pagina.post_title, " não foi incluido!");
                }
                else
                        console.log("Categoria ", pagina.post_title, " já foi incluida!");

            }) 
            
        });
   

        res.json("Importação finalizada com sucesso");
        
    }

    async insertPagina(jwt, pagina){
        let cidade = null;
        let bairro = null;
        
        if(!(pagina.post_title.includes('bairro') || pagina.post_title.includes('Bairro')))
            cidade = ObjectId("5ba26f813a018f42215a36a0");
        else{
            console.log('titulo da página: ', pagina.post_title, ` tem Engenhoca: `, pagina.post_title.includes('Engenhoca') );
            console.log('titulo da página: ', pagina.post_title, ` tem Fonseca: `, pagina.post_title.includes('Fonseca') );
            if(pagina.post_title.includes('Engenhoca'))
                bairro = await this.getBairroBySlug(jwt, 'engenhoca')
            if(pagina.post_title.includes('Fonseca'))
                bairro = await this.getBairroBySlug(jwt, 'fonseca')
            if(pagina.post_title.includes('Barreto'))
                bairro = await this.getBairroBySlug(jwt, 'barreto')
            if(pagina.post_title.includes('Ilha'))
                bairro = await this.getBairroBySlug(jwt, 'ilha-da-conceicao')
            if(pagina.post_title.includes('Icara'))
                bairro = await this.getBairroBySlug(jwt, 'icarai')
        }

        if(bairro && bairro.data.length > 0)
            bairro = bairro.data[0]._id;
        else    
            bairro = null;
            
        //console.log('cidade: ', cidade);
        //console.log('bairro: ', bairro);

        let obj = {
                wpid: pagina.ID,
                nome: pagina.post_title,
                descricao: this.processDescricao(pagina.post_content),
                slug: pagina.slug,
                cidade: cidade,
                bairro: bairro,
                createdAt: pagina.post_date,
                updatedAt: pagina.post_modified,
                wp_user_id: pagina.post_author
            }    

        let ret = await this.insertStrypePagina(jwt, obj);
        return ret;
    }

    processDescricao(descricao){

        descricao = descricao.replace('id=\"HOTWordsTxt\"', '');

        let generatedImages = '<ul>';
        if(descricao.includes('images=\"')){
            
            let newDesc = descricao.split('images=\"');
            newDesc = newDesc[1].split(',')
            newDesc.map(img => {
                generatedImages = generatedImages + `<li><img src="${img}"></li>`
            })
            generatedImages += '</ul>';
            if(descricao.includes('images=\"151796,148074,143821,143819,143818,143817,143796,143816,143742,143741,146629,124579,157474\"'))
                descricao = descricao.replace('images=\"151796,148074,143821,143819,143818,143817,143796,143816,143742,143741,146629,124579,157474\"',generatedImages);
            else if(descricao.includes('asdfsdgfdg')){
                descricao = descricao.replace('asdfsdfsd', generatedImages);
            }
        }
        else if(descricao.includes('[gallery size=\"medium\" ids=\"')){
            
            let newDesc = descricao.split('[gallery size=\"medium\" ids=\"');
            newDesc = newDesc[1].split(',')
            newDesc.map(img => {
                generatedImages = generatedImages + `<li><img src="${img}"></li>`
            })
            generatedImages += '</ul>';
            
            if(descricao.includes('[gallery size=\"medium\" ids=\"143739,143740,143741,143742,143743,143744,143745\"'))
                descricao = descricao.replace('[gallery size=\"medium\" ids=\"143739,143740,143741,143742,143743,143744,143745\"',generatedImages);
            else if(descricao.includes('[gallery size=\"medium\" ids=\"143299,143300,143301,143302,143303\"'))
                descricao = descricao.replace('[gallery size=\"medium\" ids=\"143299,143300,143301,143302,143303\"',generatedImages);
            else if('[gallery size=\"medium\" ids=\"143793,143795,143794,143796\"')
                descricao = descricao.replace('[gallery size=\"medium\" ids=\"143793,143795,143794,143796\"',generatedImages);
            else if('[gallery size=\"medium\" ids=\"143821,143817,143819,143816,143818,143820\"')
                descricao = descricao.replace('[gallery size=\"medium\" ids=\"143821,143817,143819,143816,143818,143820\"',generatedImages);
            else if('[gallery size=\"medium\" ids=\"143842,143843,143844,143839,143840,148581\"')
                descricao = descricao.replace('[gallery size=\"medium\" ids=\"143842,143843,143844,143839,143840,148581\"',generatedImages);
        }         

        descricao = descricao.replace('orderby=\"rand\"]\r\n', '');

        descricao = descricao.replace('[gallery size=\"medium\" ids=\"','');

        descricao = descricao.replace('<!--OffBegin-->', '');

        descricao = descricao.replace('[vc_row][vc_column width=\"1/1\"][vc_column_text]\r\n','')
        descricao = descricao.replace('[/vc_column_text][/vc_column][/vc_row]','')
        descricao = descricao.replace('[vc_row][vc_column width=\"1/1\"]', '')
        descricao = descricao.replace('[vc_gallery type=\"image_grid\" interval=\"3\"','')
        descricao = descricao.replace('[/vc_column][/vc_row]','')
        descricao = descricao.replace('onclick=\"link_image\" custom_links_target=\"_self\" title=\"Imagens em destaques\"]','')
        
        return descricao;
    }

    getPaginaByWpid(jwt, paginas, ID) {
    //    let paginas = await this.getPaginas(jwt)

        //console.log("meus paginas: ", paginas);

        return paginas.filter(pagina => {
            //console.log("\n ------------------------->>>>>>", pagina.wpid , " --- ", ID)
            if(pagina.wpid == ID)
                return pagina;
        })
    }

    async getBairroBySlug(jwt, slug){
        let config = { headers: { 'Authorization': `Bearer ${jwt}` } };
        //console.log(`\n\nPegando o bairro: http://localhost:1337/bairro?wpid=${wpid}`);
        //console.log("\n\nconfig: ", config);
        try{
            let ret = await axios.get(`http://localhost:1337/bairro?slug=${slug}`,  config);
            //console.log("\n\nretorno: ", ret);
            return ret;
        }
        catch(e){
            console.log("\n\n\n error: ", e);
        }
    }

    async insertStrypePagina(jwt, pagina){
        let config = { headers: { 'Authorization': `Bearer ${jwt}` } };
        
        //console.log("\n\nconfig: ", config);
        try{
            let ret = await axios.post('http://localhost:1337/pagina/', pagina, config);
            //console.log(ret);
            return ret;
        }
        catch(e){
            console.log("\n\n\n error: ", e);
        } 
    }

    async getPaginas(jwt){
        let config = { headers: { 'Authorization': `Bearer ${jwt}` } };
        
        //console.log("\n\nconfig: ", config);
        try{
            let ret = await axios.get('http://localhost:1337/pagina/',  config);
            return ret;
        }
        catch(e){
            console.log("\n\n\n error: ", e);
        }
    }


    findMysqlPaginas(cb){


        let sql = `SELECT ID, post_author, post_title, post_content, post_name as slug, post_date, post_modified 
        FROM nkty_posts 
        WHERE  (post_status = 'publish' or post_status = 'published') and post_type in ('post', 'page')
        and (
        post_title like 'fotos do bairro%' or post_title = 'Fotos da cidade de Niterói' or 
        post_title like 'historia do bairro%' or post_title = 'História da Cidade de Niterói - RJ' or
        post_title like 'população do bairro%' or post_title = 'População da Cidade de Niterói' or
        post_title like 'turismo na Cidade%' or post_title = 'Fotos da cidade de Niterói' 
        ) and ID != 137637 and ID != 137650 and ID != 137654 `;

        console.log("\n\n", sql, "\n\n\n")
        let pagina = mysqlJson.query( sql, (error, paginas) => {
            //console.log("aasdfsd: ", paginas)
            if(!error){
                cb(paginas);
            }
            else{
                console.log("erro: ", error);
            }
        })
        
    }
}

module.exports = new PaginaController