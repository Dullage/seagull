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
            <button
              type="button"
              class="btn btn-primary"
              @click="showModal"
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
      tabindex="1"
    >
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="staticBackdropLabel">Config</h5>
          </div>

          <form class="modal-body">
            <!-- Minimum Display Coins -->
            <div class="mb-3">
              <label for="showTop">Minimum Display Coins</label>
              <input
                class="form-control"
                type="number"
                id="showTop"
                v-model="draftConfig.showTop"
              />
            </div>

            <!-- Base Currency -->
            <div class="mb-3">
              <label for="baseCurrency" class="form-label">Base Currency</label>
              <select
                class="form-select"
                id="baseCurrency"
                v-model="draftConfig.baseCurrency"
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
                  draftConfig.baseCurrencySymbol
                }}</span>
                <input
                  type="number"
                  class="form-control"
                  v-model="draftConfig.baseCurrencyToInvest"
                  id="baseCurrencyToInvest"
                />
              </div>
            </div>
          </form>

          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-primary"
              data-bs-dismiss="modal"
              @click="getCoins"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Body -->
    <div class="container pt-3">
      <table class="table table-hover">
        <tr>
          <th>Rank</th>
          <th>Name</th>
          <th class="text-end">Market Cap</th>
          <th>Target Pct</th>
          <th class="text-end">Target Units</th>
          <th class="text-end">Holding Units</th>
          <th class="text-end">Units Diff</th>
          <th class="text-end">Target Value</th>
          <th class="text-end">Holding Value</th>
          <th class="text-end">Value Diff</th>
          <th></th>
        </tr>
        <tr
          v-for="coin in coins.filter(displayCoinFilter)"
          :class="{ 'text-muted': coin.is_target == false }"
          :key="coin.id"
        >
          <th>{{ coin.marketCapRank }}</th>
          <th :title="coin.id">
            <img class="me-3" :src="coin.imageThumb" />{{ coin.name }} ({{
              coin.symbol | upper
            }})
          </th>
          <th class="text-end">{{ formatFiat(coin.marketCap, 0) }}</th>
          <th>{{ coin.targetPct | pct }}</th>
          <th class="text-end">{{ formatUnits(coin.targetUnits) }}</th>
          <th class="text-end">{{ formatUnits(coin.holdingUnits) }}</th>
          <th class="text-end">{{ formatUnits(coin.targetUnitsDiff) }}</th>
          <th class="text-end">{{ formatFiat(coin.targetValue) }}</th>
          <th class="text-end">{{ formatFiat(coin.holdingValue) }}</th>
          <th class="text-end">{{ formatFiat(coin.targetValueDiff) }}</th>
        </tr>
      </table>

      <!-- <h2>Total Investment</h2>
      <p>{{ formatFiat(total_investment }}</p> -->
    </div>
  </div>
</template>

<script>
import axios from "axios";
import bootstrap from "bootstrap";

import Coin from "./coin.js";
import Config from "./config.js";
import currency from "currency.js";

export default {
  data: function () {
    return {
      config: null,
      draftConfig: null,
      coins: [],
    };
  },

  methods: {
    updateDraftConfig: function () {
      this.draftConfig = new Config(
        this.config.showTop,
        this.config.baseCurrency,
        this.config.baseCurrencyToInvest,
        this.config.holdings,
        this.config.targetCoinIds,
        this.config.maxTargetPct
      );
    },

    showModal: function() {
      this.updateDraftConfig()
      let myModal = new bootstrap.Modal(document.getElementById('configModal'))
      myModal.toggle();
    },

    saveConfigForm: function() {
      
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
        });
    },

    checkForMissing: function (coinGeckoData) {
      const coinIds = coinGeckoData.map((coin) => coin.id);
      const targetCoinIds = [
        ...this.config.targetCoinIds,
        ...this.config.holdingCoinIds,
      ];
      return targetCoinIds.filter(function (id) {
        return !coinIds.includes(id);
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
        symbol: this.config.baseCurrencySymbol,
        precision: precision,
      }).format();
    },

    formatUnits: function (value) {
      return Number(value).toFixed(8);
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
      50
    );
    this.updateDraftConfig();
    this.getCoins();
  },
};
</script>
