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
      baseCurrencyToInvestInput: 0,
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
    baseCurrencyToInvestInput: function() {
      this.config.baseCurrencyToInvest = this.baseCurrencyToInvestInput;
      this.calculateTargets();
    },
  },

  methods: {
    saveConfig: function() {
      localStorage.config = JSON.stringify(this.config);
    },

    loadConfig: function() {
      this.config = new Config(JSON.parse(localStorage.config));
    },

    onConfigModalOpen: function() {
      this.configModal.showTop = this.config.showTop;
      this.configModal.baseCurrency = this.config.baseCurrency;
      this.configModal.maxTargetPct = this.config.maxTargetPct;
    },

    onConfigModalSave: function() {
      let getCoinsRequired = false;
      let calculateTargetsRequired = false;
      // showTop
      if (this.config.showTop != this.configModal.showTop) {
        if (
          this.configModal.showTop > this.config.showTop &&
          this.configModal.showTop > minGetCoins
        ) {
          getCoinsRequired = true;
        }
        this.config.showTop = this.configModal.showTop;
      }
      // baseCurrency
      if (this.config.baseCurrency != this.configModal.baseCurrency) {
        this.config.baseCurrency = this.configModal.baseCurrency;
        getCoinsRequired = true;
      }
      // maxTargetPct
      if (this.config.maxTargetPct != this.configModal.maxTargetPct) {
        this.config.maxTargetPct = this.configModal.maxTargetPct;
        calculateTargetsRequired = true;
      }
      // getCoins
      if (getCoinsRequired === true) {
        this.getCoins();
      }
      // calculateTargets
      if (getCoinsRequired === false && calculateTargetsRequired === true) {
        this.calculateTargets();
      }
      this.saveConfig();
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
      // Update Config
      this.config.holdings[
        this.editHoldingModal.coinId
      ] = this.editHoldingModal.holdingUnits;
      this.saveConfig();
      // Update Coin
      const coin = this.coins.find(
        (coin) => coin.id === this.editHoldingModal.coinId
      );
      coin.holdingUnits = this.editHoldingModal.holdingUnits;
      // Recalculate
      this.calculateTargets();
    },

    showMoreLess: function(num) {
      this.config.showTop = Math.max(10, this.config.showTop + num);
      if (num > 0 && this.config.showTop > minGetCoins) {
        this.getCoins();
      }
      this.saveConfig();
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
        let holdingUnits = this.config.holdings[coinData.id] || 0;
        let isTarget = this.config.targetCoinIds.includes(coinData.id);
        coins.push(
          new Coin(
            coinData.id,
            coinData.symbol,
            coinData.name,
            coinData.image,
            coinData.current_price,
            coinData.market_cap,
            coinData.market_cap_rank,
            holdingUnits,
            isTarget
          )
        );
      }
      return coins;
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
          parent.calculateTargets();
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
      const coin = this.coins.find((coin) => coin.id === coinId);
      coin.isTarget = !coin.isTarget;
      if (coin.isTarget) {
        this.config.targetCoinIds.push(coinId);
      } else {
        const index = this.config.targetCoinIds.indexOf(coinId);
        if (index > -1) {
          this.config.targetCoinIds.splice(index, 1);
        }
      }
      this.calculateTargets();
      this.saveConfig();
    },

    displayCoinFilter: function(coin) {
      return (
        coin.isTarget == true ||
        coin.holdingUnits > 0 ||
        coin.marketCapRank <= this.config.showTop
      );
    },

    formatFiat: function(value, precision = 2) {
      return currency(value, {
        symbol: this.currencySymbolFor(this.config.baseCurrency),
        precision: precision,
      }).format();
    },

    formatUnits: function(value) {
      return Number(value).toFixed(8);
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
      return `${(value * 100).toFixed(2)}%`;
    },
  },

  created: function() {
    this.loadConfig();
    this.getCoins();
  },
};
