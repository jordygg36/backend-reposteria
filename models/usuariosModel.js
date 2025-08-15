const mysql = require('mysql2');
const bcrypt = require('bcryptjs');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'bruma',
    port: 3306
});

module.exports = {
    fetchUser: (callback) => {
        pool.query('SELECT * FROM usuarios', (err, results) => {
            if (err) {
                console.error('Error al obtener los usuarios:', err);
                callback(null);
            } else {
                callback(results);
            }
        });
    },
    fetchUserOne: (object, callback) => {
        pool.query('SELECT * FROM usuarios WHERE idusuarios = ?', [object.idusuarios], (err, results) => {
            if (err) {
                console.error('Error al obtener el usuario:', err);
                callback(null);
            } else {
                callback(results.length > 0 ? results[0] : null);
            }
        });
    },
    insertUser: async (object, callback) => {
        try {
            const salt = await bcrypt.genSalt(10);
            object.password = await bcrypt.hash(object.password, salt);

            pool.query('INSERT INTO usuarios SET ?', object, (err, result) => {
                if (err) {
                    console.error('Error al insertar el usuario:', err);
                    callback(null, err);
                    return;
                }

                pool.query('SELECT * FROM usuarios WHERE idusuarios = ?', [result.insertId], (err, user) => {
                    if (err) {
                        console.error('Error al obtener el usuario insertado:', err);
                        callback(null, err);
                        return;
                    }
                    callback(user[0], null);
                });
            });
        } catch (err) {
            console.error('Error al procesar la contraseña:', err);
            callback(null, err);
        }
    },
    updateUser: (object, callback) => {
        pool.query('UPDATE usuarios SET ? WHERE idusuarios = ?', [object, object.idusuarios], (err, result) => {
            if (err) {
                console.error('Error al actualizar el usuario:', err);
                callback(null);
                return;
            }

            if (result.affectedRows === 0) {
                callback(null);
                return;
            }

            pool.query('SELECT * FROM usuarios WHERE idusuarios = ?', [object.idusuarios], (err, updatedUser) => {
                if (err) {
                    console.error('Error al obtener el usuario actualizado:', err);
                    callback(null);
                    return;
                }
                callback(updatedUser[0]);
            });
        });
    },
    deleteUser: (object, callback) => {
        pool.query('DELETE FROM usuarios WHERE idusuarios = ?', [object.idusuarios], (err, result) => {
            if (err) {
                console.error('Error al eliminar el usuario:', err);
                callback(null);
            } else {
                callback(result);
            }
        });
    },
    getUserByEmail: (email) => {
        return new Promise((resolve, reject) => {
            pool.query('SELECT * FROM usuarios WHERE email = ?', [email], (err, results) => {
                if (err) {
                    console.error('Error al obtener el usuario por email:', err);
                    return reject(err);
                }
                resolve(results.length > 0 ? results[0] : null);
            });
        });
    }
};