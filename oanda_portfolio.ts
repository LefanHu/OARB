import WebSocket from 'ws';

export default class OandaPortfolioManager {
    private webSocket: WebSocket | null = null;
    private streamingUrl: string = 'https://stream-fxpractice.oanda.com/';
    private apiKey: string;
  
    constructor(apiKey: string) {
      this.apiKey = apiKey;
    }
  
    public connect(): void {
      // Establish the WebSocket connection using the streaming URL
      this.webSocket = new WebSocket(this.streamingUrl, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`, // OANDA typically requires a Bearer token for authentication
        },
      });
  
      this.webSocket.onopen = () => {
        console.log('WebSocket connection established.');
        // You might need to send a message to subscribe to specific instruments or data streams here
      };
  
      this.webSocket.onmessage = (event) => {
        // Handle incoming data
        console.log('Received message:', event.data);
      };
  
      this.webSocket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
  
      this.webSocket.onclose = () => {
        console.log('WebSocket connection closed.');
        // You might want to implement reconnection logic here
      };
    }
  
    public disconnect(): void {
      if (!this.webSocket) {
        console.error('WebSocket is not connected.');
        return;
      }
      this.webSocket.close();
    }
}