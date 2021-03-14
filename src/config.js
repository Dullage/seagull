class Config {
  constructor(config = {}) {
    this.showTop = "showTop" in config ? config.showTop : 12;
    this.baseCurrency = "baseCurrency" in config ? config.baseCurrency : "GBP";
    this.baseCurrencyToInvest =
      "baseCurrencyToInvest" in config ? config.baseCurrencyToInvest : 1000;
    this.holdings = "holdings" in config ? config.holdings : {};
    this.targetCoinIds = "targetCoinIds" in config ? config.targetCoinIds : [];
    this.maxTargetPct = "maxTargetPct" in config ? config.maxTargetPct : 1;
  }

  get holdingCoinIds() {
    return Array.from(Object.keys(this.holdings));
  }
}

export default Config;
