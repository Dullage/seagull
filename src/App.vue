<template>
  <div>
    <!-- Nav Bar -->
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
      <div class="container">
        <a class="navbar-brand" href="/">Seagull</a>

        <button
          class="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarSupportedContent"
          aria-controls="navbarSupportedContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span class="navbar-toggler-icon"></span>
        </button>

        <div
          class="collapse navbar-collapse d-flex justify-content-end"
          id="navbarSupportedContent"
        >
          <ul class="navbar-nav">
            <!-- Config Modal Button -->
            <button
              type="button"
              class="btn btn-primary"
              data-bs-toggle="modal"
              data-bs-target="#configModal"
              @click="modalOpening"
            >
              Config
            </button>
          </ul>
        </div>
      </div>
    </nav>

    <!-- Config Modal -->
    <div
      class="modal fade"
      id="configModal"
      data-bs-backdrop="static"
      data-bs-keyboard="false"
      tabindex="-1"
      aria-labelledby="staticBackdropLabel"
      aria-hidden="true"
      style="display: none"
    >
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="staticBackdropLabel">Config</h5>
          </div>

          <div class="modal-body">
            <!-- Minimum Display Coins -->
            <div class="mb-3">
              <label for="showTop">Minimum Display Coins</label>
              <input
                class="form-control"
                type="number"
                id="showTop"
                v-model="configModal.showTop"
              />
            </div>

            <!-- Base Currency -->
            <div class="mb-3">
              <label for="baseCurrency" class="form-label">Base Currency</label>
              <select
                class="form-select"
                id="baseCurrency"
                v-model="configModal.baseCurrency"
              >
                <option>USD</option>
                <option>EUR</option>
                <option>GBP</option>
              </select>
            </div>

            <!-- Investment -->
            <div class="mb-3">
              <label for="baseCurrencyToInvest" class="form-label"
                >Investment</label
              >
              <div class="input-group">
                <span class="input-group-text">{{
                  currencySymbol(configModal.baseCurrency)
                }}</span>
                <input
                  type="number"
                  class="form-control"
                  v-model="configModal.baseCurrencyToInvest"
                  id="baseCurrencyToInvest"
                />
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              data-bs-dismiss="modal"
            >
              Cancel
            </button>
            <button
              type="button"
              class="btn btn-primary"
              data-bs-dismiss="modal"
              @click="modalSave"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Body -->
    <div class="container pt-3">
      <h2>My Index</h2>
      <table class="table table-hover table-borderless">
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th class="text-end">Market Cap</th>
            <th>Target Pct</th>
            <th class="text-end">Target Units</th>
            <th class="text-end">Holding Units</th>
            <th class="text-end">Units Diff</th>
            <th class="text-end">Target Value</th>
            <th class="text-end">Holding Value</th>
            <th class="text-end">Value Diff</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="coin in coins.filter(displayCoinFilter)"
            :class="{
              'target-coin-row': coin.isTarget,
              'text-muted': !coin.isTarget,
            }"
            :key="coin.id"
          >
            <td>{{ coin.marketCapRank }}</td>
            <td :title="coin.id">
              <img class="me-3" :src="coin.imageThumb" />{{ coin.name }} ({{
                coin.symbol | upper
              }})
            </td>
            <td class="text-end">{{ formatFiat(coin.marketCap, 0) }}</td>
            <td>{{ coin.targetPct | pct }}</td>
            <td class="text-end">{{ formatUnits(coin.targetUnits) }}</td>
            <td class="text-end">{{ formatUnits(coin.holdingUnits) }}</td>
            <td class="text-end">{{ formatUnits(coin.targetUnitsDiff) }}</td>
            <td class="text-end">{{ formatFiat(coin.targetValue) }}</td>
            <td class="text-end">{{ formatFiat(coin.holdingValue) }}</td>
            <td class="text-end">{{ formatFiat(coin.targetValueDiff) }}</td>
            <td>
              <button
                type="button"
                class="btn btn-sm target-button"
                :class="{
                  'btn-success': !coin.isTarget,
                  'btn-danger': coin.isTarget,
                }"
                @click="
                  coin.isTarget = !coin.isTarget;
                  calculateTargets();
                "
              >
                {{ coin.isTarget === true ? "Remove" : "Add" }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <h2>Total Investment</h2>
      <p>{{ formatFiat(totalInvestment) }}</p>
    </div>
  </div>
</template>

<script>
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
      },
      coins: [],
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
    },

    modalSave: function () {
      let getCoinsRequired = false;
      let recalculationRequired = false;
      // showTop
      if (this.config.showTop != this.configModal.showTop) {
        console.debug("showTop Changed");
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
        console.debug("baseCurrency Changed");
        this.config.baseCurrency = this.configModal.baseCurrency;
        getCoinsRequired = true;
      }
      // baseCurrencyToInvest
      if (
        this.config.baseCurrencyToInvest !=
        this.configModal.baseCurrencyToInvest
      ) {
        console.debug("baseCurrencyToInvest Changed");
        this.config.baseCurrencyToInvest = this.configModal.baseCurrencyToInvest;
        recalculationRequired = true;
      }
      // getCoins
      if (getCoinsRequired === true) {
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
      let pctRemaining = 1;

      this.coins.forEach(function (coin) {
        if (coin.isTarget) {
          coin.targetPct = Math.min(
            pctRemaining * (coin.marketCap / marketCapSumRemaining),
            parent.config.maxTargetPct
          );
          coin.targetValue = parent.totalInvestment * coin.targetPct;
          marketCapSumRemaining -= coin.marketCap;
          pctRemaining -= coin.targetPct;
        } else {
          coin.targetPct = 0
          coin.targetValue = 0
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
  },
};
</script>
