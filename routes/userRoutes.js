const controller = require('../controllers/userController')

module.exports = app => {
    app.get("/users", (req, res) => controller.viewAll(req, res) )
    app.get("/users/:id?", (req, res) => controller.view(req, res) )
    app.get("/users/fields", (req, res) => controller.getAllFields(req, res) )
    app.post("/users", (req, res) => controller.add(req, res) )
}