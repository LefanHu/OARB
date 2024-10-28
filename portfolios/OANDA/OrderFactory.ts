class OrderFactory {
  private static instrumentBuilder(from: string, to: string): string {
    return `${from}_${to}`;
  }

  public static createOrder(
    from: string,
    to: string,
    amount: number,
    limitPrice: number
  ) {}
}
