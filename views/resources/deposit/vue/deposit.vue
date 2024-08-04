<template>
  <div class="container-xxl">
    <deposit-crypto @done-deposit="fetchTransactionHistories" :networks="networks" :wallets="wallets" />
    <transaction-histories :transaction-histories="transactionHistories" />
  </div>
</template>
<script>
import Api from "../../common/js/Api";
import Notify from "../../common/js/Notify";
import TransactionHistories from "../../wallet/vue/transaction-histories.vue";
import DepositCrypto from "./deposit-crypto.vue";
export default {
  components: {DepositCrypto, TransactionHistories},
  data() {
    return {
      wallets: [],
      transactionHistories: [],
      networks: [],
    };
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
    async fetchTransactionHistories() {
      try {
        const response = await Api.get('/api/transactions/get', {
          params: {
            transaction_type: 'deposit',
          }
        });
        this.transactionHistories = response.data.docs;
      } catch (error) {
        console.error('Failed to fetch cryptocurrencies:', error);
      }
    },
  },
  mounted() {
    this.fetchTransactionHistories();
    this.fetchNetworks();
  },
  watch: {
    selectedWalletId(newValue) {
      if (newValue) {
        this.selectedNetwork = '';
        this.selectedWalletAddress = null;
      }
    },
    selectedNetwork(newValue) {
      if (newValue) {
        this.fetchWalletAddress();
      } else {
        this.selectedWalletAddress = null;
      }
    },
    wallets(newValue) {
      if (newValue.length > 0) {
        this.setDefaultWallet();
      }
    },
  }
};
</script>