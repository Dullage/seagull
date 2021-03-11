<template>
  <div>
    <!-- Nav Bar -->
    <nav class="navbar navbar-light bg-light">
      <div class="container">
        <div>
          <a class="navbar-brand" href="/">Seagull</a>
          <small class="text-muted d-block"
            >A DIY cryptocurrency index builder</small
          >
        </div>
        <div class="d-flex justify-content-between">
          <!-- <ul class="navbar-nav"> -->
          <!-- Config Modal Button -->
          <button
            type="button"
            class="btn btn-primary"
            data-bs-toggle="modal"
            data-bs-target="#configModal"
            @click="onConfigModalOpen"
          >
            <i class="bi bi-gear me-1"></i> Configuration
          </button>
          <!-- </ul> -->
        </div>
      </div>
    </nav>

    <div v-if="config != null">
      <!-- Config Modal -->
      <div
        class="modal fade"
        id="configModal"
        data-bs-backdrop="static"
        data-bs-keyboard="false"
        tabindex="-1"
      >
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <!-- Modal Header -->
            <div class="modal-header">
              <h5 class="modal-title">Configuration</h5>
            </div>

            <!-- Modal Body -->
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
                <label for="baseCurrency" class="form-label"
                  >Base Currency</label
                >
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
              </div>
            </div>

            <!-- Modal Footer -->
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
                @click="onConfigModalSave"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Edit Holding Modal -->
      <div
        class="modal fade"
        id="editHoldingModal"
        data-bs-backdrop="static"
        data-bs-keyboard="false"
        tabindex="-1"
      >
        <div class="modal-dialog modal-dialog-centered modal-sm">
          <div class="modal-content">
            <!-- Modal Body -->
            <div class="modal-body">
              <div class="mb-3">
                <label for="holdingUnits" class="form-label"
                  >{{ editHoldingModal.coinName }} Holdings</label
                >
                <div class="input-group">
                  <span class="input-group-text">{{
                    editHoldingModal.coinSymbol | upper
                  }}</span>
                  <input
                    type="number"
                    class="form-control"
                    v-model.number="editHoldingModal.holdingUnits"
                    id="holdingUnits"
                  />
                </div>
              </div>
            </div>

            <!-- Modal Footer -->
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
                @click="onEditHoldingModalSave"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Body -->
      <div class="container pt-4">
        <div class="container text-center mb-4">
          <label for="baseCurrencyToInvest" class="form-label fw-bold">
            Fiat Investment
          </label>
          <div class="input-group">
            <select
              class="input-group-text"
              id="baseCurrency"
              v-model="config.baseCurrency"
            >
              <option>USD</option>
              <option>EUR</option>
              <option>GBP</option>
            </select>
            <input
              type="number"
              class="form-control"
              v-model.number.lazy="config.baseCurrencyToInvest"
              id="baseCurrencyToInvest"
            />
          </div>
        </div>

        <!-- Table -->
        <table class="table table-hover table-borderless">
          <!-- Headers -->
          <thead>
            <tr>
              <!-- Rank -->
              <th class="d-none d-xxl-table-cell">#</th>
              <!-- Coin -->
              <th>Coin</th>
              <!-- Market Cap -->
              <th class="d-none d-lg-table-cell text-end">Market Cap</th>
              <!-- Target Pct -->
              <th>Target Pct</th>
              <!-- Target Units -->
              <th class="text-end">Target Units</th>
              <!-- Holidng Units -->
              <th v-if="totalHoldings > 0" class="text-end">Holding Units</th>
              <!-- Units Diff -->
              <th
                v-if="totalHoldings > 0"
                class="d-none d-xxl-table-cell text-end"
              >
                Units Diff
              </th>
              <!-- Target Value -->
              <th class="d-none d-xxl-table-cell text-end">Target Value</th>
              <!-- Holding Value -->
              <th v-if="totalHoldings > 0" class="text-end">Holding Value</th>
              <!-- Value Diff -->
              <th
                v-if="totalHoldings > 0"
                class="d-none d-xxl-table-cell text-end"
              >
                Value Diff
              </th>
            </tr>
          </thead>
          <!-- Body -->
          <tbody>
            <tr
              v-for="coin in coins.filter(displayCoinFilter)"
              :class="{ 'text-muted': !coin.isTarget }"
              :key="coin.id"
            >
              <!-- Rank -->
              <td class="d-none d-xxl-table-cell">{{ coin.marketCapRank }}</td>
              <!-- Coin -->
              <td :title="coin.id" :class="{ 'fw-bold': coin.isTarget }">
                <img
                  class="d-none d-md-inline me-3"
                  :src="coin.imageThumb"
                /><span class="d-none d-xxl-inline"
                  >{{ coin.name }} ({{ coin.symbol | upper }})</span
                ><span class="d-xxl-none">{{ coin.symbol | upper }}</span>
              </td>
              <!-- Market Cap -->
              <td class="d-none d-lg-table-cell text-end">
                {{ formatFiat(coin.marketCap, 0) }}
              </td>
              <!-- Target Pct -->
              <td>{{ coin.targetValuePctOf(totalInvestment) | pct }}</td>
              <!-- Target Units -->
              <td class="text-end">{{ formatUnits(coin.targetUnits) }}</td>
              <!-- Holidng Units -->
              <td v-if="totalHoldings > 0" class="text-end">
                {{ formatUnits(coin.holdingUnits) }}
              </td>
              <!-- Units Diff -->
              <td
                v-if="totalHoldings > 0"
                class="d-none d-xxl-table-cell text-end"
              >
                {{ formatUnits(coin.targetUnitsDiff) }}
              </td>
              <!-- Target Value -->
              <td class="d-none d-xxl-table-cell text-end">
                {{ formatFiat(coin.targetValue) }}
              </td>
              <!-- Holding Value -->
              <td v-if="totalHoldings > 0" class="text-end">
                {{ formatFiat(coin.holdingValue) }}
              </td>
              <!-- Value Diff -->
              <td
                v-if="totalHoldings > 0"
                class="d-none d-xxl-table-cell text-end"
              >
                {{ formatFiat(coin.targetValueDiff) }}
              </td>
              <td>
                <!-- Include / Exclude Button -->
                <button
                  type="button"
                  :title="coin.isTarget ? 'Exclude' : 'Include'"
                  class="btn btn-sm include-exclude-btn"
                  :class="{
                    'btn-outline-success': !coin.isTarget,
                    'btn-outline-danger': coin.isTarget,
                  }"
                  @click="toggleCoinTarget(coin.id)"
                >
                  <i v-show="!coin.isTarget" class="bi bi-plus-circle"></i>
                  <i v-show="coin.isTarget" class="bi bi-dash-circle"></i>
                </button>

                <!-- Edit Holding Modal Button -->
                <button
                  type="button"
                  title="Edit Holding"
                  class="btn btn-sm btn-outline-secondary"
                  data-bs-toggle="modal"
                  data-bs-target="#editHoldingModal"
                  @click="
                    onEditHoldingModalOpen(
                      coin.id,
                      coin.name,
                      coin.symbol,
                      coin.holdingUnits
                    )
                  "
                >
                  <i class="bi bi-pencil"></i>
                </button>
              </td>
            </tr>
          </tbody>
          <!-- Totals -->
          <tfoot v-if="totalHoldings > 0">
            <tr>
              <!-- Rank -->
              <td class="d-none d-xxl-table-cell"></td>
              <!-- Coin -->
              <td></td>
              <!-- Market Cap -->
              <td class="d-none d-xxl-table-cell"></td>
              <!-- Target Pct -->
              <td></td>
              <!-- Target Units -->
              <td></td>
              <!-- Holidng Units -->
              <td></td>
              <!-- Units Diff -->
              <td class="d-none d-xxl-table-cell"></td>
              <!-- Target Value -->
              <td class="d-none d-xxl-table-cell text-end">
                <strong>{{ formatFiat(totalInvestment) }}</strong>
              </td>
              <!-- Holding Value -->
              <td class="text-end">
                <strong>{{ formatFiat(totalHoldings) }}</strong>
              </td>
              <!-- Value Diff -->
              <td class="d-none d-xxl-table-cell text-end">
                <strong>{{ formatFiat(-config.baseCurrencyToInvest) }}</strong>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Show More Button -->
      <div class="container text-center mb-5">
        <button
          type="button"
          class="btn btn-outline-primary btn-sm mx-auto"
          @click="showMoreLess(5)"
        >
          Show More
        </button>
      </div>
    </div>

    <div class="text-center text-muted fw-light mb-4">
      <a
        class="text-decoration-none text-reset"
        href="https://www.coingecko.com"
        >Powered by CoinGecko API</a
      >
      <span class="mx-3">|</span>
      <a
        class="text-decoration-none text-reset"
        href="https://github.com/Dullage/seagull"
        >View on <i class="bi bi-github"></i> GitHub
      </a>
    </div>
  </div>
</template>

<script>
export { default } from "./App.js";
</script>
