import { Contract } from "@stoqey/ib";
import IBPortfolioManager from "./ib_portfolio";
import OandaPortfolioManager from "./oanda_portfolio";
require('dotenv').config({ path: __dirname+'/.env' });

// Instantiate the portfolio manager with your specific settings
const portfolioManager = new IBPortfolioManager(0, 4003, "10.0.0.215");
// const oandaManager = new OandaPortfolioManager(process.env.API_KEY!);

// Wait a bit for the connection to establish
setTimeout(() => {
  // Subscribe to market data for the EUR/USD forex pair
  portfolioManager.subscribeToMarketData("EURUSD");
  // oandaManager.connect(['EUR_USD']);

  // Let's assume we want to keep the connection open for 30 seconds to receive some data
  setTimeout(() => {
    // After 30 seconds, close the connection
    portfolioManager.close();
    // oandaManager.disconnect();
    console.log("Disconnected from IB API.");
  }, 30000);
}, 1000);
