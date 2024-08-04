<template>
  <div>


    <div class="body d-flex py-3">
      <div class="container-xxl">

        <div class="row g-3 border-bottom pb-4">
          <h3 class="h4 mt-1">Giao dịch</h3>
          <div class="col-12 col-md-auto text-end">
            <ul class="nav nav-pills rounded d-inline-flex" role="tablist">
              <li class="nav-item"><a class="nav-link active" data-bs-toggle="tab" href="#sell-market" role="tab">Chuyển đổi</a></li>
              <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#buy-market" role="tab">Mua</a></li>
              <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#p2p" role="tab">P2P</a></li>
            </ul>
          </div>
        </div>
<!--        <div class="row g-3 row-cols-1 row-cols-sm-2 row-cols-md-2 row-cols-lg-2 row-cols-xl-4 mb-3">-->
<!--          <div class="col">-->
<!--            <div class="card">-->
<!--              <div class="card-body d-flex align-items-center">-->
<!--                <div class="flex-fill text-truncate">-->
<!--                  <span class="h6 mt-3 mb-1 fw-bold small text-uppercase">Tăng giá nhiều nhất (24h)</span>-->
<!--                  <span class="h6 mt-3 mb-1 fw-bold d-block">{{ extremes.maxPriceChange.name }}</span>-->
<!--                  <div class="d-flex justify-content-between">-->
<!--                    <div class="price-block">-->
<!--                      <span class="fs-6 fw-bold" :class="extremes.maxPriceChange.priceChangePercent > 0 ? 'color-price-up': 'color-price-down'">{{ parseFloat(extremes.maxPriceChange.currentPrice).toLocaleString('en-US', {maximumFractionDigits: 8}) }}</span>-->
<!--                      <span class="small text-muted px-2">${{ parseFloat(extremes.maxPriceChange.priceChange).toLocaleString('en-US', {maximumFractionDigits: 8}) }}</span>-->
<!--                    </div>-->
<!--                    <div class="price-report">-->
<!--                      <span v-if="extremes.maxPriceChange.priceChangePercent > 0" class="small color-price-up">+{{ extremes.maxPriceChange.priceChangePercent }}% <i class="fa fa-level-up"></i></span>-->
<!--                      <span v-else class="small color-price-down">{{ extremes.maxPriceChange.priceChangePercent }}% <i class="fa fa-level-down"></i></span>-->
<!--                    </div>-->
<!--                  </div>-->
<!--                </div>-->
<!--              </div>-->
<!--            </div>-->
<!--          </div>-->
<!--          <div class="col">-->
<!--            <div class="card">-->
<!--              <div class="card-body d-flex align-items-center">-->
<!--                <div class="flex-fill text-truncate">-->
<!--                  <span class="h6 mt-3 mb-1 fw-bold small text-uppercase">Giảm giá nhiều nhất (24h)</span>-->
<!--                  <span class="h6 mt-3 mb-1 fw-bold d-block">{{ extremes.minPriceChange.name }}</span>-->
<!--                  <div class="d-flex justify-content-between">-->
<!--                    <div class="price-block">-->
<!--                      <span class="fs-6 fw-bold color-price-down">{{ parseFloat(extremes.minPriceChange.currentPrice).toLocaleString('en-US', {maximumFractionDigits: 8}) }}</span>-->
<!--                      <span class="small text-muted px-2">${{ parseFloat(extremes.minPriceChange.priceChange).toLocaleString('en-US', {maximumFractionDigits: 8}) }}</span>-->
<!--                    </div>-->
<!--                    <div class="price-report">-->
<!--                      <span class="small color-price-down">{{ extremes.minPriceChange.priceChangePercent }}% <i class="fa fa-level-down"></i></span>-->
<!--                    </div>-->
<!--                  </div>-->
<!--                </div>-->
<!--              </div>-->
<!--            </div>-->
<!--          </div>-->
<!--          <div class="col">-->
<!--            <div class="card">-->
<!--              <div class="card-body d-flex align-items-center">-->
<!--                <div class="flex-fill text-truncate">-->
<!--                  <span class="h6 mt-3 mb-1 fw-bold small text-uppercase">Giao dịch nhiều nhất (24h)</span>-->
<!--                  <span class="h6 mt-3 mb-1 fw-bold d-block">{{ extremes.maxVolume.name }}</span>-->
<!--                  <div class="d-flex justify-content-between">-->
<!--                    <div class="price-block">-->
<!--                      <span class="fs-6 fw-bold">{{ parseFloat(extremes.maxVolume.currentPrice).toLocaleString('en-US', {maximumFractionDigits: 8}) }}</span>-->
<!--                      <span class="small text-muted px-2">${{ parseFloat(extremes.maxVolume.volume).toLocaleString('en-US', {maximumFractionDigits: 8}) }}</span>-->
<!--                    </div>-->
<!--                    <div class="price-report">-->
<!--                      <span v-if="extremes.maxVolume.priceChangePercent > 0" class="small color-price-up">+{{ extremes.maxVolume.priceChangePercent }}% <i class="fa fa-level-up"></i></span>-->
<!--                      <span v-else class="small text-danger">{{ extremes.maxVolume.priceChangePercent }}% <i class="fa fa-level-down"></i></span>-->
<!--                    </div>-->
<!--                  </div>-->
<!--                </div>-->
<!--              </div>-->
<!--            </div>-->
<!--          </div>-->
<!--          <div class="col">-->
<!--            <div class="card">-->
<!--              <div class="card-body d-flex align-items-center">-->
<!--                <div class="flex-fill text-truncate">-->
<!--                  <span class="h6 mt-3 mb-1 fw-bold small text-uppercase">Giao dịch ít nhất (24h)</span>-->
<!--                  <span class="h6 mt-3 mb-1 fw-bold d-block">{{ extremes.minVolume.name }}</span>-->
<!--                  <div class="d-flex justify-content-between">-->
<!--                    <div class="price-block">-->
<!--                      <span class="fs-6 fw-bold">{{ parseFloat(extremes.minVolume.currentPrice).toLocaleString('en-US', {maximumFractionDigits: 8}) }}</span>-->
<!--                      <span class="small text-muted px-2">${{ parseFloat(extremes.minVolume.volume).toLocaleString('en-US', {maximumFractionDigits: 8}) }}</span>-->
<!--                    </div>-->
<!--                    <div class="price-report">-->
<!--                      <span v-if="extremes.minVolume.priceChangePercent > 0" class="small color-price-up">+{{ extremes.minVolume.priceChangePercent }}% <i class="fa fa-level-up"></i></span>-->
<!--                      <span v-else class="small text-danger">{{ extremes.minVolume.priceChangePercent }}% <i class="fa fa-level-down"></i></span>-->
<!--                    </div>-->
<!--                  </div>-->
<!--                </div>-->
<!--              </div>-->
<!--            </div>-->
<!--          </div>-->
<!--        </div>-->
        <div class="row g-3 mb-3">
          <div class="col-lg-12 col-md-12">
            <div class="tab-content mt-3">
              <div class="tab-pane fade show active" id="sell-market">
                <sell-market/>
              </div>
              <div class="tab-pane fade" id="buy-market">
                <buy-market/>
              </div>
              <div class="tab-pane fade" id="p2p">
                <p2p/>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>


<script>
import Api from "../../common/js/Api";
import Notify from "../../common/js/Notify";
import SellMarket from './sell-market.vue'
import BuyMarket from './buy-market.vue'
import P2p from './p2p.vue'
export default {
  components: {SellMarket,BuyMarket,P2p},
  data() {
    return {
      extremes: {
        maxPriceChange: {},
        minPriceChange: {},
        maxVolume: {},
        minVolume: {},
      },
    };
  },
  methods: {
    async fetchExtremes() {
      try {
        const extremesResponse = await Api.get('/api/cryptocurrencies/extremes');

        this.extremes = extremesResponse.data;
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    },
  },
  mounted() {

    this.fetchExtremes()
  },
};
</script>
