const _ = require ('lodash/core')
const mongoose = require('mongoose')
//const User = mongoose.model('users');
const path = require('path')

class ImageController {
    
    constructor(){
        this.ar = [];
        this.ar["user"] = "users";
        
    }
    
    getModel(resource) {
        return this.ar[resource];
    }

    async viewImage(req, res){
        
        const resource = req.params.resource;
        
        const model = mongoose.model(this.getModel(resource));

        console.log("\n\n\n\nresource: ", resource, "\n\n");
        const obj =await model.findById(req.params.id)
        //res.sendFile('/uploads/' + uid + '/' + file);
        res.sendFile(path.dirname(require.main.filename) + "/" + JSON.parse(obj.image).path);
        //res.json(JSON.parse(obj.image).path)
    }


}

module.exports = new ImageController