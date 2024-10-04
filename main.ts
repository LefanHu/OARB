import { Contract } from "@stoqey/ib";
import IBPortfolioManager from "./ib_portfolio";
import OandaPortfolioManager from "./oanda_portfolio";
require('dotenv').config({ path: __dirname+'/.env' });

// const oandaManager = new OandaPortfolioManager(process.env.API_KEY!);
// oandaManager.connect(['EUR_USD']);
// oandaManager.disconnect();

async function main() {
  const portfolioManager = new IBPortfolioManager(0, 4001, "10.0.0.215"); 
  try {
    await portfolioManager.connect();
    console.log("Connection established.");
    await portfolioManager.subscribeToMarketData("EURUSD");
    console.log("Subscribed to EURUSD market data.");

    // Optionally, perform more operations or wait for events...
    setTimeout(async () => {
      await portfolioManager.disconnect();
      console.log("Disconnected from the IB API.");
    }, 30000);  // Stay connected for 30 seconds before disconnecting
  } catch (error) {
    console.error("Failed to connect or process data:", error);
  }
}

main();