const controller = require('../controllers/userController')

module.exports = (app) => {
    app.delete("/users", (req, res) => controller.deleteUsers(req, res) )
    app.delete("/users/:id", (req, res) => controller.deleteUser(req, res) )
    app.get("/users", (req, res) => controller.viewAll(req, res) )
    app.get("/users/fields", (req, res) => controller.getAllFields(req, res) )
    app.get("/users/:id", (req, res) => controller.view(req, res) )
    app.put("/users/:id", (req, res) => controller.edit(req, res) )
    //app.post("/users", upload.single('image_img'), (req, res) => controller.add(req, res) )
}