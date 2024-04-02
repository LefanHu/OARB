import { IBApi, EventName, ErrorCode, Contract, TickType } from "@stoqey/ib";

export default class IBPortfolioManager {
  private ib: IBApi;
  private positionsCount: number = 0;
  // Object to store bid and ask prices and sizes
  private marketData: Record<string, { bidPrice?: number; bidSize?: number; askPrice?: number; askSize?: number }> = {};

  constructor(private clientId: number = 0, private port: number, private host: string = '127.0.0.1') {
    this.ib = new IBApi({
      clientId: this.clientId,
      host: this.host,
      port: this.port,
    });
    this.connectAndRegisterEvents();
  }

  private connectAndRegisterEvents() {
    this.ib.connect();
    // Register event handlers
    this.ib.on(EventName.error, (err: Error, code: ErrorCode, reqId: number) => {
      console.error(`${err.message} - code: ${code} - reqId: ${reqId}`);
    })
    .on(EventName.position, (account: string, contract: Contract, pos: number, avgCost?: number) => {
      console.log(`${account}: ${pos} x ${contract.symbol} @ ${avgCost}`);
      this.positionsCount++;
    })
    .once(EventName.positionEnd, () => {
      console.log(`Total: ${this.positionsCount} positions.`);
      this.ib.disconnect();
    });

    // Handle bid and ask price updates
    this.ib.on(EventName.tickPrice, (reqId, tickType, price, attrib) => {
      const symbol = this.ib.contractDetails[reqId]?.contract?.symbol;
      if (symbol) {
        if (!this.marketData[symbol]) this.marketData[symbol] = {};
        if (tickType === TickType.BID) {
          this.marketData[symbol].bidPrice = price;
        } else if (tickType === TickType.ASK) {
          this.marketData[symbol].askPrice = price;
        }
        console.log(`Market Data for ${symbol}: ${JSON.stringify(this.marketData[symbol])}`);
      }
    });

    // Handle bid and ask size updates
    this.ib.on(EventName.tickSize, (reqId, tickType, size) => {
      const symbol = this.ib.contractDetails[reqId]?.contract?.symbol;
      if (symbol) {
        if (!this.marketData[symbol]) this.marketData[symbol] = {};
        if (tickType === TickType.BID_SIZE) {
          this.marketData[symbol].bidSize = size;
        } else if (tickType === TickType.ASK_SIZE) {
          this.marketData[symbol].askSize = size;
        }
        console.log(`Market Data for ${symbol}: ${JSON.stringify(this.marketData[symbol])}`);
      }
    });

    // Trigger positions request
    this.ib.reqPositions();
  }

  public subscribeToMarketData(forexPair: string) {
    // Forex pairs are typically represented as "base quote", e.g., "EURUSD"
    const contract: Contract = {
      symbol: forexPair.substring(0, 3),
      secType: "CASH",
      currency: forexPair.substring(3),
      exchange: "IDEALPRO",
    };

    // Request market data for the forex pair
    const reqId = new Date().getTime(); // Consider a more robust ID mechanism
    this.ib.reqMktData(reqId, contract, "100,101,104,105", false, false, []);
  }

  public close() {
    this.ib.disconnect();
  }
}
