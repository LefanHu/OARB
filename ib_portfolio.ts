import { IBApi, EventName, ErrorCode, Contract, SecType, IBApiTickType} from "@stoqey/ib";

export default class IBPortfolioManager {
  private ib: IBApi;
  private positionsCount: number = 0;
  private contractDetails: Record<number, Contract> = {};  // Storing contract details here
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

    // Subscribe to price and size updates
    this.ib.on(EventName.tickPrice, (reqId, tickType, price, attrib) => {
      console.log(`Received tickPrice event for reqId: ${reqId}, tickType: ${tickType}, price: ${price}`);
      const contract = this.contractDetails[reqId];
      if (contract) {
        const symbol = contract.symbol as string;
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
        console.log(`No contract found for reqId: ${reqId}. Unable to update price.`);
      }
    });

    this.ib.on(EventName.tickSize, (reqId, tickType, size) => {
      console.log(`Received tickSize event for reqId: ${reqId}, tickType: ${tickType}, size: ${size}`);
      const contract = this.contractDetails[reqId];
      if (contract) {
        const symbol = contract.symbol as string;
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
        console.log(`No contract found for reqId: ${reqId}. Unable to update size.`);
      }
    });

    this.ib.reqPositions();  // Requesting positions to be sent - this triggers position events
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
