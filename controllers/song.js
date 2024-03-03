const conn = require('mysql2');
var jwt = require('../services/jwt'); //Importramos el servicio
var fs = require('fs');//Manejo de archivos FileSystem
var path = require('path');//Rutas o Ubicaciones

const conexion = conn.createConnection({
    host:'localhost',
    user:'root',
    password:'',
    database:'mydb'
});

module.exports={
    save(req,res){
        if (req.user && (req.user.role == 'admin' || req.user.role == 'creator')) {
            data = req.body;
            name= data.name
            number = data.number
            duration = data.duration
            file = data.file
            album_id = data.album_id
            var sql = 'INSERT INTO song (name, number, duration, file, album_id) VALUES ("'+name+'","'+number+'","'+duration+'","'+file+'","'+album_id+'")';
            conexion.query(sql, data, function(err,results,fields){
                if(err){
                    console.log(err);
                }else{
                    console.log(results);
                    res.status(200).send({message: "Canción agregada correctamente."})
                }
                console.log(results)
            })
        } else {
            res.status(403).send({ message: "No tienes permiso para realizar esta acción." });
        }
    },
    list(req,res){
        if (req.user && (req.user.role == 'admin' || req.user.role == 'creator' || req.user.role == 'user')) {
            conexion.query(
                'SELECT * FROM song',
                function (err, results, fields){
                    if(results){
                        res.status(200).send({results})
                    }else{
                        res.status(500).send({message:'Error: intentalo más tarde'})
                    }
                }
            );
        } else {
            res.status(403).send({ message: "No tienes permiso para realizar esta acción." });
        }
    },
    lisbyid(req,res){
        user = req.user;
        id = req.params.id;
        sql = 'SELECT * FROM song WHERE id = '+id;

        conexion.query(sql,function(err,results,fields){
            if(results){
                res.status(200).send({data: results})
            }
            else(res.status(500).send({message: 'Error to throw user'}))
        })
    },
    listbyalbum(req,res){
        user = req.user;
        id = req.params.id;
        sql = 'SELECT * FROM song WHERE album_id ='+id;

        conexion.query(sql,function(err,results,fields){
            if(results){
                res.status(200).send({data: results});
                console.log(results)
            }
            else(res.status(500).send({message: 'Error to throw user'}))
        })    
    },
    delete(req,res){
        id = req.params.id;

        if (req.user && (req.user.role == 'admin' || req.user.role == 'creator')) {
            conexion.query('DELETE FROM song WHERE id = '+id,function(err,results,fields){
                if(!err){
                    if(results.affectedRows!=0){
                        res.status(200).send({message:"Registro eliminado"})
                    }else{
                        res.status(200).send({message: "No se elimino nada"})
                    }
                }else{
                    console.log(err);
                    res.status(500).send({message:"Intentalo más tarde"})
                }
            })
        } else {
            res.status(403).send({ message: "No tienes permiso para realizar esta acción." });
        }
    },
    update(req, res) {
        const id = req.params.id;
        const data = req.body;

        if (req.user && (req.user.role == 'admin' || req.user.role == 'creator')) {
    
            if (!id || (!data.name && !data.number && !data.duration && !data.file && !data.album_id)) {
                return res.status(400).send({ message: 'Se debe proporcionar al menos un campo.' });
            }
        
            let sql = 'UPDATE song SET ';
            const values = [];
        
            if (data.name) {
                sql += 'name=?, ';
                values.push(data.name);
            }
            if (data.number) {
                sql += 'number=?, ';
                values.push(data.number);
            }
            if (data.duration) {
                sql += 'duration=?, ';
                values.push(data.duration);
            }
            if (data.file) {
                sql += 'file=?, ';
                values.push(data.file);
            }
            if (data.album_id) {
                sql += 'album_id=?, ';
                values.push(data.album_id);
            }
        
            sql = sql.slice(0, -2);
        
            sql += ' WHERE id=?';
            values.push(id);
        
            conexion.query(sql, values, function (err, results, fields) {
                if (err) {
                    console.log(err);
                    return res.status(500).send({ message: 'Error en la actualización, intentalo más tarde.' });
                }
        
                if (results.affectedRows !== 0) {
                    res.status(200).send({ message: 'Registro actualizado.' });
                } else {
                    res.status(404).send({ message: 'Canción no encontrada para actualizar.' });
                }
            });
        } else {
            res.status(403).send({ message: "No tienes permiso para realizar esta acción." });
        }
    },
    uploadSong(req, res) {
        const id = req.params.id;
        const user = req.user;   
        
        if (user.role == 'admin' || user.role == 'creator') {
            if (req.files) {
                const file_path = req.files.file.path;
                const file_split = file_path.split('\\'); // En caso de usar Linux, cambiaría a ('\/')
                const file_name = file_split[2];
                const ext = file_name.split('.');
                const file_ext = ext[1];
    
                if (file_ext == 'mp3' || file_ext == 'wav' || file_ext == 'ogg') {
                    // Consultar la canción actual del usuario en la base de datos
                    conexion.query('SELECT file FROM song WHERE id = ?', [id], function(err, results, fields) {
                        if (!err) {
                            if (results.length > 0) {
                                const old_song = results[0].file;
                                // Verificar si la canción anterior existe antes de eliminarla
                                if (old_song && old_song !== 'NULL' && old_song !== 'undefined') {
                                    const path_file = './uploads/songs/' + old_song;
                                    fs.unlinkSync(path_file);
                                }
                            }
    
                            // Actualizar la canción del usuario en la base de datos
                            conexion.query('UPDATE song SET file = ? WHERE id = ?', [file_name, id], function(err, results, fields) {
                                if (!err) {
                                    if (results.affectedRows != 0) {
                                        res.status(200).send({ message: 'Canción actualizada' });
                                    } else {
                                        res.status(500).send({ message: 'Error al actualizar' });
                                    }
                                } else {
                                    console.error(err);
                                    res.status(500).send({ message: 'Inténtalo más tarde' });
                                }
                            });
                        } else {
                            console.error(err);
                            res.status(500).send({ message: 'Error al obtener la canción' });
                        }
                    });
                } else {
                    res.status(400).send({ message: 'Formato no válido' });
                }
            } else {
                res.status(400).send({ message: 'No se proporcionó ninguna canción' });
            }
        } else {
            res.status(403).send({ message: 'No tienes permisos para realizar esta acción' });
        }
    },
    getSong(req, res) {
        var file = req.params.file;
        var path_file = './uploads/songs/' + file; 
    
        //if (req.user && (req.user.role == 'admin' || req.user.role == 'creator')) {
            try {
                if (fs.existsSync(path_file)) {
                    res.sendFile(path.resolve(path_file));
                } else {
                    res.status(404).send({ message: 'No existe el archivo' });
                }
            } catch (error) {
                console.error(error);
                res.status(500).send({ message: 'Error al procesar la solicitud' });
            }
        //} else {
            //res.status(403).send({ message: "No tienes permiso para acceder a esta canción." });
        //}
    }, 
    delSong(req, res) {
        const id = req.params.id;
        const selectSQL = "SELECT file FROM song WHERE id = ?";
        const deleteSQL = "UPDATE song SET file = NULL WHERE id = ?";
    
        if (req.user && (req.user.role == 'admin' || req.user.role == 'creator')) {
            conexion.query(selectSQL, [id], function(err, results, fields) {
                if (!err) {
                    if (results.length != 0) {
                        const songFileName = results[0].file;
                        const path_file = './uploads/songs/' + songFileName;
    
                        try {
                            fs.unlinkSync(path_file); // Eliminar archivo del sistema de archivos
                            conexion.query(deleteSQL, [id], function(err, result) {
                                if (!err) {
                                    res.status(200).send({ message: 'Cansión eliminada' });
                                } else {
                                    console.error(err);
                                    res.status(500).send({ message: 'Error al actualizar la base de datos' });
                                }
                            });
                        } catch (error) {
                            console.error(error);
                            res.status(500).send({ message: 'No se pudo eliminar la cansión del sistema de archivos' });
                        }
                    } else {
                        res.status(404).send({ message: 'No se encontró la cansión asociada al usuario' });
                    }
                } else {
                    console.error(err);
                    res.status(500).send({ message: 'Intenta más tarde' });
                }
            });
        } else {
            res.status(403).send({ message: "No tienes permiso para realizar esta acción." });
        }
    }   
    
}