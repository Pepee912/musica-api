const express = require('express');
const app = express();
const logger = require('morgan');
const port = 3000;
const conn = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');

const conexion = conn.createConnection({
    host:'localhost',
    user:'root',
    password:'',
    database:'mydb'
})

app.use(cors());
app.use(logger('dev'));
app.use(express.urlencoded({extended:true}));
app.use(bodyParser.json());

//Rutas de User
var user_routes = require('./routes/user');
app.use(user_routes);

//Rutas de Song
var song_routes = require('./routes/song');
app.use(song_routes);

//Rutas de Artist
var artist_routes = require('./routes/artist');
app.use(artist_routes);

//Rutas de Album
var album_routes = require('./routes/album');
app.use(album_routes);


app.get('*', (req, res) => {
    res.send({message: 'Ruta no valida'})
})

//Verifica la conexión a la base de datos y si se conecta iniciamos el servidor express.
conexion.connect((error)=> {
    if(error){
        console.log('No se puede conectar a la base de datos');
    }else{
        console.log('Conexión establecida con la base de datos');
        
        app.listen(port, () =>{
            console.log(`Servidor API ejecutado en el puerto ${port}`)
        })
    }
});

