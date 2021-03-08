class Config {
  constructor(config = {}) {
    this.showTop = config.showTop || 15;
    this.baseCurrency = config.baseCurrency || "GBP";
    this.baseCurrencyToInvest = config.baseCurrencyToInvest || 0;
    this.holdings = config.holdings || {};
    this.targetCoinIds = config.targetCoinIds || [];
    this.maxTargetPct = config.maxTargetPct || 100;
  }

  get holdingCoinIds() {
    return Array.from(Object.keys(this.holdings));
  }
}

export default Config;
