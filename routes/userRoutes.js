const controller = require('../controllers/userController')
const controller_cat = require('../controllers/categoriaNewsController')
const controller_catevento = require('../controllers/categoriaEventoController')
const controller_catguia = require('../controllers/categoriaGuiaController')
const controller_catguia_image = require('../controllers/categoriaImageGuiaController')
const controller_catevento_image = require('../controllers/categoriaImageEventoController')

const controller_tag = require('../controllers/tagController')

const controller_bairro = require('../controllers/bairroController')

const controller_comentario = require('../controllers/comentarioController')

const controller_noticia = require('../controllers/noticiaController')
const controller_noticia_image = require('../controllers/noticiaImagemDestacadaController')
const controller_noticia_categoria = require('../controllers/associaNoticiaCategoriaController')
const controller_noticia_tag = require('../controllers/associaNoticiaTagController')

const controller_evento = require('../controllers/eventoController')
const controller_evento_categoria = require('../controllers/associaEventoCategoriaController')
const controller_evento_tag = require('../controllers/associaEventoTagController')
const controller_evento_image = require('../controllers/eventoImagemDestacadaController')




module.exports = (app, upload) => {
  
    app.get("/users", (req, res) => controller.viewAll(req, res) )
    app.get("/users/migrate", (req, res) => controller.migrate(req, res) )
    app.get("/category/migrate", (req, res) => controller_cat.migrate(req, res) )
    app.get("/catguia/migrate", (req, res) => controller_catguia.migrate(req, res) )
    app.get("/catevento/migrate", (req, res) => controller_catevento.migrate(req, res) )
    app.get("/tag/migrate", (req, res) => controller_tag.migrate(req, res) )
    app.get("/bairro/migrate", (req, res) => controller_bairro.migrate(req, res) )
    app.get("/comentario/migrate", (req, res) => controller_comentario.migrate(req, res) )
    app.get("/noticia/migrate", (req, res) => controller_noticia.migrate(req, res) )
    app.get("/catguiaimage/migrate", (req, res) => controller_catguia_image.migrate(req, res) )
    app.get("/cateventoimage/migrate", (req, res) => controller_catevento_image.migrate(req, res) )

    app.get("/noticia_img_destacada/migrate", (req, res) => controller_noticia_image.migrate(req, res) )
    app.get("/associa_noticia_categoria/migrate", (req, res) => controller_noticia_categoria.migrate(req, res) )
    app.get("/associa_noticia_tag/migrate", (req, res) => controller_noticia_tag.migrate(req, res) )

    app.get("/evento/migrate", (req, res) => controller_evento.migrate(req, res) )
    app.get("/associa_evento_categoria/migrate", (req, res) => controller_evento_categoria.migrate(req, res) )
    app.get("/associa_evento_tag/migrate", (req, res) => controller_evento_tag.migrate(req, res) )
    app.get("/evento_img_destacada/migrate", (req, res) => controller_evento_image.migrate(req, res) )
}