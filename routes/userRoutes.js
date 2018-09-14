const controller = require('../controllers/userController')
const controller_cat = require('../controllers/categoriaNewsController')
const controller_tag = require('../controllers/tagController')
const controller_bairro = require('../controllers/bairroController')
const controller_comentario = require('../controllers/comentarioController')
const controller_noticia = require('../controllers/noticiaController')


module.exports = (app, upload) => {
  
    app.get("/users", (req, res) => controller.viewAll(req, res) )
    app.get("/users/migrate", (req, res) => controller.migrate(req, res) )
    app.get("/category/migrate", (req, res) => controller_cat.migrate(req, res) )
    app.get("/tag/migrate", (req, res) => controller_tag.migrate(req, res) )
    app.get("/bairro/migrate", (req, res) => controller_bairro.migrate(req, res) )
    app.get("/comentario/migrate", (req, res) => controller_comentario.migrate(req, res) )
    app.get("/noticia/migrate", (req, res) => controller_noticia.migrate(req, res) )

}