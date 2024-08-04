<template>
  <div class="row g-3 mb-3 row-deck">
    <h3 class="mb-0 fw-bold">Chi tiết các tài sản</h3>
    <div class="col-xl-12">

      <div class="card">

        <div class="card-header py-3 d-flex justify-content-end bg-transparent border-bottom align-items-center flex-wrap">

          <ul class="nav nav-pills rounded d-inline-flex" role="tablist">
            <li class="nav-item" v-for="(wallet, index) in wallets" :key="wallet.cryptocurrency.cryptocurrency_name">
              <a class="nav-link"  :class="index === 0 ? 'active': ''" @click="changCryptocurrencySelected(wallet.cryptocurrency)" data-bs-toggle="tab" :href="'#' + wallet.cryptocurrency.cryptocurrency_name" role="tab">
                {{ wallet.cryptocurrency.cryptocurrency_name }}
              </a>
            </li>
<!--            <li class="nav-item">-->
<!--              <a class="nav-link" data-bs-toggle="tab" href="#vnd_wallet" role="tab">-->
<!--                VND-->
<!--              </a>-->
<!--            </li>-->
          </ul>
        </div>
        <div class="card-body">
          <div class="tab-content">

            <div class="tab-pane fade show"  :class="index === 0 ? 'active': ''" :id="wallet.cryptocurrency.cryptocurrency_name" v-for="(wallet, index) in wallets" :key="wallet.cryptocurrency.cryptocurrency_name">
              <div class="row g-3">
                <div class="col-lg-6">
                  <div>Tài sản:</div>
                  <h3>{{ wallet.balance_amount.toLocaleString('en-US', {maximumFractionDigits: 8}) }} {{ wallet.cryptocurrency.cryptocurrency_name }}
<!--                    <template v-if="wallet.cryptocurrency && wallet.cryptocurrency.cryptocurrency_name !== 'USDT'">-->
<!--                      ≈ {{ getUsdtValue(wallet) }} USDT-->
<!--                    </template>-->
                  </h3>
                  <template v-if="wallet.cryptocurrency.default_exchange_enabled">
                    <div>Tổng nạp:</div>
                    <h4>{{ wallet.total_deposit.toLocaleString('en-US', {maximumFractionDigits: 2}) }} {{ wallet.cryptocurrency.cryptocurrency_name }}</h4>
                  </template>
                  <template v-if="wallet.cryptocurrency.default_exchange_enabled">
                    <div>Tổng lần nạp:</div>
                    <h4>{{ wallet.total_number_deposit }} Lần</h4>
                  </template>
                  <template v-if="wallet.cryptocurrency.default_withdraw_enabled">
                    <div>Tổng lần rút:</div>
                    <h4>{{ wallet.total_number_withdraw }} Lần</h4>
                  </template>
                  <template v-if="wallet.cryptocurrency.default_withdraw_enabled">
                    <div>Tổng rút:</div>
                    <h4>{{ wallet.total_deposit.toLocaleString('en-US', {maximumFractionDigits: 2}) }} {{ wallet.cryptocurrency.cryptocurrency_name }}</h4>
                  </template>
                  <template v-if="wallet.cryptocurrency.default_withdraw_enabled">
                    <div>Số tiền đang đợi giải ngân</div>
                    <h4>{{ wallet.total_await_disbursement.toLocaleString('en-US', {maximumFractionDigits: 2}) }} {{ wallet.cryptocurrency.cryptocurrency_name }}</h4>
                  </template>
                </div>
                <div class="mb-3 d-flex">
                  <a v-if="wallet.cryptocurrency.default_deposit_enabled" type="button" href="#" @click="showDepositCrypto(wallet.cryptocurrency._id)" class="btn btn-light-success py-2 text-uppercase me-2">Nạp {{ wallet.cryptocurrency.cryptocurrency_name}}</a>
                  <a v-if="wallet.cryptocurrency.default_exchange_enabled" type="button" href="#" @click="showSellCrypto(wallet.cryptocurrency._id)" class="btn btn-light-warning py-2 text-uppercase me-2">Chuyển đổi {{ wallet.cryptocurrency.cryptocurrency_name}}</a>
                  <a v-if="wallet.cryptocurrency.default_withdraw_enabled" type="button" href="/with-draw" class="btn btn-light-info py-2 text-uppercase me-2">Rút {{ wallet.cryptocurrency.cryptocurrency_name}}</a>

                </div>
              </div>
            </div>

