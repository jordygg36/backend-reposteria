const mysql = require('mysql2');
const config = require('./configDataBase.json');

class DBManager {
    constructor() {
        this.pool = mysql.createPool({
            host: config.DevConfig.database.host,
            user: config.DevConfig.database.user,
            password: config.DevConfig.database.password,
            database: config.DevConfig.database.database,
            port: config.DevConfig.database.port,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });
    }

    async setupDatabase() {
        try {
            const promisePool = this.pool.promise();
            console.log('Conexión a la base de datos establecida correctamente.');
        } catch (error) {
            console.error('Error al conectar con la base de datos:', error);
            throw error;
        }
    }
}

module.exports = DBManager;