<template>
  <div class="tab-content">
    <div class="table-responsive">
      <table class="myProjectTable table table-hover custom-table align-middle mb-0" style="width:100%">
        <thead>
        <tr>
          <th>Tên</th>
          <th>Giá / USDT</th>
          <th>Thay đổi trong 24h</th>
          <th>Khối lượng giao dịch trong 24h</th>
          <th>Thao tác</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="currency in cryptocurrencies" :key="currency._id">
          <td>
            <img :src="currency.img_url" alt="" class="img-fluid avatar mx-1">
            <span class="text-uppercase fw-bold">{{ currency.name.toUpperCase() }}</span>
          </td>
          <td>
            <span :class="{ 'color-price-down': currency.currentPrice < 0 }">{{ parseFloat(currency.currentPrice).toLocaleString('en-US', {maximumFractionDigits: 8}) }}</span>
          </td>
          <td>
            <span :class="{ 'color-price-up': currency.priceChangePercent > 0, 'color-price-down': currency.priceChangePercent < 0 }">{{ parseFloat(currency.priceChangePercent).toLocaleString('en-US', {maximumFractionDigits: 8}) }}%</span>
          </td>
          <td>{{ parseFloat(currency.volume).toLocaleString('en-US', {maximumFractionDigits: 8}) }}</td>
          <td>
            <a href="#" @click="buyCrypto" title="" class="text-info px-3">Mua {{ currency.name.toUpperCase() }}</a>
          </td>
        </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-3 d-flex justify-content-end">
      <nav>
        <ul class="pagination">
          <li class="page-item" :class="{ disabled: currentPage === 1 }">
            <a class="page-link" href="#" @click.prevent="changePage(currentPage - 1)">Previous</a>
          </li>
          <li class="page-item" v-for="page in visiblePages" :key="page" :class="{ active: currentPage === page }">
            <a class="page-link" :class="currentPage === page? 'text-white':''" href="#" @click.prevent="changePage(page)">{{ page }}</a>
          </li>
          <li class="page-item" :class="{ disabled: currentPage === totalPages }">
            <a class="page-link" href="#" @click.prevent="changePage(currentPage + 1)">Next</a>
          </li>
        </ul>
      </nav>
    </div>
  </div>
</template>
<script>
import Api from "../../common/js/Api";
import Notify from "../../common/js/Notify";
export default {
  data() {
    return {
      cryptocurrencies: [],

      currentPage: 1,
      totalPages: 1,
      itemsPerPage: 10,
      visiblePages: [],
      intervalId: null,
    };
  },
  computed: {

  },
  mounted() {
    this.fetchData();
    this.intervalId = setInterval(this.fetchData, 5000);
  },
  beforeUnmount() {
    clearInterval(this.intervalId);
  },
  methods: {
    async fetchData() {
      try {
        const response = await Api.get(`/api/cryptocurrencies/data?page=${this.currentPage}&limit=${this.itemsPerPage}`);

        this.cryptocurrencies = response.data.data;
        this.totalPages = response.data.totalPages;
        this.updateVisiblePages();

      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    },
    async buyCrypto(){
      try{
        const response = await Api.post('/api/transactions/buy-cryptocurrency', {})
      }catch(error){
        console.log(error)
        if(error.response && error.response.data) {
          Notify.error(null,error.response.data.error);
        }else{
          Notify.error()
        }
      }
    },
    updateVisiblePages() {
      const maxVisiblePages = 5;
      let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
      let endPage = startPage + maxVisiblePages - 1;
      if (endPage > this.totalPages) {
        endPage = this.totalPages;
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
      this.visiblePages = Array(endPage - startPage + 1)
          .fill()
          .map((_, index) => startPage + index);
    },
    changePage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page;
        this.fetchData();
      }
    },
  },
};
</script>