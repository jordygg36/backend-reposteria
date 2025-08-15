const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const cors = require('cors');

// Instancia de DB
const conf = require('../dataBase/configDataBase.json');
const DBManager = require('../dataBase/connectiondb');

// Instancia de los Controllers
const productosController = require('../controllers/productosControllers');
const usuariosController = require('../controllers/usuariosControllers');

// Instancia de rutas
const Router = require('../Routes/routes');

class MarketManager {
    #appExpress;
    #runningConfType;

    constructor() {
        this.#init();
        Object.preventExtensions(this);
    }

    #init = async () => {
        this.#runningConfType = conf.DevConfig.service.port;
        this.#appExpress = express();
    };

    #prepareDataBase = async () => {
        const oDBMan = new DBManager();
        await oDBMan.setupDatabase();
    };

    prepareService = async () => {
        this.#appExpress.use(cors({
            origin: 'http://localhost:4200', // Ensure this matches the frontend's origin
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization']
        }));

        this.#appExpress.use('/uploads', express.static('uploads')); 
        this.#appExpress.use(bodyParser.json());
        this.#appExpress.use(bodyParser.urlencoded({ extended: true }));
        this.#appExpress.use(morgan('dev'));

        await this.#prepareDataBase();
        await this.#prepareRouting();
    };

    #prepareRouting = async () => {
        const oRouter = new Router();
        const oproductosController = new productosController();
        const ousuariosController = new usuariosController();
        oRouter.attachControllers(oproductosController, ousuariosController);
        oRouter.preparedRouting();
        
        this.#appExpress.use('/', oRouter.getRouter());
    };

    runService = async () => {
        const thisServicePort = this.#runningConfType;
        this.#appExpress.listen(thisServicePort, () => {
            console.log(`MarketplaceManager is ready on ${thisServicePort}`);
        });
    };
}

module.exports = MarketManager;
