import { ClientRequest } from "http";
import https from "https";
import { filter, Subject } from "rxjs";
import { OandaPrice } from "../types/oanda";

export default class OandaPortfolioManager {
  private streamingUrl: string = `https://stream-fxpractice.oanda.com/v3/accounts/${process.env.ACCOUNT_ID}/pricing/stream`;
  private apiKey: string;
  private req: ClientRequest | null = null;
  private priceSubject: Subject<OandaPrice> = new Subject<OandaPrice>();

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
