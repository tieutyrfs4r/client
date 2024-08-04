<template>
  <div class="container-xxl" >
    <wallets-detail
        :wallets="wallets"
        :vnd_wallet="vnd_wallet"
        :cryptocurrencies="cryptocurrencies"
        :total_withdraw_vnd="total_withdraw_vnd"
        :total_await_disbursement_vnd="total_await_disbursement_vnd"
        @showSellCrypto="updateSellCrypto"
        @showDepositCrypto="updateDepositCrypto"
    ></wallets-detail>
    <sell-market v-show="showSell" @done-convert="doneCovert" :crypto-id-selected="cryptocurrencySelected" />
    <deposit-crypto v-show="showDeposit" @done-deposit="doneDeposit" :networks="networks" :wallets="wallets" :crypto-id-selected="cryptocurrencySelected" />

    <transaction-histories
        :transactionHistories="transactionHistories"
    />

  </div>
</template>
<script>
import WalletsDetail from "./wallets-detail.vue";
import TransactionHistories from "./transaction-histories.vue";
import SellMarket from "../../transaction/vue/sell-market.vue";
import Api from "../../common/js/Api";
import DepositCrypto from "../../deposit/vue/deposit-crypto.vue";
export default {

  components: {DepositCrypto, WalletsDetail, SellMarket, TransactionHistories},

  data(){
    return {
      wallets: [],
      cryptocurrencies: [],
      vnd_wallet: 0,
      total_withdraw_vnd: 0,
      total_await_disbursement_vnd: 0,
      transactionHistories: [],
      cryptocurrencySelected: null,
      networks: [],
      showDeposit: false,
      showSell: false,

    }
  },
  methods: {
    async fetchNetworks() {
      try {
        const response = await Api.get('/api/wallets/networks');
        this.networks = response.data;
      } catch (error) {
        console.error('Failed to fetch networks:', error);
      }
    },
    async fetchWallets() {
      try {
        const response = await Api.get('/api/wallets');
        this.wallets = response.data.wallets;
        this.vnd_wallet = response.data.vnd_wallet;
        this.total_withdraw_vnd = response.data.total_withdraw_vnd;
        this.total_await_disbursement_vnd = response.data.total_await_disbursement_vnd;
        this.selectedWallet = this.wallets.find(wallet => wallet.cryptocurrency_id === this.selectedCryptocurrency.id);
      } catch (error) {
        console.error('Failed to fetch wallets:', error);
      }
    },
    async fetchCryptocurrencies() {
      try {
        const response = await Api.get('/api/cryptocurrencies');
        this.cryptocurrencies = response.data;
        this.selectedCryptocurrency = this.cryptocurrencies[0];
      } catch (error) {
        console.error('Failed to fetch cryptocurrencies:', error);
      }
    },
    async fetchTransactionHistories(transaction_type) {
      try {
        let params = {}
        if(transaction_type){
          params.transaction_type = transaction_type
        }
        const response = await Api.get('/api/transactions/get',{
          params: params
        });
        this.transactionHistories = response.data.docs;
      } catch (error) {
        console.error('Failed to fetch cryptocurrencies:', error);
      }
    },
    async updateSellCrypto(cryptocurrencyId) {
      this.cryptocurrencySelected = cryptocurrencyId;
      this.showSell = true
      this.showDeposit = false
      this.fetchTransactionHistories('exchange')
    },
    async updateDepositCrypto(cryptocurrencyId) {
      this.cryptocurrencySelected = cryptocurrencyId;
      this.showSell = false
      this.showDeposit = true
      this.fetchTransactionHistories('deposit')
    },
    doneCovert(){
      this.fetchTransactionHistories('exchange')
    },
    doneDeposit(){
      this.fetchTransactionHistories('deposit')
    }
  },
  mounted() {
    this.fetchCryptocurrencies();
    this.fetchWallets();
    this.fetchTransactionHistories()
    this.fetchNetworks()
  },
}
</script>