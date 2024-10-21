import IBPortfolioManager from "./portfolios/ib_portfolio";
import OandaPortfolioManager from "./portfolios/oanda_portfolio";
require("dotenv").config({ path: __dirname + "/.env" });

async function main() {
  const ibPortfolioManager = new IBPortfolioManager(0, 4001, "localhost");
  const oandaManager = new OandaPortfolioManager(process.env.API_KEY!);
  try {
    console.log("trying to establish connection to IBGateway");
    await ibPortfolioManager.connect();
    console.log("Connection established.");
    await ibPortfolioManager.subscribeToMarketData("EURUSD");
    console.log("Subscribed to EURUSD market data.");

    // console.log("trying to establish connection to OANDA");
    // await oandaManager.connect(["EUR_USD"]);
    // console.log("Connection established.");

    const ibObServable = ibPortfolioManager.getMarketDataObservable();
    ibObServable.subscribe((data) => {
      console.log("IB Data Received: ", data);
    });

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
