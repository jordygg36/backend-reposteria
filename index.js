require('dotenv').config(); // Load environment variables
const MarketManager = require('./componentes/MarketplaceManager');

run = async () => {
    const oMM = new MarketManager();
    await oMM.prepareService();
    await oMM.runService();
}

run();