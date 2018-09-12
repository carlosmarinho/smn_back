const controller = require('../controllers/userController')

module.exports = (app, upload) => {
  
    app.get("/users", (req, res) => controller.viewAll(req, res) )
    app.get("/users/migrate", (req, res) => controller.migrate(req, res) )

}