const DBManager = require('../dataBase/connectiondb');

const dbManager = new DBManager();

dbManager.setupDatabase().then(({ conn }) => {
  console.log('Connected to the database');
}).catch((err) => {
  console.error('Error connecting to the database:', err.message); 
  console.error('Stack trace:', err.stack);
});

module.exports = dbManager;
