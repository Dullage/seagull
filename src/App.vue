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
              @click="onConfigModalOpen"
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
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <!-- Modal Header -->
          <div class="modal-header">
            <h5 class="modal-title">Config</h5>
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
    <div class="container pt-3">
      <form>
        <label for="baseCurrencyToInvest" class="form-label"
          >New Investment</label
        >
        <div class="input-group">
          <!-- <span class="input-group-text">{{
            currencySymbolFor(config.baseCurrency)
          }}</span> -->
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
            v-model.number.lazy="baseCurrencyToInvestInput"
            id="baseCurrencyToInvest"
          />
        </div>
      </form>

      <!-- Table -->
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
              'fw-bold': coin.isTarget,
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
              <!-- Include / Exclude Button -->
              <button
                type="button"
                :title="coin.isTarget ? 'Exclude' : 'Include'"
                class="btn btn-sm"
                :class="{
                  'btn-success': !coin.isTarget,
                  'btn-danger': coin.isTarget,
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
                class="btn btn-sm btn-secondary"
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
        <tfoot>
          <tr>
            <td colspan="7"></td>
            <td class="text-end">
              <strong>{{ formatFiat(totalInvestment) }}</strong>
            </td>
            <td class="text-end">
              <strong>{{ formatFiat(totalHoldings) }}</strong>
            </td>
            <td class="text-end">
              <strong>{{ formatFiat(config.baseCurrencyToInvest) }}</strong>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Show More / Less Buttons -->
    <div class="container text-center mb-5">
      <button
        type="button"
        class="btn btn-outline-primary btn-sm mx-auto me-2"
        @click="showMoreLess(5)"
      >
        Show More
      </button>
      <button
        type="button"
        class="btn btn-outline-secondary btn-sm mx-auto"
        @click="showMoreLess(-5)"
        :disabled="config.showTop <= 10"
      >
        Show Less
      </button>
    </div>
  </div>
</template>

<script>
export { default } from "./App.js";
</script>
