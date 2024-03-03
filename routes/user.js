var express = require('express')
var api = express.Router();
var userController = require('../controllers/user');
var multipart = require('connect-multiparty');
var md_upload = multipart({uploadDir:'uploads/users'});
var md_auth = require('../middlewares/authenticated');

api.get('/users',[md_auth.Auth],userController.list);
api.get('/users/:id',[md_auth.Auth],userController.lisbyid);
api.get('/user',[md_auth.Auth],userController.userbyId);

api.get('/user/',userController.myporfile);

api.post('/users',userController.save);
api.delete('/users/:id',[md_auth.Auth],userController.delete);
api.put('/users/:id',[md_auth.Auth],userController.update);

api.post('/login',userController.login);
api.post('/users/:id',[md_auth.Auth,md_upload],userController.uploadImage);
api.get('/users/image/:image',userController.getImage);
api.delete('/users/image/:id',[md_auth.Auth],userController.delImage);

module.exports = api;