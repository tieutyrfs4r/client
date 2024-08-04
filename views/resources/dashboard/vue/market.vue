<template>
  <div>
    <div class="row g-3 mb-3">
      <div class="col-xl-6">
        <div class="card">
          <div class="card-header py-3 d-flex justify-content-between align-items-center bg-transparent border-bottom-0">
            <h6 class="mb-0 fw-bold">Các đồng coin tăng giá nhiều nhất trong 24h</h6>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-hover align-middle mb-0">
                <thead>
                <tr>
                  <th>Tên</th>
                  <th>Giá</th>
                  <th>24h Thay đổi</th>
                </tr>
                </thead>
                <tbody>
                <tr v-for="(crypto, index) in topGainers" :key="index">
                  <td>
                    <div class="d-flex align-items-center">
                      <img :src="crypto.img_url" alt="" class="avatar avatar-xs me-2">
                      <span>{{ crypto.name }}/USDT</span>
                    </div>
                  </td>
                  <td>{{ crypto.lastPrice.toLocaleString('en-US', {maximumFractionDigits: 8}) }}</td>
                  <td>
                    <span :class="crypto.priceChangePercent > 0 ? 'text-success': 'text-danger'">{{`${crypto.priceChangePercent > 0? '+':''}${ crypto.priceChangePercent.toLocaleString('en-US', {maximumFractionDigits: 8})}` }}%</span>
                  </td>
                </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="card-footer text-center">
            <a href="/market" class="btn btn-primary btn-sm">Xem thêm</a>
          </div>
        </div>
      </div>
      <div class="col-xl-6">
        <div class="card">
          <div class="card-header py-3 d-flex justify-content-between align-items-center bg-transparent border-bottom-0">
            <h6 class="mb-0 fw-bold">Các đồng coin giảm giá nhiều nhất trong 24h</h6>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-hover align-middle mb-0">
                <thead>
                <tr>
                  <th>Tên</th>
                  <th>Giá</th>
                  <th>24h Thay đổi</th>
                </tr>
                </thead>
                <tbody>
                <tr v-for="(crypto, index) in topLosers" :key="index">
                  <td>
                    <div class="d-flex align-items-center">
                      <img :src="crypto.img_url" alt="" class="avatar avatar-xs me-2">
                      <span>{{ crypto.name }}/USDT</span>
                    </div>
                  </td>
                  <td>{{ crypto.lastPrice.toLocaleString('en-US', {maximumFractionDigits: 8}) }}</td>
                  <td>
                    <span :class="crypto.priceChangePercent > 0 ? 'text-success': 'text-danger'">{{`${crypto.priceChangePercent > 0? '+':''}${ crypto.priceChangePercent.toLocaleString('en-US', {maximumFractionDigits: 8})}` }}%</span>
                  </td>
                </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="card-footer text-center">
            <a href="/market" class="btn btn-primary btn-sm">Xem thêm</a>
          </div>
        </div>
      </div>
    </div>
    <div class="row g-3 mb-3 row-deck">
      <div class="col-xl-12 col-xxl-12">
        <div class="card">
          <div class="card-header py-3 d-flex flex-wrap justify-content-between align-items-center bg-transparent border-bottom-0">
            <h6 class="mb-0 fw-bold">Các đồng coin có khối lượng giao dịch lớn trong ngày</h6>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-nowrap mb-0">
                <tbody>
                <tr v-for="(coin, index) in topVolume" :key="index">
                  <td><img :src="coin.img_url" alt="" class="img-fluid avatar mx-1"> {{ coin.name }}</td>
                  <td>{{ (parseFloat(coin.lastPrice) * parseFloat(coin.volume)).toLocaleString('en-US', {maximumFractionDigits: 8}) }} USDT</td>
                  <td>
                    <span class="badge" :class="parseFloat(coin.priceChangePercent) >= 0 ? 'bg-success' : 'bg-danger'">
                      {{ coin.priceChangePercent >= 0 ? '+' : '' }}{{ parseFloat(coin.priceChangePercent).toLocaleString('en-US', {maximumFractionDigits: 8}) }}%
                    </span>
                  </td>
                </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="row g-3 mb-3 row-deck">
      <div class="col-xl-12 col-xxl-12">
        <div class="card">
          <div class="card-header py-3 d-flex flex-wrap justify-content-between align-items-center bg-transparent border-bottom-0">
            <h6 class="mb-0 fw-bold">Thông tin chi tiết</h6>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-nowrap mb-0" style="min-width: 1000px">
                <thead>
                <tr>
                  <th>Tên</th>
                  <th>Giá hiện tại</th>
                  <th>Thay đổi trong 24h (%)</th>
                  <th>Thay đổi trong 24h (USDT)</th>
                  <th>Số dư trong ví</th>
                </tr>
                </thead>
                <tbody>
                <tr v-for="(crypto, index) in cryptocurrencyData" :key="index">
                  <td><img :src="crypto.img_url" alt="" class="img-fluid avatar mx-1"> {{ crypto.name }}</td>
                  <td class="flex-fill text-truncate">
                    <div class="h6">{{ crypto.currentPrice.toLocaleString('en-US', {maximumFractionDigits: 8}) }}</div>
                    <small class="text-muted">{{ crypto.currentPriceInVND.toLocaleString('en-US', {maximumFractionDigits: 8}) }} VND</small>
                  </td>
                  <td :class="crypto.priceChangePercent > 0 ? 'text-success': 'text-danger'">{{`${crypto.priceChangePercent > 0? '+':''}${ crypto.priceChangePercent.toLocaleString('en-US', {maximumFractionDigits: 8})}` }}%</td>
                  <td :class="crypto.priceChange > 0 ? 'text-success': 'text-danger'">{{`${crypto.priceChange > 0? '+':''}${ crypto.priceChange.toLocaleString('en-US', {maximumFractionDigits: 8})}` }}</td>
                  <td>{{ crypto.walletBalance.toLocaleString('en-US', {maximumFractionDigits: 8}) }}</td>
                </tr>
                </tbody>
              </table>
            </div>
            <div class="d-flex justify-content-end mt-3">
              <nav>
                <ul class="pagination">
                  <li class="page-item" :class="{ disabled: currentPage === 1 }">
                    <a class="page-link" href="#" @click.prevent="changePage(currentPage - 1)">Trang trước</a>
                  </li>
                  <li class="page-item" v-for="page in visiblePages" :key="page" :class="{ active: currentPage === page }">
                    <a class="page-link" :class="currentPage === page ?'text-white': ''" href="#" @click.prevent="changePage(page)">{{ page }}</a>
                  </li>
                  <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                    <a class="page-link" href="#" @click.prevent="changePage(currentPage + 1)">Trang sau</a>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import Api from "../../common/js/Api";

