<template>
  <form @submit.prevent="confirmWithdraw">
    <div class="mb-3">
      <label class="form-label">Số tiền cần rút</label>
      <div class="input-group">
        <input type="number" step="0.01" v-model="withdrawAmount" :max="vnd_wallet" class="form-control">
        <button class="btn btn-outline-secondary" type="button" @click="setMaxAmount">Tối đa</button>
      </div>
      <div class="text-change mt-3">Số tiền bạn sẽ nhận: <code>{{withdrawAmount.toLocaleString('en-US', {maximumFractionDigits: 8})}} vnđ</code>. </div>
      <div class="text-change mt-3">Tối đa: <code>{{vnd_wallet.toLocaleString('en-US', {maximumFractionDigits: 8})}} vnđ</code>. </div>
      <div class="text-change">
        <h5>Lưu ý: <code>Quý khách cần sử dụng thông tin tài khoản chính chủ trùng với tên đã đăng ký trong quá trình giao dịch</code>. </h5>
      </div>
    </div>
    <div class="mb-3" v-if="localBankAccounts.length > 0">
      <label class="form-label">Chọn tài khoản</label>

      <select class="form-select" v-model="selectedAccount" @change="selectAccount">
        <option value="0">Chọn tài khoản ngân hàng</option>
        <option v-for="account in localBankAccounts" :value="account" :key="account.id">{{ account.name }}</option>
        <option value="-1">Thêm một tài khoản mới</option>
      </select>
      <div class="form-text">
        <a href="/local-bank-accounts" class="text-primary text-decoration-underline">Quản lý các tài khoản đã lưu của bạn</a>
      </div>
    </div>
    <div class="mb-3" v-if="(selectedAccount && selectedAccount !=='0') || localBankAccounts.length === 0">
      <label class="form-label">Thông tin tài khoản ngân hàng</label>
      <div>
        <div class="mb-3">
          <label class="form-label">Tên người hưởng thụ</label>
          <input type="text" :disabled="selectedAccount !== '-1' && localBankAccounts.length > 0" class="form-control" v-model="accountName" required>
        </div>
        <div class="mb-3">
          <label for="bank_name" class="form-label">Tên ngân hàng</label>
          <select class="form-select" :disabled="selectedAccount !== '-1' && localBankAccounts.length > 0"  id="bank_name" v-model="bankName">
            <option value="">Chọn ngân hàng</option>

            <option v-for="bank in banks" :value="bank.shortName" :key="bank.id">{{ bank.shortName }}</option>
          </select>
        </div>
        <div class="mb-3">
          <label class="form-label">Số tài khoản</label>
          <input type="text" :disabled="selectedAccount !== '-1' && localBankAccounts.length > 0"  class="form-control" v-model="accountNumber" required>
        </div>
        <div class="mb-3">
          <label class="form-label">Tên chi nhánh</label>
          <input type="text" :disabled="selectedAccount !== '-1' && localBankAccounts.length > 0"  class="form-control" v-model="branchName">
        </div>
        <div class="mb-3" v-if="(saveBank && selectedAccount !== '-1' && localBankAccounts.length === 0) || (saveBank && selectedAccount === '-1' && localBankAccounts.length > 0)">
          <label class="form-label">Đặt tên cho tài khoản này</label>
          <input type="text" :disabled="selectedAccount !== '-1' && localBankAccounts.length > 0"  class="form-control" v-model="name">
        </div>
        <div class="mb-3" v-if="selectedAccount === '-1' || localBankAccounts.length === 0">
          <label class="fancy-checkbox">
            <input type="checkbox" v-model="saveBank" name="checkbox">
            <span> Lưu lại tài khoản này</span>
          </label>
        </div>
      </div>
    </div>
    <div class="mb-3">
      <button type="submit" class="btn flex-fill btn-light-warning py-2 fs-5 text-uppercase px-5" :disabled="isProcessing">
        <span v-if="isProcessing" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
        {{ isProcessing ? 'Đang xử lý...' : 'Rút tiền' }}
      </button>
    </div>
  </form>
