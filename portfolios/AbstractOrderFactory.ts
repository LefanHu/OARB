export abstract class OrderFactoryBase {
  protected instrumentBuilder(from: string, to: string): string {
    return `${from}_${to}`;
  }

  public abstract createMarketOrder(
    from: string,
    to: string,
    amount: number
  ): any;

  public abstract createLimitOrder(
    from: string,
    to: string,
    amount: number,
    limitPrice: number
  ): any;
}
