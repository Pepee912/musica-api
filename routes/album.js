var express = require('express')
var api = express.Router();
var userController = require('../controllers/album');
var multipart = require('connect-multiparty');
var md_upload = multipart({uploadDir:'uploads/albums'});
var md_auth = require('../middlewares/authenticated');

api.get('/albums',[md_auth.Auth],userController.list);
api.get('/albums/:id',[md_auth.Auth],userController.lisbyid);
api.get('/albums/details/:id',userController.listbyartist);

api.post('/albums',[md_auth.Auth],userController.save);
api.delete('/albums/:id',[md_auth.Auth],userController.delete);
api.put('/albums/:id',[md_auth.Auth],userController.update);

api.post('/albums/:id',[md_auth.Auth,md_upload],userController.uploadImage);
api.get('/albums/image/:image',userController.getImage);
api.delete('/albums/image/:id',[md_auth.Auth],userController.delImage);

module.exports = api;