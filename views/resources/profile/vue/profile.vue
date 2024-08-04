<template>
  <div class="container-xxl">
    <div class="row g-3">
      <info :user="user" @update-avatar="updateAvatar"  />
      <settings :user="user" :provinces="provinces" />
    </div>
  </div>
</template>

<script>
import Api from "../../common/js/Api";
import Info from "./info.vue";
import Settings from "./settings.vue";
import axios from "axios";
import Notify from "../../common/js/Notify";

export default {
  components: {Settings, Info},
  data() {
    return {
      user: {},
      provinces: []
    };
  },
  async mounted() {
    await this.fetchProvinces()
    await this.fetchUserProfile();
  },
  methods: {
    async fetchUserProfile() {
      try {
        const response = await Api.get("/api/profile");
        this.user = response.data;
      } catch (error) {
        console.error("Lỗi khi lấy thông tin người dùng:", error);
      }
    },
    updateAvatar(avatar){
      this.user.avatar = avatar;
    },
    async fetchProvinces() {
      try {
        const response = await axios.get('https://raw.githubusercontent.com/kenzouno1/DiaGioiHanhChinhVN/master/data.json');
        this.provinces = response.data;
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu tỉnh:', error);
        if (error.response && error.response.data) {
          Notify.error(null, error.response.data.error);
        } else {
          Notify.error();
        }
      }
    },
  },
};
</script>