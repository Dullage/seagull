class Config {
  constructor(
    showTop = 15,
    baseCurrency = "USD",
    baseCurrencyToInvest = 0,
    holdings = {},
    targetCoinIds = [],
    maxTargetPct = 100
  ) {
    this.showTop = showTop;
    this.baseCurrency = baseCurrency;
    this.baseCurrencyToInvest = baseCurrencyToInvest;
    this.holdings = holdings;
    this.targetCoinIds = targetCoinIds;
    this.maxTargetPct = maxTargetPct;
  }

  get baseCurrencySymbol() {
    return { USD: "$", GBP: "£", EUR: "€" }[this.baseCurrency];
  }

  get holdingCoinIds() {
    return Array.from(Object.keys(this.holdings));
  }
}

export default Config;
