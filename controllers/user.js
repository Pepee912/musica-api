var bcrypt = require('bcrypt-nodejs');
const conn = require('mysql2');
var jwt = require('../services/jwt'); //Importramos el servicio
var fs = require('fs');//Manejo de archivos FileSystem
var path = require('path');//Rutas o Ubicaciones
const { Console } = require('console');

const conexion = conn.createConnection({
    host:'localhost',
    user:'root',
    password:'',
    database:'mydb'
});

module.exports={
    save(req,res){
        console.log(req.body);
        data = req.body;
        name = data.name;
        user_name = data.user_name;
        email=data.email;
        if(data.password!='' && data.password!=null){
            bcrypt.hash(data.password,null,null,function(err,hash){
                if(err){
                    console.log(err);
                    res.status(500).send({message:'Intenta nuevamente'})
                }else{
                    password=hash;
                    conexion.query(
                        'INSERT INTO user (name, user_name, password, email) VALUES ("'+name+'","'+user_name+'","'+password+'","'+email+'")',
                        function(err,results,fields){
                            if(err){
                                console.log(err)
                                res.status(200).send({message:'Error: intenta más tarde'})
                            }else{
                                res.status(200).send({message:'Datos guardados'})
                            }
                        }
                    );
                }
            })
        }else{
            res.status(200).send({message:'Falta informacion'})
        }      
    },
    myporfile(req,res){
        user = req.user;
        sql = '';
            sql = 'SELECT * FROM user WHERE id ='+id
        conexion.query(sql, 
        function(err, results, fields){
            if(results){
                res.status(200).send({data: results})
            }
            else(res.status(500).send({message: 'Error to throw users'}))

        })
    },
    list(req,res){
        user = req.user;
        var sql = '';
        if(user.role == 'admin'){
            sql = 'SELECT * FROM user'
        }else{
            sql = 'SELECT * FROM user WHERE id ='+user.sub
        }

        //console.log(req.user);
        conexion.query(
            sql,
            function (err, results, fields){
                if(results){
                    res.status(200).send({results})
                }else{
                    res.status(500).send({message:'Error: intentalo más tarde'})
                }
            }
        );
    },
    lisbyid(req, res) {
        const id = req.params.id;
        const sql = 'SELECT * FROM user WHERE id = ?';
    
        conexion.query(sql, [id], function(err, results, fields) {
            if (err) {
                console.error("Error al ejecutar la consulta:", err);
                res.status(500).send({ message: 'Error al buscar el usuario' });
                return;
            }
    
            if (results.length > 0) {
                res.status(200).send({ data: results });
            } else {
                res.status(404).send({ message: 'Usuario no encontrado' });
            }
        });
    },
    userbyId(req, res){
        user = req.user;
        var sql = '';
        if(user.role == 'admin' || user.role == 'creator' || user.role == 'user'){
            sql = 'SELECT * FROM user WHERE id ='+user.sub
        }

        //console.log(req.user);
        conexion.query(
            sql,
            function (err, results, fields){
                if(results){
                    res.status(200).send({results})
                }else{
                    res.status(500).send({message:'Error: intentalo más tarde'})
                }
            }
        );
    },
    login(req, res) {
        var data = req.body;
        var user_name = data.user_name;
        var password = data.password;
        var token = data.token;
    
        conexion.query('SELECT * FROM user WHERE user_name = ? LIMIT 1', [user_name], function (err, results, fields) {
            console.log(results);
            if (!err) {
                if (results.length === 1) {
                    if (results[0].password) {
                        bcrypt.compare(password, results[0].password, function (err, check) {
                            if (!err && check) {
                                if (token) {
                                    res.status(200).send({ token: jwt.createToken(results[0]) });
                                } else {
                                    res.status(200).send({ message: 'Datos correctos' });
                                }
                            } else {
                                res.status(200).send({ message: 'Datos incorrectos' });
                            }
                        });
                    } else {
                        res.status(500).send({ message: 'Contraseña no disponible en los resultados de la consulta.' });
                    }
                } else {
                    res.status(500).send({ message: 'Datos Incorrectos' });
                }
            } else {
                res.status(500).send({ message: 'Inténtalo más tarde' });
            }
        });
    },
    delete(req, res) {
        const id = req.params.id;
        const user = req.user;
    
        if (user.role == 'admin' || user.sub == id) {
            
            conexion.query('DELETE FROM user WHERE id = ?', [id], function(err, results, fields) {
                if (!err) {
                    if (results.affectedRows !== 0) {
                        res.status(200).send({ message: "Registro eliminado" });
                    } else {
                        res.status(200).send({ message: "No se eliminó nada" });
                    }
                } else {
                    console.error(err);
                    res.status(500).send({ message: "Inténtalo más tarde" });
                }
            });
        } else {
    
            res.status(403).send({ message: "No tienes permisos para realizar esta acción" });
        }
    },   
    update(req, res) {
        const id = req.params.id;
        const data = req.body;
        const user = req.user;
    
        if (user.role == 'admin' || user.sub == id) {
            var sql = 'UPDATE user SET ? WHERE id=?';
            if (data.password) {
                bcrypt.hash(data.password, null, null, function(err, hash) {
                    if (!err) {
                        data.password = hash;
                        conexion.query(sql, [data, id], function(err, results, fields) {
                            if (!err) {
                                console.log(results);
                            } else {
                                console.log(err);
                            }
                        });
                    }
                })
            } else {
                conexion.query(sql, [data, id], function(err, results, fields) {
                    if (!err) {
                        console.log(results);
                        res.status(200).send({ message: 'Registro actualizado.' });
                    } else {
                        console.log(err);
                    }
                });
            }
        } else {
            
            res.status(403).send({ message: "No tienes permisos para realizar esta acción" });
        }
    },
    uploadImage(req, res) {
        const id = req.params.id;
        const user = req.user;   
        
        if (user.role == 'admin' || user.sub == id) {
            if (req.files) {
                const file_path = req.files.image.path;
                const file_split = file_path.split('\\'); // En caso de usar Linux, cambiaría a ('\/')
                const file_name = file_split[2];
                const ext = file_name.split('.');
                const file_ext = ext[1];
    
                if (file_ext == 'jpg' || file_ext == 'png' || file_ext == 'gif' || file_ext == 'jpeg' || file_ext == 'webp') {
                    // Consultar la imagen actual del usuario en la base de datos
                    conexion.query('SELECT image FROM user WHERE id = ?', [id], function(err, results, fields) {
                        if (!err) {
                            if (results.length > 0) {
                                const old_image = results[0].image;
                                // Eliminar la imagen anterior del sistema de archivos si existe
                                if (old_image && old_image !== 'NULL' && old_image !== 'undefined') {
                                    const path_file = './uploads/users/' + old_image;
                                    fs.unlinkSync(path_file);
                                }
                            }
    
                            // Actualizar la imagen del usuario en la base de datos
                            conexion.query('UPDATE user SET image = ? WHERE id = ?', [file_name, id], function(err, results, fields) {
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
        var path_file = './uploads/users/' + image; 
        
            //if (req.user.role == 'admin' || image == req.user.image) {
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
                //res.status(403).send({ message: "No tienes permiso para acceder a esta imagen." });
            //}
    }, 
    delImage(req, res) {
        const id = req.params.id;
        const selectSQL = "SELECT image FROM user WHERE id = ?";
        const deleteSQL = "UPDATE user SET image = NULL WHERE id = ?";
        
        if (req.user) {
            if (req.user.role == 'admin' || req.user.sub == id) {
                conexion.query(selectSQL, [id], function(err, results, fields) {
                    if (!err) {
                        if (results.length != 0) {
                            const imageFileName = results[0].image;
                            const path_file = './uploads/users/' + imageFileName;
                            
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
                                res.status(500).send({ message: 'No se pudo eliminar la imagen de los archivos' });
                            }
                        } else {
                            res.status(404).send({ message: 'No se encontró la imagen' });
                        }
                    } else {
                        console.error(err);
                        res.status(500).send({ message: 'Intenta más tarde' });
                    }
                });
            } else {
                res.status(403).send({ message: "No tienes permiso para realizar esta acción." });
            }
        } else {
            res.status(401).send({ message: "Debes iniciar sesión para realizar esta acción." });
        }
    }
        
}