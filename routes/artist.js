var express = require('express')
var api = express.Router();
var userController = require('../controllers/artist');
var multipart = require('connect-multiparty');
var md_upload = multipart({uploadDir:'uploads/artists'});
var md_auth = require('../middlewares/authenticated');

api.get('/artists',[md_auth.Auth],userController.list);
api.get('/artists/:id',[md_auth.Auth],userController.lisbyid);

api.post('/artists',[md_auth.Auth],userController.save);
api.delete('/artists/:id',[md_auth.Auth],userController.delete);
api.put('/artists/:id',[md_auth.Auth],userController.update);

api.post('/artists/:id',[md_auth.Auth,md_upload],userController.uploadImage);
api.get('/artists/image/:image',userController.getImage);
api.delete('/artists/image/:id',[md_auth.Auth],userController.delImage);

module.exports = api;