<!--            <div class="tab-pane fade show" id="vnd_wallet">-->
<!--              <div class="row g-3">-->
<!--                <div class="col-lg-6">-->
<!--                  <div>Tài sản:</div>-->
<!--                  <h3>{{ vnd_wallet.toLocaleString('en-US', {maximumFractionDigits: 2}) }} VND</h3>-->
<!--                  <div>Số tiền đang đợi giải ngân</div>-->
<!--                  <h4>{{ total_await_disbursement_vnd.toLocaleString('en-US', {maximumFractionDigits: 2}) }} VND</h4>-->
<!--                  <div>Tổng rút</div>-->
<!--                  <h4>{{ total_withdraw_vnd.toLocaleString('en-US', {maximumFractionDigits: 2}) }} VND</h4>-->
<!--                </div>-->
<!--                <div class="mb-3 d-flex">-->
<!--                  <a type="button" href="/with-draw" class="btn btn-light-danger py-2 text-uppercase me-2">Rút</a>-->
<!--                </div>-->
<!--              </div>-->
<!--            </div>-->
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>

import Api from "../../common/js/Api";

export default {
  props: {
    wallets: {
      type: Array,
      required: true
    },
    cryptocurrencies: {
      type: Array,
      required: true
    },
    vnd_wallet: {
      type: Number,
      required: true,
      default: 0
    },
    total_withdraw_vnd: {
      type: Number,
      required: true,
      default: 0
    },
    total_await_disbursement_vnd: {
      type: Number,
      required: true,
      default: 0
    }
  },
  data() {
    return {
      cryptocurrency_selected: null,
      usdtRates: {},
    };
  },
  watch: {
    cryptocurrency_selected:{
      handler(newVal) {
        this.stopUsdtRatePolling()

        if(newVal) {
          if(newVal.cryptocurrency_name !== 'USDT'){

            this.fetchUsdtRate(newVal._id);
            this.startUsdtRatePolling(newVal);
          }
        }
      },
      deep: true,
      immediate: true
    }
  },
  mounted() {


  },
  beforeUnmount() {
    this.stopUsdtRatePolling();
  },
  methods: {
    changCryptocurrencySelected(cryptocurrency){
      this.cryptocurrency_selected = cryptocurrency
      this.$emit('showSellCrypto', null);
    },
    showSellCrypto(cryptocurrency){
      this.$emit('showSellCrypto', cryptocurrency);
    },
    showDepositCrypto(cryptocurrency){
      this.$emit('showDepositCrypto', cryptocurrency);
    },
    async fetchUsdtRate(cryptocurrencyId) {
      try {
        if(cryptocurrencyId){
          const response = await Api.get(`/api/cryptocurrencies/rate-usdt/${cryptocurrencyId}`);
          this.usdtRates[cryptocurrencyId] = response.data.usdt_exchange_rate;
        }

      } catch (error) {
        console.error('Failed to fetch USDT exchange rate:', error);
      }
    },
    getUsdtValue(wallet) {
      const cryptocurrencyId = wallet.cryptocurrency._id;
      const usdtRate = this.usdtRates[cryptocurrencyId] || 0;
      const usdtValue = wallet.balance_amount * usdtRate;
      return usdtValue.toLocaleString('en-US', {maximumFractionDigits: 8});
    },
    startUsdtRatePolling(cryptocurrency_selected) {

      this.usdtRateInterval = setInterval(() => {
        this.fetchUsdtRate(cryptocurrency_selected._id);
      }, 5000);
    },
    stopUsdtRatePolling() {
      clearInterval(this.usdtRateInterval);
    },
  },
};
</script>