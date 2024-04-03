import { ClientRequest } from "http";
import https from "https";

export default class OandaPortfolioManager {
  private streamingUrl: string =
    `https://stream-fxpractice.oanda.com/v3/accounts/${process.env.ACCOUNT_ID}/pricing/stream`;
  private apiKey: string;
  private req: ClientRequest | null = null;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  public connect(instruments : string[]): void {
    const queryParams = new URLSearchParams({
      instruments: instruments.join(',')
    });
    this.streamingUrl = `${this.streamingUrl}?${queryParams.toString()}`
    const options = {
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        'Accept': 'application/octet-stream' // Usually, you need 'Accept' instead of 'Content-Type' for streaming responses
      }
    };

    this.req = https.request(this.streamingUrl, options, (res) => {
      console.log(`STATUS: ${res.statusCode}`);
      console.log(`HEADERS: ${JSON.stringify(res.headers)}`);

      res.on('data', (chunk) => {
        // Process each chunk of data as it comes in
        console.log(chunk.toString());
      });

      res.on('end', () => {
        console.log('Stream ended');
        this.req = null; // Clear the request object once the stream ends
      });
    });

    this.req.on('error', (error) => {
      console.error(`Request error: ${error.message}`);
      this.req = null; // Clear the request object in case of error
    });

    // Don't forget to end the request. It's necessary for completing the setup of the request.
    this.req.end();
  }

  public disconnect(): void {
    // If there's an active request, abort it to disconnect.
    if (this.req) {
      this.req.destroy();
      this.req = null;
    }
  }
}
