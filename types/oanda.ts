interface Price {
  price: string;
  liquidity: number;
}

export interface OandaPrice {
  type: string;
  time: string;
  bids: Price[];
  asks: Price[];
  closeoutBid: string;
  closeoutAsk: string;
  status: string;
  tradeable: boolean;
  instrument: string;
}
