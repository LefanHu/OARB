import { Contract } from "@stoqey/ib";
import IBPortfolioManager from "./ib_portfolio";

// Instantiate the portfolio manager with your specific settings
const portfolioManager = new IBPortfolioManager(0, 7497, '127.0.0.1');

// Wait a bit for the connection to establish
setTimeout(() => {
    // Subscribe to market data for the EUR/USD forex pair
    portfolioManager.subscribeToMarketData("EURUSD");
    
    // Let's assume we want to keep the connection open for 30 seconds to receive some data
    setTimeout(() => {
        // After 30 seconds, close the connection
        portfolioManager.close();
        console.log("Disconnected from IB API.");
    }, 30000);
}, 1000);