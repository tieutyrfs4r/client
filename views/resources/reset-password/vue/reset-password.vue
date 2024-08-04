<template>
  <div class="d-flex flex-column">
    <h1>Đặt Lại Mật Khẩu Của Bạn</h1>
    <div v-if="!codeSent && !hasResetPasswordQuery" class="card mt-4">
      <div class="card-body p-4">
        <form @submit.prevent="sendCode">
          <div class="mb-3">
            <label class="form-label fs-6">Địa chỉ email</label>
            <input type="email" v-model="email" class="form-control" required>
          </div>
          <button type="submit" class="btn btn-primary text-uppercase py-2 fs-5 w-100 mt-2" :disabled="sendingCode">
            <span v-if="sendingCode" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            {{ sendingCode ? 'Đang gửi mã xác nhận...' : 'Tiếp theo' }}
          </button>
          <div class="mt-3 text-center">
            <p class="text-muted"><a href="/login">Nhấn vào đây để quay lại đăng nhập</a></p>
          </div>
        </form>
      </div>
    </div>
    <div v-if="codeSent || hasResetPasswordQuery" class="card mt-4">
      <div class="card-body p-4">
        <form @submit.prevent="resetPassword">
          <div class="mb-3">
            <label class="form-label fs-6">Mật khẩu mới <span class="text-danger">*</span></label>
            <input type="password" v-model="newPassword" class="form-control" required>
          </div>
          <div class="mb-3">
            <label class="form-label fs-6">Nhập lại mật khẩu mới <span class="text-danger">*</span></label>
            <input type="password" v-model="confirmPassword" class="form-control" required>
          </div>
          <div class="mb-3">
            <label class="form-label fs-6">Mã xác nhận <span class="text-danger">*</span></label>
            <input type="text" v-model="resetCode" class="form-control" required>
          </div>
          <button type="submit" class="btn btn-primary text-uppercase py-2 fs-5 w-100 mt-2" :disabled="resettingPassword">
            <span v-if="resettingPassword" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            {{ resettingPassword ? 'Đang đặt lại...' : 'Đặt lại mật khẩu' }}
          </button>
          <div class="mt-3 text-center">
            <p class="text-muted">
              <a href="#" @click.prevent="resendCode" :disabled="cooldown > 0">
                {{ cooldown > 0 ? `Gửi lại mã xác nhận (${cooldown}s)` : this.sendingCode ? 'Đang gửi lại mã xác nhận...': 'Gửi lại mã xác nhận' }}
              </a>
            </p>
            <p class="text-muted"><a href="/login">Nhấn vào đây để quay lại đăng nhập</a></p>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import Api from "../../common/js/Api";
import Notify from "../../common/js/Notify";

export default {
  data() {
    return {
      email: "",
      codeSent: false,
      newPassword: "",
      confirmPassword: "",
      resetCode: "",
      sendingCode: false,
      resettingPassword: false,
      hasResetPasswordQuery: false,
      cooldown: 0,
    };
  },
  mounted() {
    const urlParams = new URLSearchParams(window.location.search);
    const step = urlParams.get('step');
    const email = urlParams.get('email');
    const resetCode = urlParams.get('token');

    if (step === 'reset_password' && email && resetCode) {
      this.email = email;
      this.resetCode = resetCode;
      this.hasResetPasswordQuery = true;
    }
  },
  methods: {
    async sendCode() {
      this.sendingCode = true;
      try {
        await Api.post("/api/send-reset-password-code", { email: this.email });
        this.codeSent = true;
        this.startCooldown();
        Notify.success(null, 'Mã cài đặt lại mật khẩu đã được gửi đi, vui lòng kiểm tra email của bạn.');
      } catch (error) {
        console.log(error);
        if (error.response && error.response.data && error.response.data.error) {
          Notify.error(null, error.response.data.error);
        } else {
          Notify.error();
        }
      }
      this.sendingCode = false;
    },
    async resendCode() {
      if (this.cooldown > 0) return;
      await this.sendCode();
    },
    startCooldown() {
      this.cooldown = 30;
      const timer = setInterval(() => {
        this.cooldown--;
        if (this.cooldown === 0) {
          clearInterval(timer);
        }
      }, 1000);
    },
    async resetPassword() {
      if (this.newPassword !== this.confirmPassword) {
        Notify.error(null, 'Mật khẩu nhập lại không khớp');
        return;
      }
      this.resettingPassword = true;
      try {
        await Api.post("/api/reset-password", {
          email: this.email,
          new_password: this.newPassword,
          reset_code: this.resetCode,
        });

        Notify.success(null, 'Mật khẩu đã được đặt lại thành công!');
        setTimeout(() => {
          window.location.href = '/login';
        }, 3000);
      } catch (error) {
        console.error(error);

        if (error.response && error.response.data && error.response.data.error) {
          Notify.error(null, error.response.data.error);
        } else {
          Notify.error();
        }
      }
      this.resettingPassword = false;
    },
  },
};
</script>