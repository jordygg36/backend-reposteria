const usuariosModel = require("../models/usuariosModel");
const multer = require("multer");
const path = require("path");
const bcrypt = require("bcrypt");

class usuariosController {
    constructor() {
        Object.preventExtensions(this);
    }

    getAll = async (req, res) => {
        usuariosModel.fetchUser((result) => {
            if (!result) {
                return res.status(500).json({ message: "Error al obtener usuarios" });
            }
            res.status(200).json(result);
        });
    }

    getOne = async (req, res) => {
        let object = { idusuarios: req.params.id };

        usuariosModel.fetchUserOne(object, (result) => {
            if (!result) {
                return res.status(404).json({ message: "Usuario no encontrado" });
            }
            res.status(200).json(result);
        });
    }

    create = async (req, res) => {
        let object = req.body;
        if (req.file) {
           
            object.imagen = req.file.filename; 
        }
        usuariosModel.insertUser(object, (user, error) => {
            if (error) {
                return res.status(500).json({ message: "Error al insertar el usuario", error });
            }
            res.status(201).json({
                message: "Usuario creado con éxito",
                usuario: user
            });
        });
    };

    update = async (req, res) => {
        const object = { ...req.body, idusuarios: req.params.id }; 
        if (req.file) {
            
            object.imagen = req.file.filename;
        }
        usuariosModel.updateUser(object, (updateUser) => {
            if (!updateUser) {
                return res.status(404).json({ message: "No se pudo actualizar el usuario" });
            }

            res.status(200).json({
                message: "Usuario actualizado correctamente",
                producto: updateUser
            });
        });
    }

    delete = async (req, res) => {
        let object = { idusuarios: req.params.id };

        usuariosModel.deleteUser(object, (result) => {
            if (!result || result.affectedRows === 0) {
                return res.status(404).json({ message: "No se pudo eliminar el usuario" });
            }
            res.status(200).json({ message: "Usuario eliminado correctamente" });
        });
    }

    login = async (req, res) => {
        const { email, password } = req.body;

        try {
            const user = await usuariosModel.getUserByEmail(email);
            if (!user) {
                return res.status(404).json({ message: "Usuario no encontrado" });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ message: "Credenciales inválidas" });
            }

            res.status(200).json({ message: "Inicio de sesión exitoso", usuario: user });
        } catch (error) {
            console.error('Error en el inicio de sesión:', error);
            res.status(500).json({ message: "Error interno del servidor" });
        }
    };

    getUserById = async (req, res) => {
        const userId = req.params.id;
        const query = `
          SELECT u.nombre, r.nombre AS rol
          FROM usuarios u
          JOIN roles r ON u.idrol = r.idrol
          WHERE u.idusuarios = ?;
        `;
        pool.query(query, [userId], (err, results) => {
          if (err) {
            console.error('Error fetching user details:', err);
            return res.status(500).json({ message: 'Error fetching user details' });
          }
          if (results.length === 0) {
            return res.status(404).json({ message: 'User not found' });
          }
          res.status(200).json(results[0]);
        });
      };

      getUserDetails = async (req, res) => {
        const userId = req.params.id;
        console.log('Fetching details for user ID:', userId); // Log the user ID
        const query = `
            SELECT u.nombre AS userName, r.nombre AS userRole
            FROM usuarios u
            JOIN roles r ON u.idrol = r.idrol
            WHERE u.idusuarios = ?;
        `;
        pool.query(query, [userId], (err, results) => {
            if (err) {
                console.error('Error fetching user details:', err); // Log the error
                return res.status(500).json({ message: 'Error fetching user details' });
            }
            if (results.length === 0) {
                console.warn('No user found for ID:', userId); // Log if no user is found
                return res.status(404).json({ message: 'User not found' });
            }
            console.log('User details fetched successfully:', results[0]); // Log the fetched details
            res.status(200).json(results[0]);
        });
    };
}

module.exports = usuariosController;