const express = require("express");
const authController = require("../controllers/authController");
const multer = require("multer"); 
const path = require("path");
const sharp = require("sharp"); // Import sharp for image processing
const AIController = require("../controllers/aiController");
const app = express();

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/"); 
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
       
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
        if (!allowedExtensions.includes(ext)) {
            return cb(new Error('Tipo de archivo no permitido'), false);
        }
        cb(null, Date.now() + ext); 
    },
});

const upload = multer({ 
    storage,
    fileFilter: (req, file, cb) => {
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (!allowedExtensions.includes(ext)) {
            return cb(new Error('Tipo de archivo no permitido'), false);
        }
        cb(null, true);
    }
}); 

class Router{
    #router;
    #usuariosController;
    #productosController;
    #aiController = new AIController();
    constructor(){
        this.#router = express.Router();
        Object.preventExtensions(this);
    }

    attachControllers = async (productosController, usuariosController) =>{
        
        this.#usuariosController=usuariosController;
        this.#productosController=productosController;
    }
    
    preparedRouting = async () => {
        
        this.#router.get('/productos', this.#productosController.getAll);
        this.#router.get('/productos/:id', authController.verifyToken, this.#productosController.getOne);
        this.#router.post('/productos', authController.verifyToken, upload.single("imagen"), async (req, res, next) => {
            if (req.file) {
                try {
                    const outputPath = `uploads/${Date.now()}.jpg`; // Save as .jpg
                    await sharp(req.file.path)
                        .resize(500, 500) // Resize to 500x500 pixels
                        .toFormat('jpeg') // Convert to JPEG
                        .toFile(outputPath); // Save the resized file
                    req.file.filename = path.basename(outputPath); // Update filename
                } catch (err) {
                    return res.status(500).json({ message: "Error al procesar la imagen", error: err.message });
                }
            }
            next(); // Proceed to the controller
        }, this.#productosController.createProduct);
        this.#router.patch('/productos/:id',authController.verifyToken, upload.single("imagen"), async (req, res, next) => {
            if (req.file) {
                try {
                    const outputPath = `uploads/${Date.now()}.jpg`; // Save as .jpg
                    await sharp(req.file.path)
                        .resize(500, 500) // Resize to 500x500 pixels
                        .toFormat('jpeg') // Convert to JPEG
                        .toFile(outputPath); // Save the resized file
                    req.file.filename = path.basename(outputPath); // Update filename
                } catch (err) {
                    return res.status(500).json({ message: "Error al procesar la imagen", error: err.message });
                }
            }
        
            next();
        },this.#productosController.update);
        this.#router.delete('/productos/:id',authController.verifyToken, this.#productosController.delete);
        this.#router.get('/carrito', this.#productosController.getAllCarrito);
        this.#router.post('/carrito', this.#productosController.carrito);
        this.#router.delete('/carrito/:id', this.#productosController.deleteCar);
        this.#router.patch('/carrito/:idcarrito', this.#productosController.updateCarritoCantidad); // New route for updating cart item quantity


        this.#router.post('/login', authController.login);

        this.#router.get('/usuarios',authController.verifyToken, this.#usuariosController.getAll);
        this.#router.get('/usuarios/:id', this.#usuariosController.getOne);
        this.#router.post('/usuarios', authController.verifyToken, upload.single("imagen"),async (req, res, next) => {
            if (req.file) {
                try {
                    const outputPath = `uploads/${Date.now()}.jpg`; // Save as .jpg
                    await sharp(req.file.path)
                        .resize(500, 500) // Resize to 500x500 pixels
                        .toFormat('jpeg') // Convert to JPEG
                        .toFile(outputPath); // Save the resized file
                    req.file.filename = path.basename(outputPath); // Update filename
                } catch (err) {
                    return res.status(500).json({ message: "Error al procesar la imagen", error: err.message });
                }
            }
        
            next();
        },this.#usuariosController.create);
        this.#router.post('/register', upload.single("imagen"),async (req, res, next) => {
            if (req.file) {
                try {
                    const outputPath = `uploads/${Date.now()}.jpg`; // Save as .jpg
                    await sharp(req.file.path)
                        .resize(500, 500) // Resize to 500x500 pixels
                        .toFormat('jpeg') // Convert to JPEG
                        .toFile(outputPath); // Save the resized file
                    req.file.filename = path.basename(outputPath); // Update filename
                } catch (err) {
                    return res.status(500).json({ message: "Error al procesar la imagen", error: err.message });
                }
            }
        
            next();
        }, this.#usuariosController.create);

        this.#router.patch('/usuarios/:id', authController.verifyToken, upload.single("imagen"), async (req, res, next) => {
            if (req.file) {
                try {
                    const outputPath = `uploads/${Date.now()}.jpg`; // Save as .jpg
                    await sharp(req.file.path)
                        .resize(500, 500) // Resize to 500x500 pixels
                        .toFormat('jpeg') // Convert to JPEG
                        .toFile(outputPath); // Save the resized file
                    req.file.filename = path.basename(outputPath); // Update filename
                } catch (err) {
                    return res.status(500).json({ message: "Error al procesar la imagen", error: err.message });
                }
            }
        
            next();
        },this.#usuariosController.update);
        
        this.#router.delete('/usuarios/:id', authController.verifyToken, this.#usuariosController.delete);
        this.#router.post('/ai/query', this.#aiController.respondToQuery); // New AI query route
        this.#router.post('/factura', authController.verifyToken, (req, res, next) => {
            console.log('Data received in /factura route:', req.body); // Log the data received
            next();
        }, this.#productosController.generateInvoice);
        this.#router.get('/factura/:idfactura/pdf', authController.verifyToken, this.#productosController.generateInvoicePDF);
        this.#router.get('/ventas', this.#productosController.getAllSales); // New route to fetch all sales data
        this.#router.get('/usuarios/details/:id', this.#usuariosController.getUserDetails); // New route to fetch user details
    }

    getRouter = () => {
        return this.#router;
    } 
}

module.exports = Router;