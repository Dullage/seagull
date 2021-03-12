class Config {
  constructor(config = {}) {
    this.showTop = config.showTop || 12;
    this.baseCurrency = config.baseCurrency || "GBP";
    this.baseCurrencyToInvest = config.baseCurrencyToInvest || 1000;
    this.holdings = config.holdings || {};
    this.targetCoinIds = config.targetCoinIds || [];
    this.maxTargetPct = config.maxTargetPct || 1;
  }

  get holdingCoinIds() {
    return Array.from(Object.keys(this.holdings));
  }
}

export default Config;
