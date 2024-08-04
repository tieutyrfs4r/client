<template>
  <div class="row g-3">
    <div class="col-lg-6 d-flex justify-content-center align-items-center">
      <div class="d-flex flex-column mt-3">
        <div class="text-center">
          <h1>Đăng ký</h1>
          <span class="text-muted">Chào mừng đến với Cryptoon! Đăng ký bằng Email của bạn</span>
        </div>

        <div class="tab-content mt-4 mb-3">
          <div class="tab-pane fade show active" id="Email">
            <div class="card">
              <div class="card-body p-4">
                <form @submit.prevent="register">
                  <div class="row mb-3">
                    <div class="col-md-12">
                      <label class="form-label fs-6">Họ và tên <span class="text-danger">*</span></label>
                      <input type="text" class="form-control" v-model="fullName" required>
                    </div>
                  </div>
                  <div class="row mb-3">
                    <div class="col-md-12">
                      <label class="form-label fs-6">Số điện thoại <span class="text-danger">*</span></label>
                      <input type="tel" class="form-control" v-model="phoneNumber" required>
                    </div>
                  </div>
                  <div class="row mb-3">
                    <div class="col-md-12">
                      <label class="form-label fs-6">Địa chỉ email <span class="text-danger">*</span></label>
                      <div class="input-group">
                        <input type="email" class="form-control" v-model="email" required>
                      </div>
                    </div>
                  </div>
                  <div class="row mb-3">
                    <div class="col-md-6">
                      <label class="form-label fs-6">Mật khẩu <span class="text-danger">*</span></label>
                      <input type="password" class="form-control" v-model="password" required>
                    </div>
                    <div class="col-md-6">
                      <label class="form-label fs-6">Nhập lại mật khẩu <span class="text-danger">*</span></label>
                      <input type="password" class="form-control" v-model="confirmPassword" required>
                    </div>
                  </div>
                  <div class="row mb-3">
                    <div class="col-md-6">
                      <label class="form-label fs-6">Tỉnh/Thành phố <span class="text-danger">*</span></label>
                      <select class="form-control" v-model="selectedProvince" @change="onProvinceChange">
                        <option value="">Chọn Tỉnh/Thành phố</option>
                        <option v-for="province in provinces" :key="province.Id" :value="province">
                          {{ province.Name }}
                        </option>
                      </select>
                    </div>
                    <div class="col-md-6">
                      <label class="form-label fs-6">Quận/Huyện <span class="text-danger">*</span></label>
                      <select class="form-control" required  v-model="selectedDistrict" @change="onDistrictChange">
                        <option value="">Chọn Quận/Huyện</option>
                        <option v-for="district in districts" :key="district.Id" :value="district">
                          {{ district.Name }}
                        </option>
                      </select>
                    </div>
                  </div>
                  <div class="row mb-3">
                    <div class="col-md-6">
                      <label class="form-label fs-6">Phường/Xã <span class="text-danger">*</span></label>
                      <select class="form-control" required v-model="selectedWard" @change="onWardChange">
                        <option value="">Chọn Phường/Xã</option>
                        <option v-for="ward in wards" :key="ward.Id" :value="ward">
                          {{ ward.Name }}
                        </option>
                      </select>
                    </div>
                    <div class="col-md-6">
                      <label class="form-label fs-6">Địa chỉ <span class="text-danger">*</span></label>
                      <input type="text" class="form-control" v-model="address" required>
                    </div>
                  </div>
                  <div class="mb-3">
                    <label class="form-label fs-6">Ngày sinh <span class="text-danger">*</span></label>
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
                  <div class="mb-3">
                    <label class="form-label fs-6">Mã giới thiệu <span class="text-danger">*</span></label>
                    <input type="text" required class="form-control" v-model="referralCode">
                  </div>
                  <button type="submit" class="btn btn-primary text-uppercase py-2 fs-5 w-100 mt-2" :disabled="loading">
                    <span v-if="loading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    {{ loading ? 'Đang đăng ký...' : 'Đăng ký' }}
                  </button>
                  <div class="mt-3 text-center">
                    <p class="text-muted">Bạn đã có tài khoản? <a href="/login" class="custom-link"><i>Nhấn vào đây</i></a>  để đăng nhập</p>
                    <p class="text-muted">Bằng việc tiếp tục đăng ký tài khoản, bạn xác nhận rằng bạn đã đọc và đồng ý với <a href="#" class="custom-link">Điều khoản</a> &
                      <a href="#" class="custom-link">Điều kiện</a> và <a href="#" class="custom-link">Chính sách Cookie</a> của chúng tôi</p>
                  </div>


                </form>
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
import axios from "axios";
import moment from "moment";

