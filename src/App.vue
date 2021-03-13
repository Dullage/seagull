<template>
  <div>
    <!-- Nav Bar -->
    <nav class="navbar navbar-light bg-light">
      <div class="container">
        <!-- Brand -->
        <a class="d-flex align-items-center text-decoration-none" href="/">
          <img
            src="wsnaccad-origami-bird.svg"
            id="logo"
            alt="Origami Bird"
            class="me-3"
          />
          <div>
            <span class="navbar-brand">Seagull</span>
            <small class="text-muted d-block"
              >A DIY cryptocurrency index calculator</small
            >
          </div>
        </a>
        <!-- Config Modal Button -->
        <div class="d-flex justify-content-between">
          <ul class="navbar-nav">
            <button
              type="button"
              class="btn btn-primary"
              data-bs-toggle="modal"
              data-bs-target="#configModal"
              @click="onConfigModalOpen"
            >
              <i class="bi bi-gear"></i
              ><span class="d-none d-sm-inline ms-2">Configuration</span>
            </button>
          </ul>
        </div>
      </div>
    </nav>

    <div v-if="loading" class="loader"></div>

    <div v-else>
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
              <!-- Remember Me -->
              <div class="form-check form-switch mb-4">
                <input
                  class="form-check-input"
                  type="checkbox"
                  id="rememberMe"
                  v-model="configModal.rememberMe"
                />
                <label class="form-check-label" for="rememberMe"
                  >Remember Me</label
                >
                <div class="form-text">
                  Store all configuration on this device.
                </div>
              </div>

              <!-- Minimum Display Coins -->
              <div class="mb-4">
                <label for="showTop">Minimum Display Coins</label>
                <input
                  class="form-control"
                  type="number"
                  id="showTop"
                  v-model.number="configModal.showTop"
                />
                <div class="form-text">
                  The minumum amount of coins to show. Note: Coins you are
                  holding and coins in your index will always be shown.
                </div>
              </div>

              <!-- Base Currency -->
              <div class="mb-4">
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
              <div>
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
                <div class="form-text">
                  The maximum target percentage a single coin can be allocated.
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
                @click="onConfigModalSave"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Edit Coin Modal -->
      <div
        class="modal fade"
        id="editCoinModal"
        data-bs-backdrop="static"
        data-bs-keyboard="false"
        tabindex="-1"
      >
        <div class="modal-dialog modal-dialog-centered modal-sm">
          <div class="modal-content">
            <!-- Modal Body -->
            <div class="modal-body">

              <!-- Holding Units -->
              <div class="mb-3">
                <label for="holdingUnits" class="form-label">Holdings</label>
                <div class="input-group">
                  <span class="input-group-text">{{
                    editCoinModal.coinSymbol | upper
                  }}</span>
                  <input
                    type="number"
                    class="form-control"
                    v-model.number="editCoinModal.holdingUnits"
                    id="holdingUnits"
                  />
                </div>
              </div>

              <!-- isTarget -->
              <div class="form-check form-switch mb-3">
                <input
                  class="form-check-input"
                  type="checkbox"
                  id="isTarget"
                  v-model="editCoinModal.isTarget"
                />
                <label class="form-check-label" for="isTarget"
                  >Include in Index</label
                >
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
                @click="onEditCoinModalSave"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Body -->
      <div class="container pt-4">
        <!-- Fiat Investment -->
        <div class="container text-center mb-4">
          <label for="baseCurrencyToInvest" class="form-label fw-bold">
            Fiat Investment
          </label>
          <div class="input-group">
            <select
              class="input-group-text"
              id="baseCurrency"
              v-model="config.baseCurrency"
              @change="configUpdated"
            >
              <option>USD</option>
              <option>EUR</option>
              <option>GBP</option>
            </select>
            <input
              type="number"
              class="form-control"
              v-model.number.lazy="config.baseCurrencyToInvest"
              @change="configUpdated"
              id="baseCurrencyToInvest"
            />
          </div>
        </div>

        <!-- Table -->
        <table
          class="table table-hover table-borderless"
          :class="{ small: totalHoldings > 0 }"
        >
          <!-- Headers -->
          <thead>
            <tr>
              <!-- Rank -->
              <th class="d-none d-xxl-table-cell">#</th>
              <!-- Icon + Coin -->
              <th colspan="2">Coin</th>
              <!-- Market Cap -->
              <th class="d-none d-lg-table-cell text-end">Market Cap</th>
              <!-- Target Pct -->
              <th>Target Pct</th>
              <!-- Target Units -->
              <th class="text-end">Target Units</th>
              <!-- Holidng Units -->
              <th
                v-if="totalHoldings > 0"
                class="d-none d-md-table-cell text-end"
              >
                Holding Units
              </th>
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
              <th
                v-if="totalHoldings > 0"
                class="d-none d-sm-table-cell text-end"
              >
                Holding Value
              </th>
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
              <!-- Icon + Coin-->
              <td><img class="me-x" :src="coin.imageThumb" /></td>
              <td :title="coin.id" :class="{ 'fw-bold': coin.isTarget }">
                <span class="d-none d-md-inline"
                  >{{ coin.name }} ({{ coin.symbol | upper }})</span
                ><span class="d-md-none">{{ coin.symbol | upper }}</span>
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
              <td
                v-if="totalHoldings > 0"
                class="d-none d-md-table-cell text-end"
              >
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
              <td
                v-if="totalHoldings > 0"
                class="d-none d-sm-table-cell text-end"
              >
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
                  class="btn btn-sm"
                  :class="{
                    'btn-outline-success': !coin.isTarget,
                    'btn-outline-danger': coin.isTarget,
                  }"
                  @click="toggleCoinTarget(coin.id)"
                >
                  <i v-show="!coin.isTarget" class="bi bi-plus-circle-fill"></i>
                  <i v-show="coin.isTarget" class="bi bi-dash-circle-fill"></i>
                </button>

                <!-- Edit Holding Modal Button -->
                <button
                  type="button"
                  title="Edit Holding"
                  class="btn btn-sm btn-outline-secondary d-none d-sm-table-cell"
                  data-bs-toggle="modal"
                  data-bs-target="#editCoinModal"
                  @click="onEditCoinModalOpen(coin)"
                >
                  <i class="bi bi-pencil-fill"></i>
                </button>
              </td>
            </tr>
          </tbody>
          
          <!-- Totals -->
          <tfoot v-if="totalHoldings > 0">
            <tr>
              <!-- Rank -->
              <td class="d-none d-xxl-table-cell"></td>
              <!-- Icon + Coin -->
              <td colspan="2"></td>
              <!-- Market Cap -->
              <td class="d-none d-lg-table-cell"></td>
              <!-- Target Pct -->
              <td></td>
              <!-- Target Units -->
              <td></td>
              <!-- Holidng Units -->
              <td class="d-none d-md-table-cell"></td>
              <!-- Units Diff -->
              <td class="d-none d-xxl-table-cell"></td>
              <!-- Target Value -->
              <td class="d-none d-xxl-table-cell text-end">
                <strong>{{ formatFiat(totalInvestment) }}</strong>
              </td>
              <!-- Holding Value -->
              <td class="d-none d-sm-table-cell text-end">
                <strong>{{ formatFiat(totalHoldings) }}</strong>
              </td>
              <!-- Value Diff -->
              <td class="d-none d-xxl-table-cell text-end">
                <strong>{{ formatFiat(-config.baseCurrencyToInvest) }}</strong>
              </td>
            </tr>
          </tfoot>
        </table>

        <!-- Show More Button -->
        <div class="text-center mb-4">
          <button
            type="button"
            class="btn btn-outline-primary btn-sm mx-auto"
            @click="showMoreLess(5)"
          >
            Show More
          </button>
        </div>

        <!-- Tip -->
        <div class="d-sm-none text-center text-muted mb-4">
          <i class="bi bi-lightbulb me-1"></i
          ><small
            >Tip: Switch to a large screen to view and manage holdings.</small
          >
        </div>

        <!-- Footer -->
        <div class="small text-center text-muted fw-light my-3">
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
    </div>
  </div>
</template>

<script>
export { default } from "./App.js";
</script>
