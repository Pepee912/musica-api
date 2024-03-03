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
    save(req, res) {
        data = req.body;
        name = data.name;
        description = data.description;
    
        if (req.user && (req.user.role == 'admin' || req.user.role == 'creator')) {
            var sql = 'INSERT INTO artist (name, description) VALUES ("' + name + '","' + description + '")';
            conexion.query(sql, data, function(err, results, fields) {
                if (err) {
                    console.log(err);
                    res.status(500).send({ message: "Error al agregar el artista." });
                } else {
                    console.log(results);
                    res.status(200).send({ message: "Artista agregado correctamente." });
                }
            });
        } else {
            res.status(403).send({ message: "No tienes permiso para realizar esta acción." });
        }
    },
    list(req,res){
        if (req.user && (req.user.role == 'admin' || req.user.role == 'creator' || req.user.role == 'user')) {
            conexion.query(
                'SELECT * FROM artist',
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
        sql = 'SELECT  * FROM artist WHERE id = '+id;

        conexion.query(sql,function(err,results,fields){
            if(results){
                res.status(200).send({data: results})
            }
            else(res.status(500).send({message: 'Error to throw user'}))
        })
    },
    delete(req, res) {
        const artistId = req.params.id;
    
        if (req.user && (req.user.role == 'admin' || req.user.role == 'creator')) {
            // Eliminar canciones asociadas a los álbumes del artista
            conexion.query('DELETE song FROM song INNER JOIN album ON song.album_id = album.id WHERE album.artist_id = ?', [artistId], function(err, results, fields) {
                if (err) {
                    console.log(err);
                    res.status(500).send({ message: "Error al eliminar canciones asociadas a los álbumes del artista." });
                    return;
                }
    
                // Eliminar álbumes del artista
                conexion.query('DELETE FROM album WHERE artist_id = ?', [artistId], function(err, results, fields) {
                    if (err) {
                        console.log(err);
                        res.status(500).send({ message: "Error al eliminar álbumes del artista." });
                        return;
                    }
    
                    // Finalmente, eliminar el artista
                    conexion.query('DELETE FROM artist WHERE id = ?', [artistId], function(err, results, fields) {
                        if (!err && results.affectedRows !== 0) {
                            res.status(200).send({ message: "Artista, álbumes y canciones asociadas eliminadas." });
                        } else {
                            console.log(err);
                            res.status(500).send({ message: "Error al eliminar artista." });
                        }
                    });
                });
            });
        } else {
            res.status(403).send({ message: "No tienes permiso para realizar esta acción." });
        }
    },
    update(req, res) {
        const id = req.params.id;
        const data = req.body;

        if (req.user && (req.user.role == 'admin' || req.user.role == 'creator')) {
    
            if (!id || (!data.name && !data.description)) {
                return res.status(400).send({ message: 'Se debe proporcionar al menos un campo.' });
            }
        
            let sql = 'UPDATE artist SET ';
            const values = [];
        
            if (data.name) {
                sql += 'name=?, ';
                values.push(data.name);
            }
        
            if (data.description) {
                sql += 'description=?, ';
                values.push(data.description);
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
                    res.status(404).send({ message: 'Artista no encontrado para actualizar.' });
                }
            });
        } else {
            res.status(403).send({ message: "No tienes permiso para realizar esta acción." });
        }
    },
    uploadImage(req, res) {
        const id = req.params.id;
        const user = req.user;   
        
        if (user.role == 'admin' || user.role == 'creator') {
            if (req.files) {
                const file_path = req.files.image.path;
                const file_split = file_path.split('\\'); // En caso de usar Linux, cambiaría a ('\/')
                const file_name = file_split[2];
                const ext = file_name.split('.');
                const file_ext = ext[1];
    
                if (file_ext == 'jpg' || file_ext == 'png' || file_ext == 'gif' || file_ext == 'jpeg' || file_ext == 'webp') {
                    // Consultar la imagen actual del usuario en la base de datos
                    conexion.query('SELECT image FROM artist WHERE id = ?', [id], function(err, results, fields) {
                        if (!err) {
                            if (results.length > 0) {
                                const old_image = results[0].image;
                                // Verificar si la imagen anterior existe antes de eliminarla
                                if (old_image && old_image !== 'NULL' && old_image !== 'undefined') {
                                    const path_file = './uploads/artists/' + old_image;
                                    fs.unlinkSync(path_file);
                                }
                            }
    
                            // Actualizar la imagen del usuario en la base de datos
                            conexion.query('UPDATE artist SET image = ? WHERE id = ?', [file_name, id], function(err, results, fields) {
                                if (!err) {
                                    if (results.affectedRows != 0) {
                                        res.status(200).send({ message: 'Imagen actualizada' });
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
                            res.status(500).send({ message: 'Error al obtener la imagen del usuario' });
                        }
                    });
                } else {
                    res.status(400).send({ message: 'Imagen no válida' });
                }
            } else {
                res.status(400).send({ message: 'No se proporcionó ninguna imagen' });
            }
        } else {
            res.status(403).send({ message: 'No tienes permisos para realizar esta acción' });
        }
    },
    getImage(req, res) {
        var image = req.params.image;
        var path_file = './uploads/artists/' + image; 
    
       // if (req.user && (req.user.role == 'admin' || req.user.role == 'creator')) {
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
          //  res.status(403).send({ message: "No tienes permiso para acceder a esta imagen." });
        //}
    }, 
    delImage(req, res) {
        const id = req.params.id;
        const selectSQL = "SELECT image FROM artist WHERE id = ?";
        const deleteSQL = "UPDATE artist SET image = NULL WHERE id = ?";
    
        if (req.user && (req.user.role == 'admin' || req.user.role == 'creator')) {
            conexion.query(selectSQL, [id], function(err, results, fields) {
                if (!err) {
                    if (results.length != 0) {
                        const imageFileName = results[0].image;
                        const path_file = './uploads/artists/' + imageFileName;
    
                        try {
                            fs.unlinkSync(path_file); // Eliminar archivo del sistema de archivos
                            conexion.query(deleteSQL, [id], function(err, result) {
                                if (!err) {
                                    res.status(200).send({ message: 'Imagen eliminada' });
                                } else {
                                    console.error(err);
                                    res.status(500).send({ message: 'Error al actualizar la base de datos' });
                                }
                            });
                        } catch (error) {
                            console.error(error);
                            res.status(500).send({ message: 'No se pudo eliminar la imagen del sistema de archivos' });
                        }
                    } else {
                        res.status(404).send({ message: 'No se encontró la imagen asociada al usuario' });
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