export default {
  data() {
    return {
      fullName: '',
      phoneNumber: '',
      email: '',
      password: '',
      confirmPassword: '',
      referralCode: '',
      address: '',
      ward: '',
      district: '',
      province: '',
      provinces: [],
      districts: [],
      wards: [],
      dateOfBirth: '',
      loading: false,
      cooldown: 0,
      selectedDay: '',
      selectedMonth: '',
      selectedYear: '',
      days: Array.from({ length: 31 }, (_, i) => i + 1),
      months: Array.from({ length: 12 }, (_, i) => i + 1),
      years: Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i),
    };
  },
  watch: {
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
      return moment(`${year}-${month}-${day}`, 'YYYY-M-D', true).isValid();
    },
    updateDateOfBirth() {
      if (this.selectedDay && this.selectedMonth && this.selectedYear) {
        if (this.isValidDate(this.selectedDay, this.selectedMonth, this.selectedYear)) {
          this.dateOfBirth = new Date(this.selectedYear, this.selectedMonth - 1, this.selectedDay).toISOString();
        } else {
          this.dateOfBirth = '';
          alert('Ngày sinh không hợp lệ');
        }
      } else {
        this.dateOfBirth = '';
      }
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
    onProvinceChange() {
      this.districts = this.selectedProvince ? this.selectedProvince.Districts : [];
      this.selectedDistrict = null;
      this.selectedWard = null;
      this.province = this.selectedProvince ? this.selectedProvince.Name : '';
    },
    onDistrictChange() {
      this.wards = this.selectedDistrict ? this.selectedDistrict.Wards : [];
      this.selectedWard = null;
      this.district = this.selectedDistrict ? this.selectedDistrict.Name : '';
    },
    onWardChange() {
      this.ward = this.selectedWard ? this.selectedWard.Name : '';
    },
    async register() {
      if (this.password !== this.confirmPassword) {
        alert('Mật khẩu nhập lại không khớp');
        return;
      }

      try {
        this.loading = true;
        const response = await Api.post('/api/register', {
          full_name: this.fullName,
          email: this.email,
          password: this.password,
          referral_code: this.referralCode,
          phone_number: this.phoneNumber,
          address: this.address,
          ward: this.ward,
          district: this.district,
          province: this.province,
          date_of_birth: this.dateOfBirth
        });

        Notify.success(null,'Đăng ký thành công. Vui lòng kiểm tra Email để kích hoạt tài khoản của bạn.');

        setTimeout(() => {
          window.location.href = '/login';
        },3000)
      } catch (error) {
        console.error(error);
        if(error.response && error.response.data && error.response.data.error) {
          Notify.error(null,error.response.data.error)
        }else{
          Notify.error()
        }
      } finally {
        this.loading = false;
      }
    },
  },
  mounted() {
    this.fetchProvinces();
    const urlParams = new URLSearchParams(window.location.search);
    const referralCodeFromUrl = urlParams.get('i');
    if (referralCodeFromUrl) {
      this.referralCode = referralCodeFromUrl;
    }
  }
};
</script>
<style>
.custom-link {
  color: #0000ff;  /* Màu xanh dương */
  text-decoration: underline;  /* Gạch chân */
}
</style>