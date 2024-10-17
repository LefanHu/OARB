import IBPortfolioManager from "./ib_portfolio";
import OandaPortfolioManager from "./oanda_portfolio";
require("dotenv").config({ path: __dirname + "/.env" });

async function main() {
  const ibPortfolioManager = new IBPortfolioManager(0, 4001, "localhost");
  try {
    console.log("trying to establish connection to IBGateway");
    await ibPortfolioManager.connect();
    console.log("Connection established.");
    await ibPortfolioManager.subscribeToMarketData("EURUSD");
    console.log("Subscribed to EURUSD market data.");

    console.log("trying to establish connection to OANDA");
    const oandaManager = new OandaPortfolioManager(process.env.API_KEY!);
    await oandaManager.connect(["EUR_USD"]);
    console.log("Connection established.");

    // Optionally, perform more operations or wait for events...
    setTimeout(async () => {
      await ibPortfolioManager.disconnect();
      console.log("Disconnected from the IB API.");
      await oandaManager.disconnect();
      console.log("Disconnected from the OANDA API.");
    }, 30000); // Stay connected for 30 seconds before disconnecting
  } catch (error) {
    console.error("Failed to connect or process data:", error);
  }
}

main();
