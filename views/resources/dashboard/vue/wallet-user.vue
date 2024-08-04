<template>
  <div class="row g-3 mb-3 row-deck">
    <div class="col-xl-12">
      <div class="card">
        <div class="card-body">
          <div class="row g-3">
            <div class="col-7">
              <div class="row g-3 align-items-center text-center">
                <div class="col-md-4 col-lg-4 col-xl-4">
                  <div class="d-flex flex-column align-items-center flex-fill text-truncate">
                    <img class="avatar rounded-circle" :src="user.avatar" alt="profile">
                    <div class="mt-3">
                      <p class="mb-0"><span class="h6 mt-3 mb-1 fw-bold font-weight-bold">{{ user.full_name }}</span></p>
                    </div>
                  </div>
                </div>

                <div class="col-md-4 col-lg-4 col-xl-4" v-if="user.level">
                  <div class="d-flex flex-column align-items-center">
                    <span class="badge bg-careys-pink mb-1">{{ user.level?.level_name }}</span>
                    <span class="small text-muted d-flex align-items-center justify-content-center">
                  <i class="icofont-diamond px-1 fs-5 color-lightyellow" v-for="star in user.level?.stars" :key="star"></i>
                </span>
                  </div>
                </div>
                <div class="col-md-4 col-lg-4 col-xl-4" v-else>
                  <div class="d-flex flex-column align-items-center">
                    <span class="badge bg-careys-pink mb-1">Người dùng</span>
                    <span class="small text-muted d-flex align-items-center justify-content-center">
                  <i class="icofont-diamond px-1 fs-5 color-lightyellow" v-for="star in 1" :key="star"></i>
                </span>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-5">
              <div>
                <div>Số dư USDT:</div>
                <h6>{{ totalUsdtAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }} USDT</h6>
                <div>Số dư USDC:</div>
                <h6>{{ totalUsdcAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}} USDC</h6>
                <div class="mt-3">
                  <a class="btn btn-primary me-2" href="/deposit">Nạp</a>
                  <a class="btn btn-success" href="/with-draw">Rút</a>
                </div>
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

export default {
  data() {
    return {
      totalUsdtAmount: 0,
      totalVndAmount: 0,
      totalUsdcAmount: 0,
      user: {},
    };
  },
  mounted() {
    this.fetchUserProfile()
    this.fetchOverviewData();
  },
  methods: {
    async fetchOverviewData() {
      try {
        const response = await Api.get('/api/wallets/overview-usdt');
        this.totalUsdtAmount = response.data.total_usdt_amount;
        this.totalVndAmount = response.data.total_vnd_amount;
        this.totalUsdcAmount = response.data.total_usdc_amount;
      } catch (error) {
        console.error('Failed to fetch overview data:', error);
      }
    },
    async fetchUserProfile() {
      try {
        const response = await Api.get('/api/profile');
        this.user = response.data;
      } catch (error) {
        console.error('Lỗi khi lấy thông tin người dùng:', error);
      }
    },
  },
};
</script>

<style scoped>
@media (max-width: 767px) {
  .col-md-7 {
    text-align: center;
  }

  .d-md-flex {
    flex-direction: column;
    align-items: center;
  }

  .me-md-3 {
    margin-right: 0 !important;
    margin-bottom: 1rem;
  }
}
</style>