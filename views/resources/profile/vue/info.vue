  <template>
    <div class="col-xl-4 col-lg-5 col-md-12">
      <div class="card profile-card flex-column mb-3">
        <div class="card-header py-3 d-flex justify-content-between bg-transparent border-bottom-0">
          <h6 class="mb-0 fw-bold ">Thông tin cá nhân</h6>
        </div>
        <div class="card-body d-flex profile-fulldeatil flex-column">
          <div class="profile-user text-center w220 mx-auto">
            <a href="#" class="avatar-container">
              <img :src="user.avatar" alt="" class="avatar xl rounded img-thumbnail shadow-sm">
              <div v-if="isAvatarUpdating" class="avatar-updating-spinner"></div>
            </a>

            <div class="about-info d-flex align-items-center mt-2 justify-content-center flex-column">
              <label for="avatar-input" style="cursor: pointer" class="mt-2 text-primary text-decoration-underline cursor-pointer">
                <i class="icofont-pencil-alt-2 me-1"></i>
                Chỉnh sửa avatar
              </label>
              <input type="file" id="avatar-input" class="d-none" accept="image/*" @change="handleAvatarChange">
              <span class="text-muted small mt-2">ID người dùng : {{ user._id }}</span>
              <span class="badge bg-careys-pink mt-2" v-if="user.level">{{user?.level?.level_name}}</span>
              <span class="small text-muted d-flex align-items-center mt-2" v-if="user.level && user.level.stars">
                <i v-for="star of user.level.stars" :key="star" class="icofont-diamond px-1 fs-5 color-lightyellow"></i>
              </span>
            </div>
          </div>
          <div class="profile-info w-100">
            <h6 class="mb-0 mt-2 fw-bold d-block fs-6 text-center">{{ user.full_name }}</h6>
            <label style="cursor: pointer" @click="showUpdateFullName" class="mt-2 text-primary text-decoration-underline cursor-pointer">
              <i class="icofont-pencil-alt-1 me-1"></i>
              Chỉnh sửa họ và tên
            </label>
            <div class="row g-2 mt-3">
              <div class="col-xl-12">
                <div class="d-flex align-items-center">
                  <i class="icofont-email"></i>
                  <span class="ms-2">{{ user.email }}</span>
                  <i v-if="user.email_verified" class="icofont-check-circled ms-2 text-success" title="Đã xác minh"></i>
                  <i v-else class="icofont-close-circled ms-2 text-danger" title="Chưa xác minh"></i>
                </div>
              </div>
              <div class="col-xl-12">
                <div class="d-flex align-items-center">
                  <i class="icofont-birthday-cake"></i>
                  <span class="ms-2">{{ formatDate(user.date_of_birth)}}</span>
                </div>
              </div>
              <div class="col-xl-12">
                <div class="d-flex align-items-center">
                  <i class="icofont-address-book"></i>
                  <span class="ms-2">{{ user.address }}</span>
                </div>
              </div>
              <div class="col-xl-12">
                <div class="d-flex align-items-center">
                  <i class="icofont-location-pin"></i>
                  <span class="ms-2">{{ user.ward }}, {{ user.district }}, {{ user.province }}</span>
                </div>
              </div>
              <div class="col-xl-12" v-if="user.level && user.level.referral_enabled">
                <div class="d-flex align-items-center">
                  <i class="icofont-connection"></i>
                  <span class="ms-2">Mã giới thiệu: {{user.invite_code}}</span>
                  <i  @click="copyInviteCode(user.invite_code)" class="icofont-copy ms-2" style="cursor: pointer" title="Sao chép mã giới thiệu"></i>
                </div>
              </div>
              <div class="col-xl-12 mt-3">
                <div class="d-flex align-items-center">
                  <i class="icofont-lock"></i>
                  <span class="ms-2">Mã PIN rút tiền: </span>
                  <a v-if="!user.withdraw_pin" href="#" @click.prevent="setupWithdrawPin" class="text-primary ms-2">
                    Cài đặt mã PIN rút tiền
                  </a>
                  <a v-else-if="user.withdraw_pin_locked && user.withdraw_pin_reset_time > new Date()" href="#" @click.prevent="resetWithdrawPin" class="text-primary ms-2">
                    Cài đặt lại mã PIN
                  </a>
                  <a v-else href="#" @click.prevent="updateWithdrawPin" class="text-primary ms-2">
                    Cập nhật mã PIN rút tiền
                  </a>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
      <WithdrawPinModal
          :action="pinAction"
          @pin-updated="handlePinUpdated"
      />
    </div>
  </template>

  <script>
  import Api from "../../common/js/Api";
  import Notify from "../../common/js/Notify";
  import WithdrawPinModal from './WithdrawPinModal.vue';
  export default {
    components: {WithdrawPinModal},
    props: {
      user: {
        type: Object,
        required: true
      }
    },
    data(){
      return {
        isAvatarUpdating: false,
      }
    },
    methods: {
      formatDate(value) {
        return new Date(value).toLocaleDateString();
      },
      handleHashChange() {
        if (window.location.hash === '#with-draw-pin-setting') {
          if (!this.user.withdraw_pin) {
            this.setupWithdrawPin();
          } else if (this.user.withdraw_pin_locked && this.user.withdraw_pin_reset_time > new Date()) {
            this.resetWithdrawPin();
          } else {
            this.updateWithdrawPin();
          }

        }
      },
      showUpdateFullName(){
        Notify.error('Không thể thực hiện thao tác','Vui lòng liên hệ CSKH để yêu cầu thay đổi thông tin họ và tên.')
      },
      async handleAvatarChange(event) {
        const file = event.target.files[0];
        if (file) {
          try {
            this.isAvatarUpdating = true; // Bắt đầu update avatar
            // Tạo form data để gửi file lên server
            const formData = new FormData();
            formData.append('avatar', file);

            // Gửi request PUT để update avatar
            const response = await Api.post('/api/profile/update-avatar', formData, {
              headers: {
                'Content-Type': 'multipart/form-data'
              }
            });

            // Cập nhật lại URL của avatar trong dữ liệu người dùng
            this.$emit('update-avatar',response.data.avatar)

            // Hiển thị thông báo thành công
            alert('Avatar đã được cập nhật thành công.');
          } catch (error) {
            console.error('Lỗi khi cập nhật avatar:', error);
            // Hiển thị thông báo lỗi
            alert('Đã xảy ra lỗi khi cập nhật avatar. Vui lòng thử lại sau.');
          }finally {
            this.isAvatarUpdating = false
          }
        }
      },
      async copyInviteCode(invite_code){
        try{
          const response  = await Api.get('/api/profile/get-invite-link')
          if(response.data.invite_ur){
            await this.copyToClipboard(response.data.invite_ur)
          }else{
            await this.copyToClipboard(invite_code)
          }
        }catch (e){
          Notify.error(null,'Đã xảy ra lỗi trong quá trình sao chép URL giới thiệu')
        }
      },
      async copyToClipboard(text) {

        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(text)
              .then(() => {
                Notify.success(null,`Đã sao chép nội dung ${text}`);
              })
              .catch((error) => {
                Notify.error(null,'Lỗi khi sao chép.');
                console.error('Error copying:', error);
              });
        } else {
          // Fallback để sao chép địa chỉ ví nếu Clipboard API không khả dụng
          try {
            let tempInput = document.createElement('input');
            tempInput.value = text;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
            Notify.success(null,`Đã sao chép nội dung ${text}`);
          } catch (error) {
            Notify.error(null,'Lỗi khi sao chép.');
            console.error('Error copying', error);
          }
        }
      },

      setupWithdrawPin() {
        this.pinAction = 'setup';
        this.showPinModal();
      },

      resetWithdrawPin() {
        this.pinAction = 'reset';
        this.showPinModal();
      },

      updateWithdrawPin() {
        this.pinAction = 'update';
        this.showPinModal();
      },

      showPinModal() {
        const modal = new bootstrap.Modal(document.getElementById('withdrawPinModal'));
        modal.show();
      },

      handlePinUpdated() {
        // Refresh user data or update locally
        this.$emit('refresh-user');
      }
    },
    mounted() {
      window.addEventListener('hashchange', this.handleHashChange);
      // Check hash on initial load
      this.handleHashChange();
    },
    beforeUnmount() {
      window.removeEventListener('hashchange', this.handleHashChange);
    }
  }
  </script>
  <style>
  .avatar-container {
    position: relative;
    display: inline-block;
  }

  .avatar-updating-spinner {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 4px solid #ccc;
    border-top-color: #333;
    animation: spin 1s infinite linear;
  }

  @keyframes spin {
    0% {
      transform: translate(-50%, -50%) rotate(0deg);
    }
    100% {
      transform: translate(-50%, -50%) rotate(360deg);
    }
  }
  </style>