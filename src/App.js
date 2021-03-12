import axios from "axios";
import bootstrap from "bootstrap";

import Coin from "./coin.js";
import Config from "./config.js";
import currency from "currency.js";

const minGetCoins = 100;
const configLocalStorageKey = "config";

export default {
  data: function() {
    return {
      loading: true,
      config: null,
      configCache: null,
      setDefaultTargetCoins: false,
      rememberMe: false,
      configModal: {
        rememberMe: null,
        showTop: null,
        baseCurrency: null,
        maxTargetPct: null,
      },
      editCoinModal: {
        coinId: null,
        coinName: null,
        coinSymbol: null,
        holdingUnits: null,
        isTarget: null,
      },
      coins: [],
    };
  },

  computed: {
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
    rememberMe: function(newValue) {
      if (newValue === true) {
        this.persistConfig();
      } else {
        this.deletePersistedConfig();
      }
    },
  },

  methods: {
    persistConfig: function() {
      localStorage[configLocalStorageKey] = JSON.stringify(this.config);
    },

    deletePersistedConfig: function() {
      localStorage.removeItem(configLocalStorageKey);
    },

    loadPersistedConfig: function() {
      let config = localStorage[configLocalStorageKey];
      if (typeof config !== "undefined") {
        this.rememberMe = true;
        this.config = new Config(JSON.parse(config));
      } else {
        this.setDefaultTargetCoins = true;
        this.config = new Config();
      }
      this.configUpdated();
    },

    configUpdated: function() {
      if (this.rememberMe === true) {
        this.persistConfig();
      }
      let getCoinsRequired = false;
      let updateCoinsRequired = false;
      let calculateTargetsRequired = false;
      if (this.configCache === null) {
        getCoinsRequired = true;
      }
      // showTop
      else if (
        this.config.showTop > this.configCache.showTop &&
        this.config.showTop > minGetCoins
      ) {
        getCoinsRequired = true;
      }
      // baseCurrency
      else if (this.configCache.baseCurrency != this.config.baseCurrency) {
        getCoinsRequired = true;
      }
      // holdings
      else if (this.configCache.holdings != this.config.holdings) {
        updateCoinsRequired = true;
      }
      // targetCoinIds
      else if (this.configCache.targetCoinIds != this.config.targetCoinIds) {
        updateCoinsRequired = true;
      }
      // maxTargetPct
      else if (this.configCache.maxTargetPct != this.config.maxTargetPct) {
        calculateTargetsRequired = true;
      }
      // baseCurrencyToInvest
      else if (
        this.configCache.baseCurrencyToInvest !=
        this.config.baseCurrencyToInvest
      ) {
        calculateTargetsRequired = true;
      }
      // Actions
      this.configCache = JSON.parse(JSON.stringify(this.config));
      if (getCoinsRequired) {
        this.getCoins();
      } else if (updateCoinsRequired) {
        this.updateCoins();
      } else if (calculateTargetsRequired) {
        this.calculateTargets();
      }
    },

    onConfigModalOpen: function() {
      this.configModal.rememberMe = this.rememberMe;
      this.configModal.showTop = this.config.showTop;
      this.configModal.baseCurrency = this.config.baseCurrency;
      this.configModal.maxTargetPct = this.config.maxTargetPct;
    },

    onConfigModalSave: function() {
      this.rememberMe = this.configModal.rememberMe;
      this.config.showTop = this.configModal.showTop;
      this.config.baseCurrency = this.configModal.baseCurrency;
      this.config.maxTargetPct = this.configModal.maxTargetPct;
      this.configUpdated();
    },

    oneditCoinModalOpen: function(coin) {
      this.editCoinModal.coinId = coin.id;
      this.editCoinModal.coinName = coin.name;
      this.editCoinModal.coinSymbol = coin.symbol;
      this.editCoinModal.holdingUnits = coin.holdingUnits;
      this.editCoinModal.isTarget = coin.isTarget;
    },

    oneditCoinModalSave: function() {
      this.config.holdings[
        this.editCoinModal.coinId
      ] = this.editCoinModal.holdingUnits;
      let targetCoinIdIndex = this.config.targetCoinIds.indexOf(
        this.editCoinModal.coinId
      );
      if (this.editCoinModal.isTarget === false && targetCoinIdIndex > -1) {
        this.config.targetCoinIds.splice(targetCoinIdIndex, 1);
      } else if (
        this.editCoinModal.isTarget === true &&
        targetCoinIdIndex === -1
      ) {
        this.config.targetCoinIds.push(this.editCoinModal.coinId);
      }
      this.configUpdated();
    },

    showMoreLess: function(num) {
      this.config.showTop = Math.max(10, this.config.showTop + num);
      this.configUpdated();
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
      if (this.setDefaultTargetCoins === true) {
        parent = this;
        // Set the top 10 coins as targets
        this.coins.slice(0, 10).forEach(function(coin) {
          parent.config.targetCoinIds.push(coin.id);
        });
        this.setDefaultTargetCoins = false;
      }
      for (let coin of this.coins) {
        coin.holdingUnits = this.config.holdings[coin.id] || 0;
        coin.isTarget = this.config.targetCoinIds.includes(coin.id);
      }
      this.calculateTargets();
    },

    getCoins: function() {
      this.loading = true;
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
      this.loading = false;
    },

    toggleCoinTarget: function(coinId) {
      const index = this.config.targetCoinIds.indexOf(coinId);
      if (index < 0) {
        this.config.targetCoinIds.push(coinId);
      } else {
        this.config.targetCoinIds.splice(index, 1);
      }
      this.configUpdated();
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
    this.loadPersistedConfig();
  },
};
