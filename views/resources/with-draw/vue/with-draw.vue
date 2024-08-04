<template>
  <div class="container-xxl" >
    <div class="row g-3 mb-3 row-deck">
      <h3 class="mb-0 fw-bold">Rút tiền về tài khoản của bạn</h3>
      <div class="col-xl-12">

        <div class="card">

          <div class="card-header py-3 d-flex justify-content-end bg-transparent border-bottom align-items-center flex-wrap">

            <ul class="nav nav-pills rounded d-inline-flex" role="tablist">
              <li class="nav-item">
                <a class="nav-link active" data-bs-toggle="tab" href="#crypto_withdraw" role="tab">
                  Tiền số
                </a>
              </li>
<!--              <li class="nav-item">-->
<!--                <a class="nav-link" data-bs-toggle="tab" href="#vnd_withdraw" role="tab">-->
<!--                  VND-->
<!--                </a>-->
<!--              </li>-->
            </ul>
          </div>
          <div class="card-body">
            <div class="tab-content">

              <div class="tab-pane fade show active" id="crypto_withdraw">
                <crypto-with-draw
                  :networks="networks"
                  :cryptocurrency-wallets="wallets"
                  @done-withdraw="doneWithdraw"
                />
              </div>

<!--              <div class="tab-pane fade show" id="vnd_withdraw">-->
<!--                <vnd-with-draw-->
<!--                :vnd_wallet_init="vnd_wallet"-->
<!--                :total_withdraw_vnd="total_withdraw_vnd"-->
<!--                :total_await_disbursement_vnd="total_await_disbursement_vnd"-->
<!--                @done-withdraw="doneWithdraw"-->
<!--                />-->
<!--              </div>-->
            </div>
          </div>
        </div>
      </div>
    </div>
    <transaction-histories
        :transactionHistories="transactionHistories"
    />

  </div>
</template>
<script>

import Api from "../../common/js/Api";
import VndWithDraw from "./vnd-with-draw.vue";
import CryptoWithDraw from "./crypto-with-draw.vue";
import TransactionHistories from "../../wallet/vue/transaction-histories.vue";
export default {

  components: {TransactionHistories, VndWithDraw,CryptoWithDraw},

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

    }
  },
  methods: {
    async fetchWallets() {
      try {
        const response = await Api.get('/api/wallets');
        this.wallets = response.data.wallets;
        this.vnd_wallet = response.data.vnd_wallet;
        this.total_withdraw_vnd = response.data.total_withdraw_vnd;
        this.total_await_disbursement_vnd = response.data.total_await_disbursement_vnd;
      } catch (error) {
        console.error('Failed to fetch wallets:', error);
      }
    },
    async fetchNetworks() {
      try {
        const response = await Api.get('/api/wallets/networks');
        this.networks = response.data;
      } catch (error) {
        console.error('Failed to fetch networks:', error);
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
    async fetchTransactionHistories() {
      try {
        const response = await Api.get('/api/transactions/get',{
          params:{
            transaction_type: 'withdraw'
          }
        });
        this.transactionHistories = response.data.docs;
      } catch (error) {
        console.error('Failed to fetch cryptocurrencies:', error);
      }
    },
    async updateSellCrypto(cryptocurrencyId) {
      this.cryptocurrencySelected = cryptocurrencyId;
    },
    doneWithdraw(){
      this.fetchTransactionHistories()
      this.fetchWallets()
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