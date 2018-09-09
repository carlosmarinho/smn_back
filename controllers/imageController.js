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

        let fieldname = req.params.fieldname;

        const obj =await model.findById(req.params.id)

        if(obj[fieldname] == undefined)
            return false;

        console.log("\n\n\no objeto fieldname: ", fieldname, ' ----- ', obj[fieldname])
        //res.sendFile('/uploads/' + uid + '/' + file);
        res.sendFile(path.dirname(require.main.filename) + "/" + JSON.parse(obj[fieldname]).path);
        //res.json(JSON.parse(obj.image).path)
    }

    viewImagePath(req, res){
        if(req.params.path){
            console.log("\n\n\nreq.params.path: ", req.params.path);
            res.sendFile(path.dirname(require.main.filename) + "/" + req.params.path);
        }
        
    }


}

module.exports = new ImageController