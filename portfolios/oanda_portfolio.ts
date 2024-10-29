import { ClientRequest } from "http";
import https from "https";
import { filter, Subject } from "rxjs";
import { OandaPrice } from "../types/oanda";
import { OandaOrderFactory } from "./OANDA/OrderFactory";

export default class OandaPortfolioManager {
  private streamingUrl: string = `https://stream-fxpractice.oanda.com/v3/accounts/${process.env.ACCOUNT_ID}/pricing/stream`;
  private baseUrl: string = `https://api-fxpractice.oanda.com/v3/accounts/${process.env.ACCOUNT_ID}`;
  private apiKey: string;
  private req: ClientRequest | null = null;
  private priceSubject: Subject<OandaPrice> = new Subject<OandaPrice>();
  private orderFactory: OandaOrderFactory = new OandaOrderFactory();

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async connect(instruments: string[]): Promise<void> {
    const queryParams = new URLSearchParams({
      instruments: instruments.join(","),
      snapshot: "False",
    });
    this.streamingUrl = `${this.streamingUrl}?${queryParams.toString()}`;
    const options = {
      // Usually, you need 'Accept' instead of 'Content-Type' for streaming responses
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: "application/octet-stream",
      },
    };

    return new Promise((resolve, reject) => {
      this.req = https.request(this.streamingUrl, options, (res) => {
        console.log(`STATUS: ${res.statusCode}`);
        console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
        if (res.statusCode === 200) {
          console.log("Successfully connected to OANDA API.");
          resolve();
        } else {
          console.error(
            `Failed to connect to stream. Status code: ${res.statusCode}`
          );
          reject(
            new Error(
              `Failed to connect to stream. Status code: ${res.statusCode}`
            )
          );
          return;
        }

        res.on("data", (chunk) => {
          // Process each chunk of data as it comes in
          try {
            const data: OandaPrice = JSON.parse(chunk.toString());
            this.priceSubject.next(data);
          } catch (error) {
            console.error("Failed to parse chunk:", error);
          }
        });

        res.on("end", () => {
          console.log("Stream ended");
          this.req = null; // Clear the request object once the stream ends
        });
      });

      this.req.on("error", (error) => {
        console.error(`Request error: ${error.message}`);
        this.req = null; // Clear the request object in case of error
        reject(error);
      });

      // Don't forget to end the request. It's necessary for completing the setup of the request.
      this.req.end();
    });
  }

  async placeMarketOrder(): Promise<void> {
    const order = JSON.stringify(
      this.orderFactory.createMarketOrder("EUR", "USD", 1)
    );
    const options = {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        AcceptDatetimeFormat: "UNIX",
        AccountID: process.env.ACCOUNT_ID,
        ContentType: "application/json",
      },
      body: JSON.stringify(order),
    };

    // build order request
    return new Promise((resolve, reject) => {
      const req = https.request(
        `${this.baseUrl}/orders`,
        {
          method: "POST",
          ...options,
        },
        (res) => {
          // console.log(`STATUS: ${res.statusCode}`);
          // console.log(`HEADERS: ${JSON.stringify(res.headers)}`);

          if (res.statusCode === 201) {
            console.log("Order placed successfully.");
            resolve();
          } else {
            console.error(
              `Failed to place order. Status code: ${res.statusCode}`
            );
            reject(
              new Error(`Failed to place order. Status code: ${res.statusCode}`)
            );
          }
        }
      );

      req.write(options.body);
      req.end();
    });
  }

  async cancelOrder(): Promise<void> {
    // TODO: implement
  }

  buildOrder(from: string, to: string, amount: number, limit: number): string {
    return JSON.stringify({
      order: {
        units: "100",
        instrument: "EUR_USD",
        timeInForce: "FOK",
        type: "MARKET",
        positionFill: "DEFAULT",
      },
    });
  }

  get priceObservable() {
    return this.priceSubject.asObservable().pipe(
      filter((data: OandaPrice) => {
        return data.type === "PRICE";
      })
    );
  }

  async disconnect(): Promise<void> {
    // If there's an active request, abort it to disconnect.
    if (this.req) {
      this.req.destroy();
      this.req = null;
    }
  }
}
