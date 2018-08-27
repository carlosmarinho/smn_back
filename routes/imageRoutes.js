const controller = require('../controllers/imageController')

module.exports = (app) => {
    app.get("/image/:resource/:id", (req, res) => controller.viewImage(req, res) )

}