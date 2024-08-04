<template>
  <div class="col-xl-8 col-lg-7 col-md-12">
    <div class="card mb-3">
      <div class="card-header py-3 d-flex justify-content-between bg-transparent border-bottom-0">
        <h6 class="mb-0 fw-bold">Hồ sơ cá nhân</h6>
      </div>
      <div class="card-body">
        <form class="row g-4" @submit.prevent="updateUserInfo">
<!--          <div class="col-sm-12">-->
<!--            <label class="form-label">Email <span class="text-danger">*</span></label>-->
<!--            <div class="input-group">-->
<!--              <input disabled type="email" class="form-control" :value="user.email">-->
<!--              <button v-if="!user.email_verified" type="button" @click="sendCodeVerifyEmail" class="btn btn-primary">-->
<!--                <i v-if="sendingVerificationCode" class="fa fa-spinner fa-spin"></i>-->
<!--                <span v-else>Xác minh email của bạn</span>-->
<!--              </button>-->
<!--            </div>-->
<!--          </div>-->
          <div class="col-12">
            <div class="form-group">
              <label class="form-label">Số điện thoại <span class="text-danger">*</span></label>
              <input class="form-control" autocomplete="off" v-model="user.phone_number" required />
            </div>
          </div>
          <div class="col-sm-12">
            <div class="form-group">
              <label class="form-label">Ngày tháng năm sinh <span class="text-danger">*</span></label>
              <div class="d-flex">
                <select class="form-control mx-2" required v-model="selectedDay">
                  <option value="">Ngày</option>
                  <option v-for="day in days" :key="day" :value="day">{{ day }}</option>
                </select>
                <select class="form-control mx-2" required v-model="selectedMonth">
                  <option value="">Tháng</option>
                  <option v-for="month in months" :key="month" :value="month">{{ month }}</option>
                </select>
                <select class="form-control mx-2" required v-model="selectedYear">
                  <option value="">Năm</option>
                  <option v-for="year in years" :key="year" :value="year">{{ year }}</option>
                </select>
              </div>
            </div>
          </div>
          <div class="col-12">
            <div class="form-group">
              <label class="form-label">Địa chỉ <span class="text-danger">*</span></label>
              <textarea class="form-control" required aria-label="With textarea" v-model="user.address"></textarea>
            </div>
          </div>
          <div class="col-lg-4">
            <div class="form-group">
              <label class="form-label">Tỉnh/Thành phố</label>
              <select class="form-control" v-model="selectedProvince" @change="onProvinceChange">
                <option value="">Chọn Tỉnh/Thành phố</option>
                <option v-for="province in provinces" :key="province.Id" :value="province">
                  {{ province.Name }}
                </option>
              </select>
            </div>
          </div>
          <div class="col-lg-4">
            <div class="form-group">
              <label class="form-label">Quận/Huyện <span class="text-danger">*</span></label>
              <select class="form-control" required  v-model="selectedDistrict" @change="onDistrictChange">
                <option value="">Chọn Quận/Huyện</option>
                <option v-for="district in districts" :key="district.Id" :value="district">
                  {{ district.Name }}
                </option>
              </select>
            </div>
          </div>
          <div class="col-lg-4">
            <div class="form-group">
              <label class="form-label">Phường/Xã <span class="text-danger">*</span></label>
              <select class="form-control" required v-model="selectedWard" @change="onWardChange">
                <option value="">Chọn Phường/Xã</option>
                <option v-for="ward in wards" :key="ward.Id" :value="ward">
                  {{ ward.Name }}
                </option>
              </select>
            </div>
          </div>

          <div class="mb-3">
            <label class="fancy-checkbox">
              <input type="checkbox" v-model="changePassword" name="checkbox">
              <span> Đổi mật khẩu</span>
            </label>
          </div>
          <div class="col-sm-4" v-if="changePassword">
            <div class="form-group">
              <label class="form-label">Mật khẩu cũ</label>
              <input class="form-control" type="password" v-model="oldPassword">
            </div>
          </div>
          <div class="col-sm-4" v-if="changePassword">
            <div class="form-group">
              <label class="form-label">Mật khẩu mới</label>
              <input class="form-control" type="password" v-model="newPassword">
            </div>
          </div>
          <div class="col-sm-4"  v-if="changePassword">
            <div class="form-group">
              <label class="form-label">Xác nhận mật khẩu mới</label>
              <input class="form-control" type="password" v-model="confirmPassword">
            </div>
          </div>
          <div class="col-md-12">
            <div class="form-group">
              <label class="form-label">Nhập mã xác nhận được gửi về email <span class="text-danger">*</span></label>
              <div class="input-group">
                <input class="form-control" required type="text" v-model="verifyCode">
              </div>
            </div>
          </div>
          <div class="col-12">
            <button type="button" class="btn btn-secondary text-uppercase me-3" @click="sendVerificationCode" :disabled="sendingVerificationCode || countdown > 0">
              <template v-if="sendingVerificationCode"><i class="fa fa-spinner fa-spin"></i> Đang gửi mã xác nhận</template>
              <span v-else>{{ countdown > 0 ? `Gửi lại mã xác nhận (${countdown}s)` : 'Gửi mã xác nhận' }}</span>
            </button>
            <button type="submit" class="btn btn-success text-uppercase" :disabled="loading">
              <i v-if="loading" class="fa fa-spinner fa-spin"></i>
              <span>{{ loading ? 'Đang lưu...' : 'Lưu' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
<script>
import axios from 'axios';
import Api from "../../common/js/Api";
import Notify from "../../common/js/Notify";


export default {
  props: {
    user: {
      type: Object,
      required: true
    },
    provinces: {
      type: Array,
      required: true
    },
  },

  computed: {

  },
  data() {
    return {
      districts: [],
      wards: [],
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
      changePassword: false,
      verifyCode: null,
      selectedProvince: null,
      selectedDistrict: null,
      selectedWard: null,
      loading: false,
      loadingSendCode: false,
      sendingVerificationCode: false,
      countdown: 0,
      selectedDay: '',
      selectedMonth: '',
      selectedYear: '',
      days: Array.from({ length: 31 }, (_, i) => i + 1),
      months: Array.from({ length: 12 }, (_, i) => i + 1),
      years: Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i),
    };
  },
  mounted() {
    this.startCountdown();
  },
  watch: {
    user: {
      immediate: true,
      handler(newUser) {
        this.updateSelectedValues(newUser);
        this.updateDateOfBirthProp(newUser)
      }
    },
    selectedDay() {
      this.updateDateOfBirth();
    },
    selectedMonth() {
      this.updateDateOfBirth();
    },
    selectedYear() {
      this.updateDateOfBirth();
    },
  },
  methods: {
    isValidDate(day, month, year) {
      const date = new Date(year, month - 1, day);
      return (
          date.getFullYear() === year &&
          date.getMonth() === month - 1 &&
          date.getDate() === day
      );
    },
    updateDateOfBirth() {
      if (this.selectedDay && this.selectedMonth && this.selectedYear) {
        if (this.isValidDate(this.selectedDay, this.selectedMonth, this.selectedYear)) {
          this.user.date_of_birth = new Date(this.selectedYear, this.selectedMonth - 1, this.selectedDay).toISOString();
        } else {
          this.user.date_of_birth = '';
          alert('Ngày sinh không hợp lệ');
        }
      } else {
        this.user.date_of_birth = '';
      }
    },
    updateSelectedValues(user) {
      this.selectedProvince = this.provinces.find(province => province.Name === user.province) || null;
      this.onProvinceChange()
      if (this.selectedProvince) {
        this.selectedDistrict = this.selectedProvince.Districts.find(district => district.Name === user.district) || null;
        if(this.selectedDistrict){
          this.onDistrictChange()
        }

      } else {
        this.selectedDistrict = null;
      }

      if (this.selectedDistrict) {
        this.selectedWard = this.selectedDistrict.Wards.find(ward => ward.Name === user.ward) || null;

      } else {
        this.selectedWard = null;
      }
    },
    updateDateOfBirthProp(user){
      if (user.date_of_birth) {
        const dateOfBirth = new Date(user.date_of_birth);
        this.selectedDay = dateOfBirth.getDate();
        this.selectedMonth = dateOfBirth.getMonth() + 1;
        this.selectedYear = dateOfBirth.getFullYear();
      } else {
        this.selectedDay = '';
        this.selectedMonth = '';
        this.selectedYear = '';
      }
    },
    onProvinceChange() {
      this.districts = this.selectedProvince ? this.selectedProvince.Districts : [];
      this.selectedDistrict = null;
      this.selectedWard = null;
      this.user.province = this.selectedProvince ? this.selectedProvince.Name : '';
    },
    onDistrictChange() {
      this.wards = this.selectedDistrict ? this.selectedDistrict.Wards : [];
      this.selectedWard = null;
      this.user.district = this.selectedDistrict ? this.selectedDistrict.Name : '';
    },
    onWardChange() {
      this.user.ward = this.selectedWard ? this.selectedWard.Name : '';
    },
    async sendCodeVerifyEmail() {
      try {
        this.sendingVerificationCode = true;
        const response = await Api.post('/api/profile/send-verification-code');
        alert('Đường dẫn xác nhận email đã được gửi đi. Vui lòng kiểm tra email của bạn')
      } catch (error) {
        console.log(error)
        if (error.response && error.response.data) {
          Notify.error(null, error.response.data.error);
        } else {
          Notify.error();
        }
      } finally {
        this.sendingVerificationCode = false;
      }
    },
    async sendVerificationCode() {
      try {
        this.sendingVerificationCode = true;
        const response = await Api.post('/api/profile/send-verify-code-update-info');
        Notify.success(null,'Mã xác nhận đã được gửi đi. Vui lòng kiểm tra email của bạn')

        const currentTime = Date.now();
        const cooldownDuration = 30 * 1000; // 30 seconds in milliseconds
        const nextAllowedTime = currentTime + cooldownDuration;
        this.saveNextAllowedTime(nextAllowedTime);

        this.startCountdown();
      } catch (error) {
        console.log(error);
        if (error.response && error.response.data) {
          Notify.error(null, error.response.data.error);
        } else {
          Notify.error();
        }
      } finally {
        this.sendingVerificationCode = false;
      }
    },
    startCountdown() {
      const nextAllowedTime = localStorage.getItem('nextAllowedVerificationTime');
      if (nextAllowedTime) {
        const currentTime = Date.now();
        const remainingTime = Math.floor((nextAllowedTime - currentTime) / 1000);
        if (remainingTime > 0) {
          this.countdown = remainingTime;
          const timer = setInterval(() => {
            this.countdown--;
            if (this.countdown <= 0) {
              clearInterval(timer);
              localStorage.removeItem('nextAllowedVerificationTime');
            }
          }, 1000);
        } else {
          localStorage.removeItem('nextAllowedVerificationTime');
        }
      }
    },
    saveNextAllowedTime(nextAllowedTime) {
      localStorage.setItem('nextAllowedVerificationTime', nextAllowedTime);
    },
    loadNextVerificationTime() {
      const nextVerificationTime = localStorage.getItem('nextVerificationTime');
      if (nextVerificationTime) {
        const currentTime = Date.now();
        const remainingTime = Math.floor((nextVerificationTime - currentTime) / 1000);
        if (remainingTime > 0) {
          this.countdown = remainingTime;
          this.startCountdown();
        }
      }
    },
    async updateUserInfo() {
      try {
        if (this.newPassword !== this.confirmPassword) {
          Notify.error('Mật khẩu mới và xác nhận mật khẩu không khớp nhau')
          return;
        }

        this.loading = true;
        const response = await Api.put('/api/profile', {
          date_of_birth: this.user.date_of_birth,
          address: this.user.address,
          ward: this.user.ward,
          district: this.user.district,
          phone_number: this.user.phone_number,
          province: this.user.province,
          old_password: this.oldPassword,
          new_password: this.newPassword,
          update_info_verify_code: this.verifyCode
        });
        this.oldPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
        Notify.success(null,'Cập nhật thông tin cá nhân thành công!')
      } catch (error) {
        // Xử lý lỗi nếu có
        console.log(error)
        if (error.response && error.response.data) {
          Notify.error(null, error.response.data.error);
        } else {
          Notify.error();
        }
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>