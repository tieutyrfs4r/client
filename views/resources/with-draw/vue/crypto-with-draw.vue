<template>
  <form @submit.prevent="confirmWithdraw">
    <div class="mb-3">
      <div class="mb-3">
        <label class="form-label">Chọn loại tiền điện tử</label>
        <select class="form-select" v-model="selectedCryptocurrencyWallet">
          <option value="">Chọn loại tiền điện tử</option>
          <option v-for="wallet in cryptocurrencyWalletsWithDrawDefault" :value="wallet" :key="wallet.id">{{ wallet.cryptocurrency?.cryptocurrency_name }}</option>
        </select>
      </div>
      <label class="form-label">Số tiền cần rút</label>
      <div class="input-group">
        <input type="number" step="0.01" v-model="withdrawAmount" :max="selectedCryptocurrencyWallet.balance_amount" class="form-control">
        <button class="btn btn-outline-secondary" type="button" @click="setMaxAmount">Tối đa</button>
      </div>
      <div class="text-change mt-3" v-if="withdrawAmount > 0">Số tiền bạn sẽ nhận: <code>{{withdrawAmount.toLocaleString('en-US', {maximumFractionDigits: 8})}} {{selectedCryptocurrencyWallet.cryptocurrency?.cryptocurrency_name}}</code>. </div>
      <div class="text-change mt-3" v-if="selectedCryptocurrencyWallet.withdraw_min_amount">Tối thiểu: <code>{{selectedCryptocurrencyWallet.withdraw_min_amount?.toLocaleString('en-US', {maximumFractionDigits: 8})}} {{selectedCryptocurrencyWallet.cryptocurrency?.cryptocurrency_name}}</code>. </div>
      <div class="text-change mt-3" v-if="selectedCryptocurrencyWallet.balance_amount">Số dư khả dụng: <code>{{selectedCryptocurrencyWallet.balance_amount?.toLocaleString('en-US', {maximumFractionDigits: 8})}} {{selectedCryptocurrencyWallet.cryptocurrency?.cryptocurrency_name}}</code>. </div>
    </div>

    <div class="mb-3" v-if="userWalletAddresses.length > 0">
      <label class="form-label">Chọn địa chỉ ví</label>
      <select class="form-select" v-model="selectedAddress">
        <option value="0">Chọn địa chỉ ví</option>
        <option v-for="address in userWalletAddresses" :value="address" :key="address.id">{{ address.name }}</option>
        <option value="-1">Thêm một địa chỉ ví mới</option>
      </select>
      <div class="form-text">
        <a href="/wallet-address" class="text-primary text-decoration-underline">Quản lý các địa chỉ ví đã lưu của bạn</a>
      </div>
    </div>
    <template v-if="selectedCryptocurrencyWallet">
      <div class="mb-3" v-if="(selectedAddress && selectedAddress !== '0') || userWalletAddresses.length === 0">
        <label class="form-label">Thông tin địa chỉ ví</label>
        <div>
          <div class="mb-3">
            <label class="form-label">Địa chỉ ví</label>
            <input type="text" :disabled="selectedAddress !== '-1' && userWalletAddresses.length > 0" class="form-control" v-model="address" required>
          </div>
          <div class="mb-3">
            <label class="form-label">Mạng lưới</label>
            <select class="form-select" :disabled="selectedAddress !== '-1' && userWalletAddresses.length > 0" v-model="network" required>
              <option value="">Chọn mạng lưới</option>
              <option v-for="network in networks" :value="network.id" :key="network.id">{{ network.name }}</option>
            </select>
          </div>
          <div class="mb-3" v-if="saveAddress">
            <label class="form-label">Tên địa chỉ ví</label>
            <input type="text" :disabled="selectedAddress !== '-1' && userWalletAddresses.length > 0" class="form-control" v-model="name" required>
          </div>
          <div class="mb-3" v-if="selectedAddress === '-1' || userWalletAddresses.length === 0">
            <label class="fancy-checkbox">
              <input type="checkbox" v-model="saveAddress" name="checkbox">
              <span> Lưu lại địa chỉ ví này</span>
            </label>
          </div>
        </div>
      </div>
      <div class="mb-3">
        <label class="form-label">Mã PIN rút tiền</label>
        <input type="password" class="form-control" v-model="withdrawPin" required maxlength="6" minlength="6">
        <div class="mt-2">
          <a href="/profile#with-draw-pin-setting" class="text-primary text-decoration-underline">Cài đặt mã PIN rút tiền</a>
        </div>
      </div>
    </template>

    <div class="mb-3">
      <button type="submit" class="btn flex-fill btn-light-warning py-2 fs-5 text-uppercase px-5" :disabled="isProcessing || withdrawAmount <= 0">
        <span v-if="isProcessing" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
        {{ isProcessing ? 'Đang xử lý...' : 'Rút tiền' }}
      </button>
    </div>
  </form>
