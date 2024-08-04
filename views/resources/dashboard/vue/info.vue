<template>
  <div class="row g-3 mb-3">
    <div class="col-lg-12">
      <div class="card">
        <div class="card-body">
          <div class="row g-3 align-items-center text-center">
            <div class="col-md-4 col-lg-4 col-xl-4">
              <div class="d-flex flex-column align-items-center flex-fill text-truncate">
                <img class="avatar rounded-circle" :src="user.avatar" alt="profile">
                <div class="mt-3">
                  <p class="mb-0"><span class="h6 mt-3 mb-1 fw-bold font-weight-bold">{{ user.full_name }}</span></p>
                  <small class="h6 mt-3 mb-1 fw-bold">{{ user.email }}</small>
                </div>
              </div>
            </div>
            <div class="col-md-4 col-lg-4 col-xl-4">
              <div class="d-flex flex-column align-items-center flex-fill text-truncate">
                <span class="text-muted mb-1">User ID: {{ user._id }}</span>
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
      </div>
    </div>
  </div>
</template>

<script>
import Api from "../../common/js/Api";

export default {
  data() {
    return {
      user: {},
    };
  },
  mounted() {
    this.fetchUserProfile();
  },
  methods: {
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