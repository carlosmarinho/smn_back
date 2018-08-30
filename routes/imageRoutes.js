const controller = require('../controllers/imageController')

module.exports = (app) => {
    app.get("/image/:resource/:fieldname/:id", (req, res) => controller.viewImage(req, res) )

}