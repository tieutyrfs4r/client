<template>
  <div class="container-xxl">
    <div class="row g-3 row-cols-1 row-cols-sm-2 row-cols-md-2 row-cols-lg-2 row-cols-xl-4 mb-3">
      <div class="col">
        <div class="card">
          <div class="card-body d-flex align-items-center">
            <div class="flex-fill text-truncate">
              <span class="h6 mt-3 mb-1 fw-bold small text-uppercase">Tăng giá nhiều nhất (24h)</span>
              <span class="h6 mt-3 mb-1 fw-bold d-block">{{ extremes.maxPriceChange.name }}</span>
              <div class="d-flex justify-content-between">
                <div class="price-block">
                  <span class="fs-6 fw-bold" :class="extremes.maxPriceChange.priceChangePercent > 0 ? 'color-price-up': 'color-price-down'">{{ parseFloat(extremes.maxPriceChange.currentPrice).toLocaleString('en-US', {maximumFractionDigits: 8}) }}</span>
                  <span class="small px-2" :class="extremes.maxPriceChange.priceChange > 0 ? 'color-price-up': 'color-price-down'">${{ parseFloat(extremes.maxPriceChange.priceChange).toLocaleString('en-US', {maximumFractionDigits: 8}) }}</span>
                </div>
                <div class="price-report">
                  <span v-if="extremes.maxPriceChange.priceChangePercent > 0" class="small color-price-up">+{{ extremes.maxPriceChange.priceChangePercent }}% <i class="fa fa-level-up"></i></span>
                  <span v-else class="small color-price-down">{{ extremes.maxPriceChange.priceChangePercent }}% <i class="fa fa-level-down"></i></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="col">
        <div class="card">
          <div class="card-body d-flex align-items-center">
            <div class="flex-fill text-truncate">
              <span class="h6 mt-3 mb-1 fw-bold small text-uppercase">Giảm giá nhiều nhất (24h)</span>
              <span class="h6 mt-3 mb-1 fw-bold d-block">{{ extremes.minPriceChange.name }}</span>
              <div class="d-flex justify-content-between">
                <div class="price-block">
                  <span class="fs-6 fw-bold color-price-down">{{ parseFloat(extremes.minPriceChange.currentPrice).toLocaleString('en-US', {maximumFractionDigits: 8}) }}</span>
                  <span class="small px-2" :class="extremes.minPriceChange.priceChange > 0 ? 'color-price-up': 'color-price-down'">${{ parseFloat(extremes.minPriceChange.priceChange).toLocaleString('en-US', {maximumFractionDigits: 8}) }}</span>
                </div>
                <div class="price-report">
                  <span class="small color-price-down">{{ extremes.minPriceChange.priceChangePercent }}% <i class="fa fa-level-down"></i></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="col">
        <div class="card">
          <div class="card-body d-flex align-items-center">
            <div class="flex-fill text-truncate">
              <span class="h6 mt-3 mb-1 fw-bold small text-uppercase">Giao dịch nhiều nhất (24h)</span>
              <span class="h6 mt-3 mb-1 fw-bold d-block">{{ extremes.maxVolume.name }}</span>
              <div class="d-flex justify-content-between">
                <div class="price-block">
                  <span class="fs-6 fw-bold">{{ parseFloat(extremes.maxVolume.currentPrice).toLocaleString('en-US', {maximumFractionDigits: 8}) }}</span>
                  <span class="small text-muted px-2">${{ parseFloat(extremes.maxVolume.volume).toLocaleString('en-US', {maximumFractionDigits: 8}) }}</span>
                </div>
                <div class="price-report">
                  <span v-if="extremes.maxVolume.priceChangePercent > 0" class="small color-price-up">+{{ extremes.maxVolume.priceChangePercent }}% <i class="fa fa-level-up"></i></span>
                  <span v-else class="small text-danger">{{ extremes.maxVolume.priceChangePercent }}% <i class="fa fa-level-down"></i></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="col">
        <div class="card">
          <div class="card-body d-flex align-items-center">
            <div class="flex-fill text-truncate">
              <span class="h6 mt-3 mb-1 fw-bold small text-uppercase">Giao dịch ít nhất (24h)</span>
              <span class="h6 mt-3 mb-1 fw-bold d-block">{{ extremes.minVolume.name }}</span>
              <div class="d-flex justify-content-between">
                <div class="price-block">
                  <span class="fs-6 fw-bold">{{ parseFloat(extremes.minVolume.currentPrice).toLocaleString('en-US', {maximumFractionDigits: 8}) }}</span>
                  <span class="small text-muted px-2">${{ parseFloat(extremes.minVolume.volume).toLocaleString('en-US', {maximumFractionDigits: 8}) }}</span>
                </div>
                <div class="price-report">
                  <span v-if="extremes.minVolume.priceChangePercent > 0" class="small color-price-up">+{{ extremes.minVolume.priceChangePercent }}% <i class="fa fa-level-up"></i></span>
                  <span v-else class="small text-danger">{{ extremes.minVolume.priceChangePercent }}% <i class="fa fa-level-down"></i></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="row g-3 mb-3">
    <div class="col-lg-12 col-md-12">
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
                <a href="/deposit" title="" class="text-info px-3">Nạp {{ currency.name.toUpperCase() }}</a>
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
    </div>
  </div>
  </div>
</template>
<script>
import Api from "../../common/js/Api";

export default {
  data() {
    return {
      cryptocurrencies: [],
      extremes: {
        maxPriceChange: {},
        minPriceChange: {},
        maxVolume: {},
        minVolume: {},
      },
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
    this.fetchExtremes()
    this.intervalId = setInterval(this.fetchData, 5000);
  },
  beforeUnmount() {
    clearInterval(this.intervalId);
  },
  methods: {
    async fetchExtremes (){
      try {
        const extremesResponse = await Api.get('/api/cryptocurrencies/extremes');

        this.extremes = extremesResponse.data;
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    },
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