</template>

<script>
import Api from "../../common/js/Api";
import Notify from "../../common/js/Notify";

export default {
  props: {
    networks: {
      type: Array,
      default: () => [],
      required: true
    },
    cryptocurrencyWallets: {
      type: Array,
      default: () => [],
      required: true
    },
  },
  computed: {
    cryptocurrencyWalletsWithDrawDefault() {
      return this.cryptocurrencyWallets.filter(wallet => wallet.cryptocurrency.default_withdraw_enabled);
    }
  },
  data() {
    return {
      withdrawAmount: 0,
      address: '',
      name: '',
      isProcessing: false,
      saveAddress: false,
      userWalletAddresses: [],
      selectedAddress: '',
      selectedCryptocurrencyWallet: '',
      network: '',
      withdrawPin: '',
    };
  },
  watch: {
    cryptocurrencyWalletsWithDrawDefault(value) {
      if (value && value.length > 0 && !this.selectedCryptocurrencyWallet) {
        this.selectedCryptocurrencyWallet = value[0];
      }
    },
    selectedAddress(value) {
      if (value === '-1') {
        this.address = '';
        this.name = '';
        this.network = '';
        this.saveAddress = true;
      } else if (value !== '0') {
        this.address = value.address;
        this.name = value.name;
        this.network = value.network;
      }
    },
    userWalletAddresses(addresses) {
      if (addresses.length > 0) {
        this.selectedAddress = addresses[0];
        this.address = this.selectedAddress.address;
        this.name = this.selectedAddress.name;
        this.network = this.selectedAddress.network._id;
      }
    },
    selectedCryptocurrencyWallet(value) {
      if (value && value._id) {
        this.userWalletAddresses = [];
        this.selectedAddress = '';
        this.fetchUserWalletAddresses();
      }
    }
  },
  methods: {
    setMaxAmount() {
      this.withdrawAmount = parseFloat(this.selectedCryptocurrencyWallet.balance_amount.toFixed(2)) || 0;
    },
    async fetchUserWalletAddresses() {
      try {
        const response = await Api.get('/api/wallet-addresses', {
          params: {
            cryptocurrency: this.selectedCryptocurrencyWallet.cryptocurrency._id
          }
        });
        this.userWalletAddresses = response.data;
      } catch (error) {
        console.error('Failed to fetch user wallet addresses:', error);
        if (error.response && error.response.data) {
          Notify.error(null, error.response.data.error);
        } else {
          Notify.error();
        }
      }
    },
    async confirmWithdraw() {
      if (this.withdrawAmount <= 0) {
        Notify.error(null, "Số tiền rút phải lớn hơn 0");
        return;
      }

      if (!this.withdrawPin) {
        Notify.error(null, "Vui lòng nhập mã PIN rút tiền");
        return;
      }

      try {
        this.isProcessing = true;
        const data = {
          transaction_amount: this.withdrawAmount,
          user_wallet_address: {
            address: this.address,
            name: this.name,
            network: this.network
          },
          withdraw_pin: this.withdrawPin
        };
        if (this.saveAddress) {
          data.saveAddress = this.saveAddress;
        }
        const response = await Api.post(`/api/transactions/withdraw-crypto/${this.selectedCryptocurrencyWallet._id}`, data);
        Notify.success(null, response.data.message);
        this.withdrawAmount = 0;
        this.address = '';
        this.name = '';
        this.network = '';
        this.selectedAddress = '';
        this.selectedCryptocurrencyWallet = '';
        this.withdrawPin = '';
        this.$emit('done-withdraw');
      } catch (error) {
        console.error('Error confirming withdraw:', error);
        if (error.response && error.response.data) {
          let show_limit_time = error.response.data.error_limit_time ?? 5;
          Notify.error(null, error.response.data.error, show_limit_time * 1000);
        } else {
          Notify.error();
        }
      } finally {
        this.isProcessing = false;
      }
    },
  },
};
</script>