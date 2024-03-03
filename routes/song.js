var express = require('express')
var api = express.Router();
var userController = require('../controllers/song');
var multipart = require('connect-multiparty');
var md_upload = multipart({uploadDir:'uploads/songs'});
var md_auth = require('../middlewares/authenticated');

api.get('/songs',[md_auth.Auth],userController.list);
api.get('/songs/details/:id',userController.listbyalbum);
api.get('/songs/:id',[md_auth.Auth],userController.lisbyid);

api.post('/songs',[md_auth.Auth],userController.save);
api.delete('/songs/:id',[md_auth.Auth],userController.delete);
api.put('/songs/:id',[md_auth.Auth],userController.update);

api.post('/songs/:id',[md_auth.Auth,md_upload],userController.uploadSong);
api.get('/songs/song/:file',userController.getSong);
api.delete('/songs/song/:id',[md_auth.Auth],userController.delSong);

module.exports = api;