export default {
  data() {
    return {
      topGainers: [],
      topLosers: [],
      topVolume: [],
      cryptocurrencyData: [],
      paginatedData: [],
      totalVolume: 0,
      topCoins: [],
      intervalId: null,
      currentPage: 1,
      totalPages: 1,
      itemsPerPage: 10,
      visiblePages: [],
    };
  },
  mounted() {
    this.fetchCryptocurrencyData();
    this.fetchData();
    this.intervalId = setInterval(this.fetchCryptocurrencyData, 5000);
  },
  beforeUnmount() {
    clearInterval(this.intervalId);
  },
  computed: {
    topIncreasedCoins() {
      if(this.cryptocurrencyData){

        return this.cryptocurrencyData
            .filter(crypto => crypto.name !== 'USDT')
            .sort((a, b) => b.priceChangePercent - a.priceChangePercent)
            .slice(0, 3);
      }
      return []
    },
    topDecreasedCoins() {
      if(this.cryptocurrencyData){
        return this.cryptocurrencyData
            .filter(crypto => crypto.name !== 'USDT')
            .sort((a, b) => a.priceChangePercent - b.priceChangePercent)
            .slice(0, 3);
      }
     return []
    },
  },
  methods: {
    async fetchData() {
      try {
        const [topGainersResponse, topLosersResponse, topVolumeResponse] = await Promise.all([
          Api.get('/api/cryptocurrencies/top-gainers'),
          Api.get('/api/cryptocurrencies/top-losers'),
          Api.get('/api/cryptocurrencies/top-volume'),
        ]);

        this.topGainers = topGainersResponse.data;
        this.topLosers = topLosersResponse.data;
        this.topVolume = topVolumeResponse.data;
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    },
    async fetchCryptocurrencyData() {
      try {
        const response = await Api.get(`/api/cryptocurrencies/fluctuations?page=${this.currentPage}&limit=${this.itemsPerPage}`);
        this.cryptocurrencyData = response.data.data;
        this.totalPages = response.data.totalPages;
        this.updatePaginatedData();
        this.updateVisiblePages();
        this.totalVolume = this.cryptocurrencyData.reduce((total, crypto) => total + parseFloat(crypto.volume), 0);
        this.topCoins = this.cryptocurrencyData.sort((a, b) => parseFloat(b.volume) - parseFloat(a.volume)).slice(0, 5);
      } catch (error) {
        console.error('Failed to fetch cryptocurrency data:', error);
      }
    },
    updatePaginatedData() {
      const startIndex = (this.currentPage - 1) * this.itemsPerPage;
      const endIndex = startIndex + this.itemsPerPage;
      this.paginatedData = this.cryptocurrencyData.slice(startIndex, endIndex);
    },
    updateVisiblePages() {
      const maxVisiblePages = 5;
      let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
      let endPage = startPage + maxVisiblePages - 1;
      if (endPage > this.totalPages) {
        endPage = this.totalPages;
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
      this.visiblePages = Array(endPage - startPage + 1).fill().map((_, index) => startPage + index);
    },
    changePage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page;
        this.fetchCryptocurrencyData();
      }
    },
  },
};
</script>