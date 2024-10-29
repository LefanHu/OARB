import { OrderFactoryBase } from "../AbstractOrderFactory";
export class OandaOrderFactory extends OrderFactoryBase {
  public createMarketOrder(from: string, to: string, amount: number) {
    return {
      order: {
        units: amount.toString(),
        instrument: this.instrumentBuilder(from, to),
        timeInForce: "FOK",
        type: "MARKET",
        positionFill: "DEFAULT",
      },
    };
  }

  public createLimitOrder(
    from: string,
    to: string,
    amount: number,
    limitPrice: number
  ) {
    return {
      order: {
        units: amount.toString(),
        instrument: this.instrumentBuilder(from, to),
        price: limitPrice.toString(),
        timeInForce: "GTC",
        type: "LIMIT",
        positionFill: "DEFAULT",
      },
    };
  }
}
