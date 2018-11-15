const controller = require('../controllers/userController')
const controller_cat = require('../controllers/categoriaNewsController')
const controller_catevento = require('../controllers/categoriaEventoController')
const controller_catguia = require('../controllers/categoriaGuiaController')
const controller_catservico = require('../controllers/categoriaServicoController')
const controller_catguia_image = require('../controllers/categoriaImageGuiaController')
const controller_catevento_image = require('../controllers/categoriaImageEventoController')

const controller_cat_to_cat = require('../controllers/associaCategoriaToCategoriaParentController')

const controller_cat_to_new = require('../controllers/associaCategoriaToNewController')


const controller_tag = require('../controllers/tagController')

const controller_bairro = require('../controllers/bairroController')

const controller_comentario = require('../controllers/comentarioController')

const controller_noticia = require('../controllers/noticiaController')
const controller_noticia_image = require('../controllers/noticiaImagemDestacadaController')
const controller_noticia_categoria = require('../controllers/associaNoticiaCategoriaController')
const controller_noticia_tag = require('../controllers/associaNoticiaTagController')
const controller_noticia_bairro = require('../controllers/associaNoticiaBairroController')

const controller_evento = require('../controllers/eventoController')
const controller_evento_categoria = require('../controllers/associaEventoCategoriaController')
const controller_evento_tag = require('../controllers/associaEventoTagController')
const controller_evento_image = require('../controllers/eventoImagemDestacadaController')
const controller_evento_bairro = require('../controllers/associaEventoBairroController')

const controller_guia = require('../controllers/guiaController')
const controller_guia_categoria = require('../controllers/associaGuiaCategoriaController')
const controller_guia_image = require('../controllers/guiaImagemDestacadaController')
const controller_guia_bairro = require('../controllers/associaGuiaBairroController')

const controller_pagina = require('../controllers/paginaController')

const controller_servico = require('../controllers/servicoController')


const controller_noticia_object = require('../controllers/noticiaObjectToArrayController')
const controller_guia_object = require('../controllers/guiaObjectToArrayController')


module.exports = (app, upload) => {
  
    //Importação de categorias
    app.get("/users", (req, res) => controller.viewAll(req, res) )
    app.get("/users/migrate", (req, res) => controller.migrate(req, res) )
    app.get("/category/migrate", (req, res) => controller_cat.migrate(req, res) )
    app.get("/catguia/migrate", (req, res) => controller_catguia.migrate(req, res) )
    app.get("/catservico/migrate", (req, res) => controller_catservico.migrate(req, res) )
    app.get("/catevento/migrate", (req, res) => controller_catevento.migrate(req, res) )

    app.get("/associa_categoria_categoria_parent/migrate", (req, res) => controller_cat_to_cat.migrate(req, res) )
    app.get("/associa_categoria_to_new/migrate", (req, res) => controller_cat_to_new.migrate(req, res) )



    //Importação de imagem das categorias
    app.get("/catguiaimage/migrate", (req, res) => controller_catguia_image.migrate(req, res) )
    app.get("/cateventoimage/migrate", (req, res) => controller_catevento_image.migrate(req, res) )

    //Importação das tags
    app.get("/tag/migrate", (req, res) => controller_tag.migrate(req, res) )

    //Importação dos bairros
    app.get("/bairro/migrate", (req, res) => controller_bairro.migrate(req, res) )

    //Importação dos comentários
    app.get("/comentario/migrate", (req, res) => controller_comentario.migrate(req, res) )
    

    //Importação das noticias
    app.get("/noticia/migrate", (req, res) => controller_noticia.migrate(req, res) )
    app.get("/associa_noticia_categoria/migrate", (req, res) => controller_noticia_categoria.migrate(req, res) )
    app.get("/associa_noticia_tag/migrate", (req, res) => controller_noticia_tag.migrate(req, res) )
    app.get("/associa_noticia_bairro/migrate", (req, res) => controller_noticia_bairro.migrate(req, res) )
    app.get("/noticia_img_destacada/migrate", (req, res) => controller_noticia_image.migrate(req, res) )
    app.get("/noticia_object/migrate", (req, res) => controller_noticia_object.migrate(req, res) )

    //IMportação dos eventos
    app.get("/evento/migrate", (req, res) => controller_evento.migrate(req, res) )
    app.get("/associa_evento_categoria/migrate", (req, res) => controller_evento_categoria.migrate(req, res) )
    app.get("/associa_evento_tag/migrate", (req, res) => controller_evento_tag.migrate(req, res) )
    app.get("/associa_evento_bairro/migrate", (req, res) => controller_evento_bairro.migrate(req, res) )
    app.get("/evento_img_destacada/migrate", (req, res) => controller_evento_image.migrate(req, res) )

    //Importação dos guias
    app.get("/guia/migrate", (req, res) => controller_guia.migrate(req, res) )
    app.get("/associa_guia_categoria/migrate", (req, res) => controller_guia_categoria.migrate(req, res) )
    app.get("/associa_guia_bairro/migrate", (req, res) => controller_guia_bairro.migrate(req, res) )
    app.get("/guia_img_destacada/migrate", (req, res) => controller_guia_image.migrate(req, res) )
    app.get("/guia_object/migrate", (req, res) => controller_guia_object.migrate(req, res) )


    //Importação dos serviços lembrando que serviço agora é guia
    app.get("/servico/migrate", (req, res) => controller_servico.migrate(req, res) )

    //Importação das páginas
    app.get("/pagina/migrate", (req, res) => controller_pagina.migrate(req, res) )

}