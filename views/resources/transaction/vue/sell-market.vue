<template>
  <div class="row g-3 mb-3 row-deck">
    <div class="col-xl-12 col-xxl-12">
      <div class="card">
        <div class="card-header py-3 d-flex justify-content-between bg-transparent align-items-center">
          <h6 class="mb-0 fw-bold">Chuyển đổi tiền số</h6>
        </div>
        <div class="card-body">
          <form @submit.prevent="convertTo">
            <div class="row g-3 mb-3">
              <div class="col-sm-12">
                <label class="form-label">Chọn tiền số sẽ chuyển đổi</label>
                <select v-model="selectedCryptocurrencyFrom" required class="form-select">
                  <option v-for="(cryptocurrency, index) in cryptocurrenciesFilter" :key="index" :value="cryptocurrency">
                    {{ cryptocurrency.cryptocurrency_name }}
                  </option>
                </select>
              </div>
              <div class="col-sm-12">
                <label class="form-label">Chọn loại tiền số chuyển đổi sang</label>
                <select v-model="selectedCryptocurrencyTo" required class="form-select">
                  <option v-for="(cryptocurrency, index) in cryptocurrenciesFilterTo" :key="index" :value="cryptocurrency">
                    {{ cryptocurrency.cryptocurrency_name }}
                  </option>
<!--                  <option value="vnd">VND</option>-->
                </select>
              </div>
              <div class="col-sm-12">
                <label class="form-label">Số lượng</label>
                <div class="input-group">
                  <input type="number" step="0.00000001" v-model="amount"  :max="maxSell" class="form-control">
                  <button class="btn btn-outline-secondary" type="button" @click="setMaxAmount">Tối đa</button>
                </div>
                <div class="text-change mt-3" v-if="exchange_rate && exchange_rate !== 0">Giá chuyển đổi: <code>1 {{this.selectedCryptocurrencyFrom.cryptocurrency_name}} ≈ {{exchange_rate}} {{ selectedCryptocurrencyTo.cryptocurrency_name }}</code> </div>
                <div class="text-change" v-if="minSell">Chuyển đổi tối thiểu:  <code>{{minSell?.toLocaleString('en-US', {maximumFractionDigits: 8})}} {{ selectedCryptocurrencyFrom.cryptocurrency_name }}</code> </div>
                <div class="text-change" v-if="maxSell && maxSell < availableToSell">Chuyển đổi tối đa:  <code>{{maxSell?.toLocaleString('en-US', {maximumFractionDigits: 8})}} {{ selectedCryptocurrencyFrom.cryptocurrency_name }}</code> </div>
                <div class="text-change">Số dư khả dụng:  <code>{{availableToSell > 0 ? availableToSell?.toLocaleString('en-US', {maximumFractionDigits: 8}): 0}} {{ selectedCryptocurrencyFrom.cryptocurrency_name }}</code>. </div>
              </div>

              <div class="col-mb-12">
                <button type="submit" class="btn flex-fill btn-light-warning py-2 fs-5 text-uppercase px-5" :disabled="isSelling">
                  <span v-if="isSelling" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  {{ isSelling ? 'Đang chuyển đổi...' : 'Chuyển đổi' }}
                </button>
              </div>
            </div>
          </form>
          <div class="table-responsive mt-1">
            <table class="table border">
              <tbody>
              <tr>
                <td>Tổng chuyển đổi</td>
                <td>{{ amount.toLocaleString('en-US', {maximumFractionDigits: 8}) }} {{ selectedCryptocurrencyFrom.cryptocurrency_name }}</td>
              </tr>
              <tr>
                <td>Tổng nhận</td>
                <td>≈ {{ totalReceived.toLocaleString('en-US', {maximumFractionDigits: 8}) }} {{selectedCryptocurrencyTo.cryptocurrency_name}}</td>
              </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>

</template>

<script>
import axios from 'axios';
import Api from "../../common/js/Api";
import Notify from "../../common/js/Notify";