</template>
<script>
import Api from "../../common/js/Api";
import Notify from "../../common/js/Notify";
import axios from "axios";
export default {
  props: {
    vnd_wallet_init: {
      type: Number,
      default: 0,
    },
    total_withdraw_vnd: {
      type: Number,
      default: 0,
    },
    total_await_disbursement_vnd: {
      type: Number,
      default: 0,
    },
  },
  data() {
    return {
      withdrawAmount: 0,
      accountNumber: null,
      accountName: '',
      bankName: '',
      branchName: '',
      name: null,
      isProcessing: false,
      vnd_wallet: 0,
      banks: [],
      saveBank: false,
      localBankAccounts: [],
      selectedAccount: '',
      transactionHistories: []
    };
  },
  watch: {
    vnd_wallet_init(value) {
      if(value !== undefined){
       this.vnd_wallet = value
      }
    },
    bankName(value){
      if(value && value !== '' && (!this.accountNumber || !this.name)){
        this.name = `Tài khoản ${value}`
      }
    },
    selectedAccount(value){
      if(value === '-1'){
        this.accountNumber = null
        this.accountName = null
        this.accountName = null
        this.bankName = null
        this.branchName = null
        this.name = null
        this.saveBank = true
      }
    },
    localBankAccounts(banks){

      if(banks.length > 0){
        this.selectedAccount = banks[0]
        this.accountNumber = this.selectedAccount.account_number;
        this.accountName = this.selectedAccount.account_name;
        this.bankName = this.selectedAccount.bank_name;
        this.branchName = this.selectedAccount.branch_name;
      }
    }
  },
  methods: {

    setMaxAmount() {
      this.withdrawAmount = parseFloat(this.vnd_wallet.toFixed(2)) || 0;
    },
    async fetchBanks() {
      try {
        const response = await axios.get('https://api.vietqr.io/v2/banks');
        this.banks = response.data.data;
      } catch (error) {
        if(error.response && error.response.data) {
          Notify.error(null,error.response.data.error);
        }else{
          Notify.error()
        }
      }
    },
    async fetchLocalBankAccounts() {
      try {
        const response = await Api.get('/api/local-bank-accounts');
        this.localBankAccounts = response.data;
      } catch (error) {
        console.error('Failed to fetch local bank accounts:', error);
        if(error.response && error.response.data) {
          Notify.error(null,error.response.data.error);
        }else{
          Notify.error()
        }
      }
    },
    selectAccount() {
      if (this.selectedAccount) {
        this.accountNumber = this.selectedAccount.account_number;
        this.accountName = this.selectedAccount.account_name;
        this.bankName = this.selectedAccount.bank_name;
        this.branchName = this.selectedAccount.branch_name;
      } else {
        this.accountNumber = '';
        this.accountName = '';
        this.bankName = '';
        this.branchName = '';
      }
    },
    async confirmWithdraw() {
      try {
        this.isProcessing = true;
        const data = {
          transaction_amount: this.withdrawAmount,
          local_bank_info: {
            account_number: this.accountNumber,
            account_name: this.accountName,
            bank_name: this.bankName,
            branch_name: this.branchName
          }
        };
        if(this.saveBank){
          data.saveBank = this.saveBank;
          data.local_bank_info.name = this.name
        }
        const response = await Api.post('/api/transactions/withdraw-vnd', data);
        Notify.success(null,response.data.message)
        this.withdrawAmount = 0;
        this.accountNumber = '';
        this.accountName = '';
        this.bankName = '';
        this.branchName = '';
        this.selectedAccount = '';
        this.fetchLocalBankAccounts()
        this.$emit('done-withdraw')
      } catch (error) {
        console.error('Error confirming withdraw:', error);
        if(error.response && error.response.data) {
          let show_limit_time = error.response.data.error_limit_time ?? 5
          Notify.error(null,error.response.data.error,show_limit_time * 1000);
        }else{
          Notify.error()
        }
      } finally {
        this.isProcessing = false;
      }
    }
  },
  mounted() {

    this.fetchLocalBankAccounts();
    this.fetchBanks()
  }
};
</script>