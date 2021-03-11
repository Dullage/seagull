import axios from "axios";
import bootstrap from "bootstrap";

import Coin from "./coin.js";
import Config from "./config.js";
import currency from "currency.js";

const minGetCoins = 100;

export default {
  data: function() {
    return {
      config: null,
      configModal: {
        showTop: null,
        baseCurrency: null,
        maxTargetPct: null,
      },
      editHoldingModal: {
        coinId: null,
        coinName: null,
        coinSymbol: null,
        holdingUnits: null,
      },
      coins: [],
    };
  },

  computed: {
    configCache: function() {
      // See https://github.com/vuejs/vue/issues/2164#issuecomment-542766308
      return JSON.stringify(this.config);
    },

    targetCoins: function() {
      return this.coins.filter(function(coin) {
        return coin.isTarget === true;
      });
    },

    totalHoldings: function() {
      return this.coins
        .map((coin) => coin.holdingValue)
        .reduce((a, b) => a + b, 0);
    },

    totalTarget: function() {
      return this.coins
        .map((coin) => coin.targetValue)
        .reduce((a, b) => a + b, 0);
    },

    totalInvestment: function() {
      return this.totalHoldings + this.config.baseCurrencyToInvest;
    },
  },

  watch: {
    configCache: {
      deep: true,
      handler: function(after, before) {
        console.debug("Config Updated");
        this.saveConfig();
        before = JSON.parse(before);
        after = JSON.parse(after);
        let getCoinsRequired = false;
        let updateCoinsRequired = false;
        let calculateTargetsRequired = false;
        if (before === null) {
          getCoinsRequired = true;
        }
        // showTop
        else if (
          after.showTop > before.showTop &&
          after.showTop > minGetCoins
        ) {
          getCoinsRequired = true;
        }
        // baseCurrency
        else if (before.baseCurrency != after.baseCurrency) {
          getCoinsRequired = true;
        }
        // holdings
        else if (before.holdings != after.holdings) {
          updateCoinsRequired = true;
        }
        // targetCoinIds
        else if (before.targetCoinIds != after.targetCoinIds) {
          updateCoinsRequired = true;
        }
        // maxTargetPct
        else if (before.maxTargetPct != after.maxTargetPct) {
          calculateTargetsRequired = true;
        }
        // baseCurrencyToInvest
        else if (before.baseCurrencyToInvest != after.baseCurrencyToInvest) {
          calculateTargetsRequired = true;
        }
        // Actions
        if (getCoinsRequired) {
          this.getCoins();
        } else if (updateCoinsRequired) {
          this.updateCoins();
        } else if (calculateTargetsRequired) {
          this.calculateTargets();
        }
      },
    },
  },

  methods: {
    saveConfig: function() {
      localStorage.config = JSON.stringify(this.config);
    },

    loadConfig: function() {
      this.config = new Config(JSON.parse(localStorage.config));
      this.baseCurrencyInput = this.config.baseCurrency;
      this.baseCurrencyToInvestInput = this.config.baseCurrencyToInvest;
    },

    onConfigModalOpen: function() {
      this.configModal.showTop = this.config.showTop;
      this.configModal.baseCurrency = this.config.baseCurrency;
      this.configModal.maxTargetPct = this.config.maxTargetPct;
    },

    onConfigModalSave: function() {
      this.config.showTop = this.configModal.showTop;
      this.config.baseCurrency = this.configModal.baseCurrency;
      this.config.maxTargetPct = this.configModal.maxTargetPct;
    },

    onEditHoldingModalOpen: function(
      coinId,
      coinName,
      coinSymbol,
      holdingUnits
    ) {
      this.editHoldingModal.coinId = coinId;
      this.editHoldingModal.coinName = coinName;
      this.editHoldingModal.coinSymbol = coinSymbol;
      this.editHoldingModal.holdingUnits = holdingUnits;
    },

    onEditHoldingModalSave: function() {
      this.config.holdings[
        this.editHoldingModal.coinId
      ] = this.editHoldingModal.holdingUnits;
    },

    showMoreLess: function(num) {
      this.config.showTop = Math.max(10, this.config.showTop + num);
    },

    getCoinGeckoData: function(perPage, pageNum, coinIds = []) {
      let requestConfig = {
        params: {
          vs_currency: this.config.baseCurrency,
          order: "market_cap_desc",
          per_page: perPage,
          page: pageNum,
        },
      };
      if (coinIds.length > 0) {
        requestConfig.params.ids = coinIds.join();
      }
      return axios.get(
        "https://api.coingecko.com/api/v3/coins/markets",
        requestConfig
      );
    },

    parseCoinGeckoData: function(coinGeckoData) {
      let coins = [];
      for (let coinData of coinGeckoData) {
        coins.push(
          new Coin(
            coinData.id,
            coinData.symbol,
            coinData.name,
            coinData.image,
            coinData.current_price,
            coinData.market_cap,
            coinData.market_cap_rank
          )
        );
      }
      return coins;
    },

    updateCoins: function() {
      for (let coin of this.coins) {
        coin.holdingUnits = this.config.holdings[coin.id] || 0;
        coin.isTarget = this.config.targetCoinIds.includes(coin.id);
      }
      this.calculateTargets();
    },

    getCoins: function() {
      console.debug("Getting Coin Data");
      const parent = this;
      this.getCoinGeckoData(Math.max(100, this.config.showTop), 1)
        .then(function(coinGeckoData) {
          const missingCoinIds = parent.checkForMissing(coinGeckoData.data);
          if (missingCoinIds.length > 0) {
            return parent
              .getCoinGeckoData(missingCoinIds.length, 1, missingCoinIds)
              .then(function(additionalCoinGeckoData) {
                return [...coinGeckoData.data, ...additionalCoinGeckoData.data];
              });
          } else {
            return coinGeckoData.data;
          }
        })
        .then(function(coinGeckoData) {
          parent.coins = parent.parseCoinGeckoData(coinGeckoData);
          parent.updateCoins();
        });
    },

    checkForMissing: function(coinGeckoData) {
      const coinIds = coinGeckoData.map((coin) => coin.id);
      const importantCoinIds = [
        ...this.config.targetCoinIds,
        ...this.config.holdingCoinIds,
      ];
      return importantCoinIds.filter(function(id) {
        return !coinIds.includes(id);
      });
    },

    calculateTargets: function() {
      const parent = this;
      let marketCapSumRemaining = this.targetCoins
        .map((coin) => coin.marketCap)
        .reduce((a, b) => a + b, 0);
      let investmentValueLeft = this.totalInvestment;

      this.coins.forEach(function(coin) {
        if (coin.isTarget) {
          coin.targetValue = Math.min(
            parent.totalInvestment * parent.config.maxTargetPct,
            investmentValueLeft * (coin.marketCap / marketCapSumRemaining)
          );
          marketCapSumRemaining -= coin.marketCap;
          investmentValueLeft -= coin.targetValue;
        } else {
          coin.targetValue = 0;
        }
      });
    },

    toggleCoinTarget: function(coinId) {
      const index = this.config.targetCoinIds.indexOf(coinId);
      if (index < 0) {
        this.config.targetCoinIds.push(coinId);
      } else {
        this.config.targetCoinIds.splice(index, 1);
      }
    },

    displayCoinFilter: function(coin) {
      return (
        coin.isTarget == true ||
        coin.holdingUnits > 0 ||
        coin.marketCapRank <= this.config.showTop
      );
    },

    formatFiat: function(value, precision = 2) {
      if (value == 0) {
        return "-";
      } else {
        return currency(value, {
          symbol: this.currencySymbolFor(this.config.baseCurrency),
          precision: precision,
        }).format();
      }
    },

    formatUnits: function(value) {
      if (value == 0) {
        return "-";
      } else {
        return +Number(value).toFixed(8);
      }
    },

    currencySymbolFor(isoCode) {
      return { USD: "$", GBP: "£", EUR: "€" }[isoCode];
    },
  },

  filters: {
    upper: function(value) {
      if (value === null) {
        return null;
      } else {
        return value.toUpperCase();
      }
    },

    pct: function(value) {
      if (value == 0) {
        return "-";
      } else {
        return `${+(value * 100).toFixed(2)}%`;
      }
    },
  },

  created: function() {
    this.loadConfig();
    // this.getCoins();
  },
};