export default {
  props: {
    cryptoIdSelected: {
      type: String,
      default: null
    }
  },

  data() {
    return {
      selectedCryptocurrencyFrom: {},
      selectedCryptocurrencyTo: {},
      selectedWallet: null,
      amount: 0,
      totalAmount: 0,
      transactionFee: 0,
      transactionFeePercentage: 0,
      isSelling: false,
      wallets: [],
      cryptocurrencies: [],
    };
  },
  computed: {
    totalReceived() {
      if (this.selectedCryptocurrencyTo === 'vnd') {
        return this.amount * (this.selectedCryptocurrencyFrom.vnd_exchange_rate || 0);
      } else if(this.selectedCryptocurrencyTo._id) {
        return this.amount * (this.selectedCryptocurrencyFrom.exchange_rate || 0);
      }
      return 0
    },
    exchange_rate() {
      if (this.selectedCryptocurrencyTo === 'vnd') {
        return this.selectedCryptocurrencyFrom.vnd_exchange_rate ? this.selectedCryptocurrencyFrom.vnd_exchange_rate.toLocaleString('en-US', { maximumFractionDigits: 8 }) : 0;
      } else if(this.selectedCryptocurrencyTo._id) {
        return this.selectedCryptocurrencyFrom.exchange_rate ? this.selectedCryptocurrencyFrom.exchange_rate.toLocaleString('en-US', { maximumFractionDigits: 8 }) : 0;
      }
      return 0
    },
    minSell() {
      const wallet = this.wallets.find(wallet => {
        return wallet.cryptocurrency._id === this.selectedCryptocurrencyFrom._id
      })

      if(wallet){
        return wallet.exchange_min_amount || null
      }
    },
    maxSell() {
      const wallet = this.wallets.find(wallet => {
        return wallet.cryptocurrency._id === this.selectedCryptocurrencyFrom._id
      })

      if(wallet){
        if(wallet.exchange_max_amount){
          return wallet.exchange_max_amount > wallet.balance_amount ? wallet.balance_amount : wallet.exchange_max_amount
        }
        return wallet.balance_amount || null
      }
    },
    availableToSell() {
      const wallet = this.wallets.find(wallet => {
        return wallet.cryptocurrency._id === this.selectedCryptocurrencyFrom._id
      })

      if(wallet){
        return wallet.balance_amount || null
      }
    },
    cryptocurrenciesFilter(){
      return this.cryptocurrencies.filter(cryptocurrency => {
        const wallet = this.wallets.find(wallet => wallet.cryptocurrency._id === cryptocurrency._id)
        return wallet?.cryptocurrency.default_exchange_enabled
      })
    },
    cryptocurrenciesFilterTo(){
      return this.cryptocurrencies.filter(cryptocurrency => {
        const wallet = this.wallets.find(wallet => wallet.cryptocurrency._id === cryptocurrency._id)
        return wallet?.cryptocurrency.default_withdraw_enabled
      })

    }
  },
  watch: {
    selectedCryptocurrencyTo(newCryptocurrencyTo) {

      if (newCryptocurrencyTo === 'vnd') {
        this.fetchExchangeRateVND(this.selectedCryptocurrencyFrom._id);
        this.startExchangeRateVNDInterval(this.selectedCryptocurrencyFrom._id);
      } else if(newCryptocurrencyTo._id) {
        this.fetchExchangeRateCryptocurrency(this.selectedCryptocurrencyFrom._id, newCryptocurrencyTo._id);
        this.startExchangeRateCryptocurrencyInterval(this.selectedCryptocurrencyFrom._id, newCryptocurrencyTo._id);
      }else{
        clearInterval(this.exchangeRateInterval)
      }

    },
    selectedCryptocurrencyFrom(newCryptocurrencyFrom) {

      if (newCryptocurrencyFrom) {
        this.selectedCryptocurrencyTo = {}
      }
    },
    cryptoIdSelected: {
      handler(newVal) {
        if(newVal){
          this.selectedCryptocurrencyFrom = this.cryptocurrencies.find(item => {
            return item._id === newVal
          })
        }
      },
      immediate: true
    },
    cryptocurrencies: {
      handler(newVal) {
        if(newVal && newVal.length > 0 && !this.selectedCryptocurrencyFrom._id){
          this.selectedCryptocurrencyFrom = newVal[0]
        }
      },
      deep: true,
      immediate: true
    },
  },
  mounted() {
    this.fetchWallets()
    this.fetchCryptocurrencies()

  },
  methods: {
    async fetchWallets() {
      try {
        const response = await Api.get('/api/wallets');
        this.wallets = response.data.wallets;
        this.vnd_wallet = response.data.vnd_wallet;
        this.selectedWallet = this.wallets.find(wallet => wallet.cryptocurrency_id === this.selectedCryptocurrencyFrom.id);
      } catch (error) {
        console.error('Failed to fetch wallets:', error);
      }
    },
    async fetchCryptocurrencies() {
      try {
        const response = await Api.get('/api/cryptocurrencies');
        this.cryptocurrencies = response.data;
        this.selectedCryptocurrencyFrom = this.cryptocurrencies[0];
      } catch (error) {
        console.error('Failed to fetch cryptocurrencies:', error);
      }
    },
    async fetchExchangeRateVND(cryptocurrencyId) {
      try {
        if (cryptocurrencyId) {
          const response = await Api.get(`/api/cryptocurrencies/rate-vnd/${cryptocurrencyId}`);
          this.selectedCryptocurrencyFrom.vnd_exchange_rate = response.data.vnd_exchange_rate;
        }
      } catch (error) {
        if (error.response && error.response.data && error.response.data.error) {
          Notify.error(null, error.response.data.error);
        } else {
          Notify.error();
        }
      }
    },
    startExchangeRateVNDInterval(cryptocurrencyId) {
      clearInterval(this.exchangeRateInterval);
      this.exchangeRateInterval = setInterval(() => {
        this.fetchExchangeRateVND(cryptocurrencyId);
      }, 5000);
    },
    async fetchExchangeRateCryptocurrency(cryptocurrencyIdFrom, cryptocurrencyIdTo) {
      try {
        if (cryptocurrencyIdFrom && cryptocurrencyIdTo) {
          const response = await Api.get(`/api/cryptocurrencies/rate-cryptocurrency/${cryptocurrencyIdFrom}/${cryptocurrencyIdTo}`);
          this.selectedCryptocurrencyFrom.exchange_rate = response.data.exchange_rate;
        }
      } catch (error) {
        if (error.response && error.response.data && error.response.data.error) {
          Notify.error(null, error.response.data.error);
        } else {
          Notify.error();
        }
      }
    },
    startExchangeRateCryptocurrencyInterval(cryptocurrencyIdFrom, cryptocurrencyIdTo) {
      clearInterval(this.exchangeRateInterval);
      this.exchangeRateInterval = setInterval(() => {
        this.fetchExchangeRateCryptocurrency(cryptocurrencyIdFrom, cryptocurrencyIdTo);
      }, 5000);
    },
    setMaxAmount() {
      const wallet = this.wallets.find(wallet => {
        return wallet.cryptocurrency._id === this.selectedCryptocurrencyFrom._id
      })

      if(wallet){
        this.amount = this.maxSell > wallet.balance_amount ? parseFloat(wallet.balance_amount.toFixed(2)) : parseFloat(this.maxSell.toFixed(2))
      }
    },
    async convertTo() {
      try {
        this.isSelling = true;
        let response;

        if (this.selectedCryptocurrencyTo === 'vnd') {
          response = await axios.post('/api/transactions/sell-vnd', {
            cryptocurrencyId: this.selectedCryptocurrencyFrom._id,
            amount: this.amount,
          });
          Notify.success(null, `Bạn đã chuyển đổi thành công ${this.amount.toLocaleString('en-US', {maximumFractionDigits: 8})} ${this.selectedCryptocurrencyFrom.cryptocurrency_name} và nhận được ${response.data.totalReceived} VND`);
        } else {
          response = await axios.post('/api/transactions/convert-cryptocurrency', {
            fromCryptocurrencyId: this.selectedCryptocurrencyFrom._id,
            toCryptocurrencyId: this.selectedCryptocurrencyTo._id,
            amount: this.amount,
          });
          Notify.success(null, `Bạn đã chuyển đổi thành công ${response.data.fromAmount} ${this.selectedCryptocurrencyFrom.cryptocurrency_name} thành ${response.data.toAmount} ${this.selectedCryptocurrencyTo.cryptocurrency_name}`);
        }

        this.wallets = this.wallets.map(wallet => {
          if (wallet.cryptocurrency._id === this.selectedCryptocurrencyFrom._id) {
            wallet.balance_amount -= this.amount;
          }
          if (wallet.cryptocurrency._id === this.selectedCryptocurrencyTo._id) {
            wallet.balance_amount += response.data.totalReceived;
          }
          return wallet;
        });

        this.amount = 0;
        this.$emit('done-convert', {
          fromCryptocurrencyId: this.selectedCryptocurrencyFrom._id,
          toCryptocurrencyId: this.selectedCryptocurrencyTo._id,
          amount: this.amount,
        });
      } catch (error) {
        console.log(error);
        console.error('Failed to convert cryptocurrency:', error);
        if (error.response && error.response.data && error.response.data.error) {
          Notify.error(null, error.response.data.error);
        } else {
          Notify.error();
        }
      } finally {
        this.isSelling = false;
      }
    },
  },
};
</script>