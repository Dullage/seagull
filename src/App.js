import axios from "axios";
import bootstrap from "bootstrap";

import Coin from "./coin.js";
import Config from "./config.js";
import currency from "currency.js";

const minGetCoins = 100;

export default {
  data: function () {
    return {
      config: null,
      configModal: {
        showTop: null,
        baseCurrency: null,
        baseCurrencyToInvest: null,
        maxTargetPct: null,
        holdings: null,
      },
      coins: [],
      coinList: {},
    };
  },

  computed: {
    targetCoins: function () {
      return this.coins.filter(function (coin) {
        return coin.isTarget === true;
      });
    },

    totalInvestment: function () {
      return (
        this.coins.map((coin) => coin.holdingValue).reduce((a, b) => a + b, 0) +
        this.config.baseCurrencyToInvest
      );
    },
  },

  methods: {
    modalOpening: function () {
      this.configModal.showTop = this.config.showTop;
      this.configModal.baseCurrency = this.config.baseCurrency;
      this.configModal.baseCurrencyToInvest = this.config.baseCurrencyToInvest;
      this.configModal.maxTargetPct = this.config.maxTargetPct;
      this.configModal.holdings = [];
      for (let [key, value] of Object.entries(this.config.holdings)) {
        this.configModal.holdings.push({ id: key, units: value, name: "TBC" });
      }
    },

    modalSave: function () {
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
      // baseCurrencyToInvest
      if (
        this.config.baseCurrencyToInvest !=
        this.configModal.baseCurrencyToInvest
      ) {
        this.config.baseCurrencyToInvest = this.configModal.baseCurrencyToInvest;
        calculateTargetsRequired = true;
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
    },

    showMore: function () {
      this.config.showTop += 5;
      if (this.config.showTop > minGetCoins) {
        this.getCoins();
      }
    },

    getCoinGeckoData: function (perPage, pageNum, coinIds = []) {
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

    getCoinGeckoCoinList: function () {
      const parent = this;
      axios
        .get("https://api.coingecko.com/api/v3/coins/list")
        .then(function (r) {
          r.data.forEach(function (coin) {
            parent.coinList[coin.id] = {
              name: coin.name,
              symbol: coin.symbol,
            };
          });
        });
    },

    parseCoinGeckoData: function (coinGeckoData) {
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

    getCoins: function () {
      console.debug("Getting Coin Data");
      const parent = this;
      this.getCoinGeckoData(Math.max(100, this.config.showTop), 1)
        .then(function (coinGeckoData) {
          const missingCoinIds = parent.checkForMissing(coinGeckoData.data);
          if (missingCoinIds.length > 0) {
            return parent
              .getCoinGeckoData(missingCoinIds.length, 1, missingCoinIds)
              .then(function (additionalCoinGeckoData) {
                return [...coinGeckoData.data, ...additionalCoinGeckoData.data];
              });
          } else {
            return coinGeckoData.data;
          }
        })
        .then(function (coinGeckoData) {
          parent.coins = parent.parseCoinGeckoData(coinGeckoData);
          parent.calculateTargets();
        });
    },

    checkForMissing: function (coinGeckoData) {
      const coinIds = coinGeckoData.map((coin) => coin.id);
      const importantCoinIds = [
        ...this.config.targetCoinIds,
        ...this.config.holdingCoinIds,
      ];
      return importantCoinIds.filter(function (id) {
        return !coinIds.includes(id);
      });
    },

    calculateTargets: function () {
      const parent = this;
      let marketCapSumRemaining = this.targetCoins
        .map((coin) => coin.marketCap)
        .reduce((a, b) => a + b, 0);
      let investmentValueLeft = this.totalInvestment;

      this.coins.forEach(function (coin) {
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

    displayCoinFilter: function (coin) {
      return (
        coin.isTarget == true ||
        coin.holdingUnits > 0 ||
        coin.marketCapRank <= this.config.showTop
      );
    },

    formatFiat: function (value, precision = 2) {
      return currency(value, {
        symbol: this.currencySymbol(this.config.baseCurrency),
        precision: precision,
      }).format();
    },

    formatUnits: function (value) {
      return Number(value).toFixed(8);
    },

    currencySymbol(isoCode) {
      return { USD: "$", GBP: "£", EUR: "€" }[isoCode];
    },
  },

  filters: {
    upper: function (value) {
      return value.toUpperCase();
    },

    pct: function (value) {
      return `${(value * 100).toFixed(2)}%`;
    },
  },

  created: function () {
    this.config = new Config(
      15,
      "GBP",
      500,
      {
        bitcoin: "0.05",
        ethereum: "1",
        ripple: "20",
        xsushi: "1",
        "gatechain-token": "0.45",
      },
      [
        "bitcoin",
        "ethereum",
        "tether",
        "ripple",
        "dash",
        "verge",
        "bitcoin-cash",
      ],
      0.5
    );
    this.getCoins();
    this.getCoinGeckoCoinList();
  },
};
