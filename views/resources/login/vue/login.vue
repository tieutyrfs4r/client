<template>
  <div class="container-xxl">
    <div class="row g-3">
      <div class="col-lg-6 d-flex justify-content-center align-items-center auth-h100">
        <div class="d-flex flex-column">
          <h1>Đăng nhập tài khoản</h1>
          <span class="text-muted">Chào mừng trở lại! Đăng nhập bằng Email hoặc số điện thoại</span>
          <div v-if="error" :class="['alert', 'mt-2', 'text-center', errorCode === 'locked' ? 'alert-danger' : 'alert-warning']" role="alert">
            {{ error }}
            <div v-if="errorCode === 'email_verified'">
              <p class="text-muted">
                <a
                    @click.prevent="sendVerifyCode"
                    href="#"
                    class="text-primary text-decoration-underline"
                    :class="{ 'disabled': isSendingCode || countdown > 0 }"
                >
                  {{ isSendingCode ? 'Đang gửi mã xác thực...' : 'Nhấn vào đây để gửi lại mã xác thực' }}
                </a>
                <span v-if="countdown > 0"> ({{ countdown }}s)</span>
              </p>
            </div>
          </div>

          <div v-if="message" class="alert alert-warning mt-2 text-center" role="alert">
            {{ message }}
          </div>

          <div class="tab-content mt-4 mb-3">
            <div class="tab-pane fade show active" id="Email">
              <div class="card">
                <div class="card-body p-4">
                  <form @submit.prevent="login">
                    <div class="mb-3">
                      <label class="form-label fs-6">Địa chỉ email</label>
                      <input type="email" class="form-control" v-model="email">
                    </div>
                    <div class="mb-3">
                      <label class="form-label fs-6">Mật khẩu</label>
                      <input type="password" class="form-control" v-model="password">
                    </div>
                    <button type="submit" class="btn btn-primary text-uppercase py-2 fs-5 w-100 mt-2" :disabled="isLoggingIn">
                      <span v-if="isLoggingIn" class="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
                      {{ isLoggingIn ? 'Đang đăng nhập...' : 'Đăng nhập' }}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
          <a href="/reset-password" title="#" class="text-primary text-decoration-underline">Quên mật khẩu?</a>
          <a href="/signup" title="#" class="text-primary text-decoration-underline">Đăng ký ngay</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Api from "../../common/js/Api";
import Notify from "../../common/js/Notify";
import Cookies from 'js-cookie';
import ms from 'ms';
import axios from "axios";

export default {
  data() {
    return {
      email: '',
      password: '',
      error: '',
      message: '',
      errorCode: '',
      isSendingCode: false,
      countdown: 0,
      isLoggingIn: false,
    };
  },
  methods: {
    async login() {
      this.isLoggingIn = true;
      try {
        const response = await axios.post('/api/login', {
          email: this.email,
          password: this.password
        });

        const token = response.data.token;
        const expiresIn = response.data.expiresIn;

        Cookies.set('token', token, { expires: new Date(Date.now() + ms(expiresIn)) });

        window.location.href = '/dashboard';
        this.error = null;
        this.errorCode = null;
      } catch (error) {
        if (error.response && error.response.data.error) {
          this.error = error.response.data.error;
          this.errorCode = error.response.data.code
        } else {
          console.error(error);
        }
      } finally {
        this.isLoggingIn = false;
      }
    },
    async sendVerifyCode() {
      if (this.isSendingCode || this.countdown > 0) return;

      this.isSendingCode = true;
      try {
        await Api.post('/api/resend-verification-code', { email: this.email });
        this.countdown = 30;
        this.startCountdown();
        Notify.success(null,'Gửi mã xác thực thành công, vui lòng kiểm tra email của bạn.')
      } catch (error) {
        console.error(error);
        if (error.response && error.response.data) {
          Notify.error(null, error.response.data.error);
        } else {
          Notify.error();
        }
      } finally {
        this.isSendingCode = false;
      }
    },
    startCountdown() {
      if (this.countdown > 0) {
        setTimeout(() => {
          this.countdown--;
          this.startCountdown();
        }, 1000);
      }
    },
  },
  mounted() {
    // Xử lý khi component được khởi tạo
  }
};
</script>