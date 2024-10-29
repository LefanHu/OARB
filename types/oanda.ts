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

export interface MarketOrder {
  order: {
    units: string;
    instrument: string;
    timeInForce: string;
    type: string;
    positionFill: string;
  };
}

export interface LimitOrder {
  order: {
    units: string;
    instrument: string;
    price: string;
    timeInForce: string;
    type: string;
    positionFill: string;
  };
}
