const controller = require('../controllers/userController')
const controller_cat = require('../controllers/categoriaNewsController')
const controller_catevento = require('../controllers/categoriaEventoController')
const controller_catguia = require('../controllers/categoriaGuiaController')
const controller_catguia_image = require('../controllers/categoriaImageGuiaController')
const controller_tag = require('../controllers/tagController')
const controller_bairro = require('../controllers/bairroController')
const controller_comentario = require('../controllers/comentarioController')

module.exports = (app, upload) => {
  
    app.get("/users", (req, res) => controller.viewAll(req, res) )
    app.get("/users/migrate", (req, res) => controller.migrate(req, res) )
    app.get("/category/migrate", (req, res) => controller_cat.migrate(req, res) )
    app.get("/catguia/migrate", (req, res) => controller_catguia.migrate(req, res) )
    app.get("/catevento/migrate", (req, res) => controller_catevento.migrate(req, res) )
    app.get("/tag/migrate", (req, res) => controller_tag.migrate(req, res) )
    app.get("/bairro/migrate", (req, res) => controller_bairro.migrate(req, res) )
    app.get("/comentario/migrate", (req, res) => controller_comentario.migrate(req, res) )
    app.get("/catguiaimage/migrate", (req, res) => controller_catguia_image.migrate(req, res) )
}