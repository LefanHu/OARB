import {
  IBApi,
  EventName,
  ErrorCode,
  Contract,
  SecType,
  IBApiTickType,
  Forex,
} from "@stoqey/ib";
import { filter, fromEventPattern, map, Observable, Subject } from "rxjs";

export default class IBPortfolioManager {
  private ib: IBApi;
  private positionsCount: number = 0;
  private contractDetails: Record<number, Contract> = {};
  private marketData: Record<
    string,
    { bidPrice?: number; bidSize?: number; askPrice?: number; askSize?: number }
  > = {};
  private priceSubject: Subject<any> = new Subject<any>();
  private sizeSubject: Subject<any> = new Subject<any>();

  constructor(
    private clientId: number = 0,
    private port: number,
    private host: string = "127.0.0.1"
  ) {
    this.ib = new IBApi({
      clientId: this.clientId,
      host: this.host,
      port: this.port,
    });
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ib.connect();
      this.ib.on(EventName.connected, () => {
        console.log("Successfully connected to IB API.");
        this.setupEventHandlers();
        resolve();
      });
      this.ib.on(
        EventName.error,
        (err: Error, code: ErrorCode, reqId: number) => {
          console.error(
            `Connection Error: ${err.message} - Code: ${code} - ReqId: ${reqId}`
          );
          if (code === ErrorCode.NOT_CONNECTED) {
            reject(err); // Only reject on critical errors that prevent further actions
          }
        }
      );
    });
  }

  setupEventHandlers(): void {
    this.ib.on(
      EventName.error,
      (err: Error, code: ErrorCode, reqId: number) => {
        console.error(
          `Error: ${err.message} - Code: ${code} - ReqId: ${reqId}`
        );
      }
    );

    this.ib.on(
      EventName.position,
      (account: string, contract: Contract, pos: number, avgCost?: number) => {
        console.log(
          `IB data: ${account}: ${pos} x ${contract.symbol} @ ${avgCost}`
        );
        this.positionsCount++;
      }
    );

    this.ib.once(EventName.positionEnd, () => {
      console.log(`Total: ${this.positionsCount} positions.`);
    });

    // Market data handlers
    this.setupMarketDataHandlers();
  }

  setupMarketDataHandlers(): void {
    this.ib.on(EventName.tickPrice, (reqId, tickType, price, attrib) => {
      const contract = this.contractDetails[reqId];
      if (!contract || !contract.symbol) return; // sanity check

      const symbol: string = contract.symbol;
      this.marketData[symbol] = this.marketData[symbol] || {};
      if (tickType === IBApiTickType.BID) {
        this.marketData[symbol].bidPrice = price;
      } else if (tickType === IBApiTickType.ASK) {
        this.marketData[symbol].askPrice = price;
      }
      this.priceSubject.next({ symbol, data: this.marketData[symbol] });
      // console.log(
      //   `Updated market data for ${symbol}: ${JSON.stringify(
      //     this.marketData[symbol]
      //   )}`
      // );
    });

    this.ib.on(EventName.tickSize, (reqId, tickType, size) => {
      const contract = this.contractDetails[reqId];
      if (!contract || !contract.symbol) return; // sanity check

      const symbol: string = contract.symbol;
      this.marketData[symbol] = this.marketData[symbol] || {};
      if (tickType === IBApiTickType.BID_SIZE) {
        this.marketData[symbol].bidSize = size;
      } else if (tickType === IBApiTickType.ASK_SIZE) {
        this.marketData[symbol].askSize = size;
      }
      this.sizeSubject.next({ symbol, data: this.marketData[symbol] });
      // console.log(
      //   `Updated size data for ${symbol}: ${JSON.stringify(
      //     this.marketData[symbol]
      //   )}`
      // );
    });
  }

  async subscribeToMarketData(forexPair: string): Promise<void> {
    const contract: Forex = {
      symbol: forexPair.substring(0, 3),
      secType: SecType.CASH,
      currency: forexPair.substring(3),
      exchange: "IDEALPRO",
    };
    const reqId = 1; // Unique request ID based on the current timestamp
    this.contractDetails[reqId] = contract;
    this.ib.reqMktData(reqId, contract, "221,225,106", false, false);
    console.log(
      `Subscribed to market data for ${forexPair} with request ID ${reqId}`
    );
  }

  async disconnect(): Promise<void> {
    return new Promise((resolve) => {
      this.ib.disconnect();
      this.ib.on(EventName.disconnected, () => {
        console.log("Disconnected from IB API.");
        resolve();
      });
    });
  }

  onDisconnect(cb: () => void): void {
    this.ib.on(EventName.disconnected, cb);
  }

  get priceObservable(): Observable<any> {
    return this.priceSubject.asObservable();
  }

  get sizeObservable(): Observable<any> {
    return this.sizeSubject.asObservable();
  }
}
