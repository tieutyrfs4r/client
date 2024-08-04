<template>
  <div class="modal fade" id="withdrawPinModal" tabindex="-1" aria-labelledby="withdrawPinModalLabel" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="withdrawPinModalLabel">{{ modalTitle }}</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="submitForm">
            <div class="mb-3">
              <label for="newPin" class="form-label">Mã PIN mới</label>
              <input type="password" class="form-control" id="newPin" v-model="newPin" required minlength="6" maxlength="6">
            </div>
            <div class="mb-3">
              <label for="emailCode" class="form-label">Nhập mã xác nhận</label>
              <div class="input-group">
                <input type="text" class="form-control" id="emailCode" v-model="emailCode" required>
                <button class="btn btn-outline-secondary" type="button" @click="sendEmailCode" :disabled="cooldown > 0 || isLoading">
                  <i v-if="isLoading" class="fa fa-spinner fa-spin"></i>
                  {{ cooldown > 0 ? `Gửi lại sau ${cooldown}s` : 'Gửi mã' }}
                </button>
              </div>
            </div>
            <div class="mb-3">
              <label for="password" class="form-label">Mật khẩu</label>
              <input type="password" class="form-control" id="password" v-model="password" required>
            </div>
            <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
              <i v-if="isSubmitting" class="fa fa-spinner fa-spin me-2"></i>
              {{ isSubmitting ? 'Đang xử lý...' : 'Xác nhận' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Api from "../../common/js/Api";
import Notify from "../../common/js/Notify";

export default {
  props: {
    action: {
      type: String,
      required: true,
      validator: (value) => ['setup', 'update', 'reset'].includes(value)
    }
  },
  data() {
    return {
      newPin: '',
      emailCode: '',
      password: '',
      cooldown: 0,
      isLoading: false,
      isSubmitting: false
    }
  },
  computed: {
    modalTitle() {
      const titles = {
        setup: 'Cài đặt mã PIN rút tiền',
        update: 'Cập nhật mã PIN rút tiền',
        reset: 'Đặt lại mã PIN rút tiền'
      }
      return titles[this.action]
    }
  },
  created() {
    this.checkStoredCooldown();
  },
  methods: {
    checkStoredCooldown() {
      const storedCooldown = localStorage.getItem('emailCooldown');
      const storedTimestamp = localStorage.getItem('emailCooldownTimestamp');
      if (storedCooldown && storedTimestamp) {
        const elapsedTime = Math.floor((Date.now() - parseInt(storedTimestamp)) / 1000);
        if (elapsedTime < storedCooldown) {
          this.cooldown = storedCooldown - elapsedTime;
          this.startCooldown();
        } else {
          localStorage.removeItem('emailCooldown');
          localStorage.removeItem('emailCooldownTimestamp');
        }
      }
    },
    async sendEmailCode() {
      if (this.cooldown > 0 || this.isLoading) return;

      this.isLoading = true;
      try {
        await Api.post('/api/profile/send-verify-code-update-info');
        Notify.success('Gửi mã thành công', 'Vui lòng kiểm tra email của bạn');
        this.startCooldown();
      } catch (error) {
        Notify.error('Lỗi', 'Không thể gửi mã xác nhận. Vui lòng thử lại sau.');
      } finally {
        this.isLoading = false;
      }
    },
    startCooldown() {
      this.cooldown = 60;
      localStorage.setItem('emailCooldown', this.cooldown);
      localStorage.setItem('emailCooldownTimestamp', Date.now());
      const timer = setInterval(() => {
        this.cooldown--;
        if (this.cooldown <= 0) {
          clearInterval(timer);
          localStorage.removeItem('emailCooldown');
          localStorage.removeItem('emailCooldownTimestamp');
        } else {
          localStorage.setItem('emailCooldown', this.cooldown);
        }
      }, 1000);
    },
    async submitForm() {
      if (this.isSubmitting) return;

      this.isSubmitting = true;
      try {
        const response = await Api.post('/api/profile/update-withdraw-pin', {
          new_pin: this.newPin,
          update_info_verify_code: this.emailCode,
          password: this.password
        });
        Notify.success('Thành công', response.data.message);
        this.$emit('pin-updated');
        // Close the modal
        const modal = document.getElementById('withdrawPinModal');
        const bootstrapModal = bootstrap.Modal.getInstance(modal);
        bootstrapModal.hide();
      } catch (error) {
        Notify.error('Lỗi', error.response?.data?.error || 'Đã xảy ra lỗi. Vui lòng thử lại.');
      } finally {
        this.isSubmitting = false;
      }
    }
  }
}
</script>