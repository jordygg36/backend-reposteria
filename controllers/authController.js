const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const usuariosModel = require("../models/usuariosModel");

class AuthController {
    constructor() {
        Object.preventExtensions(this);
    }

    
    login = async (req, res) => {
        try {
            let { email, password } = req.body;
    
           
            const user = await usuariosModel.getUserByEmail(email);
    
            if (!user || !user.password) {
                return res.status(404).json({ message: "Usuario no encontrado o sin contraseña" });
            }
    
            
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: "Contraseña incorrecta" });
            }
    
            const token = jwt.sign({ id: user.idusuarios, email: user.email, idrol: user.idrol }, 'secreto_super_seguro', { expiresIn: '1h' });
    
            res.status(200).json({ token, user });
        } catch (error) {
            res.status(500).json({ message: "Error en el servidor", error: error.message });
        }
    };


    verifyToken = (req, res, next) => {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(403).json({ message: "Token requerido" });
        }

        try {
            const decoded = jwt.verify(token, 'secreto_super_seguro');
            req.user = decoded;
            next();
        } catch (error) {
            return res.status(401).json({ message: "Token inválido" });
        }
    };

    checkRole = (roles) => {
        return (req, res, next) => {
            console.log("Roles permitidos:", roles);  
            console.log("Rol del usuario:", req.user?.idrol); 
            if (!roles.includes(req.user?.idrol)) {
                return res.status(403).json({ message: "Acceso denegado: No tienes permisos para esta acción" });
            }
            next();
        };
    };
}

module.exports = new AuthController();
