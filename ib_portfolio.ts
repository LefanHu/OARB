import { IBApi, EventName, ErrorCode, Contract, SecType, IBApiTickType } from "@stoqey/ib";

export default class IBPortfolioManager {
  private ib: IBApi;
  private positionsCount: number = 0;
  private contractDetails: Record<number, Contract> = {};
  private marketData: Record<string, { bidPrice?: number; bidSize?: number; askPrice?: number; askSize?: number }> = {};

  constructor(private clientId: number = 0, private port: number, private host: string = '127.0.0.1') {
    this.ib = new IBApi({
      clientId: this.clientId,
      host: this.host,
      port: this.port,
    });
    this.connectAndRegisterEvents();
  }

  private connectAndRegisterEvents(): void {
    this.ib.connect();
    console.log(`Attempting to connect to IB API at ${this.host}:${this.port} with client ID ${this.clientId}`);

    this.ib.on(EventName.connected, () => {
      console.log("Successfully connected to IB API.");
    });

    this.ib.on(EventName.disconnected, () => {
      console.log("Disconnected from IB API.");
    });

    this.ib.on(EventName.error, (err: Error, code: ErrorCode, reqId: number) => {
      console.error(`Error: ${err.message} - Code: ${code} - ReqId: ${reqId}`);
      if (code >= 2000) { // Example condition, adjust based on actual critical error codes
        console.error("Critical error received, disconnecting...");
        this.ib.disconnect();
      }
    });

    this.ib.on(EventName.position, (account: string, contract: Contract, pos: number, avgCost?: number) => {
      console.log(`${account}: ${pos} x ${contract.symbol} @ ${avgCost}`);
      this.positionsCount++;
    });

    this.ib.once(EventName.positionEnd, () => {
      console.log(`Total: ${this.positionsCount} positions.`);
    });

    // Subscribe to price and size updates
    this.ib.on(EventName.tickPrice, (reqId, tickType, price, attrib) => {
      console.log(`Received tickPrice event for ReqId: ${reqId}, TickType: ${tickType}, Price: ${price}`);
      const contract = this.contractDetails[reqId];
      if (contract && contract.symbol) {
        const symbol: string = contract.symbol;
        if (!this.marketData[symbol]) {
          this.marketData[symbol] = {};
        }
        if (tickType === IBApiTickType.BID) {
          this.marketData[symbol].bidPrice = price;
          console.log(`Updated bid price for ${symbol}: ${price}`);
        } else if (tickType === IBApiTickType.ASK) {
          this.marketData[symbol].askPrice = price;
          console.log(`Updated ask price for ${symbol}: ${price}`);
        }
        console.log(`Market Data for ${symbol}: ${JSON.stringify(this.marketData[symbol])}`);
      } else {
        console.log(`No contract found for ReqId: ${reqId}. Unable to update price.`);
      }
    });

    this.ib.on(EventName.tickSize, (reqId, tickType, size) => {
      console.log(`Received tickSize event for ReqId: ${reqId}, TickType: ${tickType}, Size: ${size}`);
      const contract = this.contractDetails[reqId];
      if (contract && contract.symbol) {
        const symbol:string = contract.symbol;
        if (!this.marketData[symbol]) {
          this.marketData[symbol] = {};
        }
        if (tickType === IBApiTickType.BID_SIZE) {
          this.marketData[symbol].bidSize = size;
          console.log(`Updated bid size for ${symbol}: ${size}`);
        } else if (tickType === IBApiTickType.ASK_SIZE) {
          this.marketData[symbol].askSize = size;
          console.log(`Updated ask size for ${symbol}: ${size}`);
        }
        console.log(`Market Data for ${symbol}: ${JSON.stringify(this.marketData[symbol])}`);
      } else {
        console.log(`No contract found for ReqId: ${reqId}. Unable to update size.`);
      }
    });

    this.ib.reqPositions(); // Requesting positions to be sent - this triggers position events
  }

  public subscribeToMarketData(forexPair: string): void {
      const contract: Contract = {
          symbol: forexPair.substring(0, 3),
          secType: SecType.CASH,
          currency: forexPair.substring(3),
          exchange: "IDEALPRO",
      };
      const reqId = new Date().getTime();  // Generate a unique request ID based on the current timestamp
      this.contractDetails[reqId] = contract;  // Store the contract details using reqId as the key

      // Correctly formatted request for market data:
      this.ib.reqMktData(reqId, contract, "1,2,3,4", false, false);

      // Output to console for debugging purposes
      console.log(`Market data subscription requested for ${forexPair} with request ID ${reqId}`);
  }

  public close(): void {
      // Disconnect the API client
      this.ib.disconnect();
      console.log("Disconnected from IB API.");
  }
}
