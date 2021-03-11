class Coin {
  constructor(
    id,
    symbol,
    name,
    imageUrl,
    currentPrice,
    marketCap,
    marketCapRank,
    holdingUnits = 0,
    isTarget = false
  ) {
    this.id = id;
    this.symbol = symbol;
    this.name = name;
    this.imageUrl = imageUrl;
    this.currentPrice = currentPrice;
    this.marketCap = marketCap;
    this.marketCapRank = marketCapRank;
    this.holdingUnits = holdingUnits;
    this.isTarget = isTarget;

    this.targetValue = 0;
  }

  get holdingValue() {
    return this.holdingUnits * this.currentPrice;
  }

  get targetUnits() {
    return this.targetValue / this.currentPrice;
  }

  get targetUnitsDiff() {
    return this.holdingUnits - this.targetUnits;
  }

  get targetValueDiff() {
    return this.targetUnitsDiff * this.currentPrice;
  }

  get imageThumb() {
      return this.imageUrl.replace("/large/", "/thumb/")
  }

  targetValuePctOf(totalValue) {
    return this.targetValue / totalValue || 0
  }
}

export default Coin;
