<template>
  <div>
    <!-- Nav Bar -->
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
      <div class="container">
        <a class="navbar-brand" href="/">Seagull</a>
        <small class="text-muted">A DIY cryptocurrency index builder</small>

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
                v-model.number="configModal.showTop"
              />
              <div class="form-text">Some instructional text...</div>
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
                  v-model.number="configModal.baseCurrencyToInvest"
                  id="baseCurrencyToInvest"
                />
              </div>
            </div>

            <!-- Maximum Target Percentage -->
            <div class="mb-3">
              <label for="maxTargetPct" class="form-label"
                >Maximum Target Percentage:
                <strong
                  >{{ (configModal.maxTargetPct * 100).toFixed(0) }}%</strong
                ></label
              >
              <input
                type="range"
                class="form-range"
                id="maxTargetPct"
                min="0"
                max="1"
                step="0.01"
                v-model.number="configModal.maxTargetPct"
              />
              <div class="form-text">Some instructional text...</div>

              <!-- Holdings -->
              <div class="mb-3">
                <div
                  class="row mb-3"
                  v-for="coin in configModal.holdings"
                  :key="coin.id"
                >
                  <label class="col-sm-2 col-form-label">{{
                    coinList[coin.id].name
                  }}</label>
                  <div class="col-sm-10">
                    <input
                      type="number"
                      class="form-control"
                      v-model.number="coin.units"
                    />
                  </div>
                </div>
                <select class="form-select">
                  <option selected></option>
                  <option
                    v-for="(value, key) in coinList"
                    :value="value.id"
                    :key="value.id"
                  >
                    {{ value.name }}
                  </option>
                </select>
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
      <h2>Total Investment</h2>
      <p>{{ formatFiat(totalInvestment) }}</p>

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
            <td>{{ coin.targetValuePctOf(totalInvestment) | pct }}</td>
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
    </div>
    <div class="container text-center">
      <button
        type="button"
        class="btn btn-outline-secondary btn-sm mx-auto mb-4"
        @click="showMore"
      >
        Show More
      </button>
    </div>
  </div>
</template>

<script>
export { default } from "./App.js";
</script>
