<template>
  <div class="row g-3 mb-3 row-deck">
    <div class="col-xl-12">
      <div class="card">
        <div class="card-header py-3 d-flex justify-content-between bg-transparent border-bottom align-items-center flex-wrap">
          <h6 class="mb-0 fw-bold">Nạp tiền điện tử</h6>
        </div>
        <div class="card-body">
          <form @submit.prevent="confirmDeposit">
            <div class="mb-3">
              <label class="form-label">Chọn loại tiền điện tử</label>
              <select class="form-select" v-model="selectedWalletId">

                <template v-for="wallet in wallets">
                  <option :key="wallet.cryptocurrency._id" :value="wallet.cryptocurrency._id" v-if="wallet.cryptocurrency.default_deposit_enabled">
                    {{ wallet.cryptocurrency.cryptocurrency_name }}
                  </option>
                </template>

              </select>
            </div>
            <div class="mb-3" v-if="selectedWalletId && !selectedWallet.deposit_default_address_enabled">
              <label class="form-label">Chọn mạng lưới</label>
              <select class="form-select" v-model="selectedNetwork" @change="fetchWalletAddress">
                <option value="">Chọn mạng lưới</option>
                <option v-for="network in networks" :value="network.id" :key="network.id">{{ network.name }}</option>
              </select>
            </div>
            <div class="mb-3">
              <label class="form-label">Số tiền cần nạp</label>
              <input type="number" class="form-control" step="0.01" v-model="depositAmount" required>
              <p class="mt-3" v-if="depositAmount > 0">Số tiền bạn nhận được: <span class="text-danger">{{depositAmount.toLocaleString('en-US', {maximumFractionDigits: 8})}} {{ selectedWallet?.cryptocurrency?.cryptocurrency_name }}</span></p>
            </div>
            <div class="mb-3" v-if="selectedWalletAddress">
              <label class="form-label d-block">Thông tin ví <span class="text-primary">{{ selectedWallet.cryptocurrency.cryptocurrency_name }}</span>
              </label>
              <div class="d-flex flex-wrap align-items-center">
                <div class="d-flex flex-wrap px-lg-2">
                  <div>
                    <div class="truncated">Địa chỉ ví</div>
                    <div class="d-flex align-items-center">
                      <div class="text-danger fw-bold fs-5" style="cursor: pointer;" @click="copyWalletAddress">{{ truncatedWalletAddress }}</div>
                      <i class="bi bi-clipboard ms-2" style="cursor: pointer;" @click="copyWalletAddress"></i>
                    </div>
                    <div class="truncated">Network</div>
                    <div class="text-danger fw-bold fs-5">{{ selectedWalletAddress.network.name }} ({{ selectedWalletAddress.network.short_name }})</div>
                  </div>
                </div>
              </div>
            </div>
            <div class="mb-3">
              <label class="form-label">Tải lên hình ảnh xác nhận</label>
              <input type="file" class="form-control" multiple @change="handleImageUpload" accept="image/*">
              <div class="row mt-3">
                <div class="col-md-6 mb-3" v-for="(image, index) in previewImages" :key="index">
                  <div class="card">
                    <div class="position-relative">
                      <img :src="image" class="card-img-top img-fluid" alt="Preview Image" style="max-height: 300px; object-fit: contain;">
                      <button type="button" class="btn btn-secondary btn-sm position-absolute top-0 end-0 m-1" @click="removeImage(index)">
                        <i class="bi bi-x"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="mb-3">
              <button type="submit" class="btn flex-fill btn-light-warning py-2 fs-5 text-uppercase px-5" :disabled="isUploading">
                <span v-if="isUploading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                {{ isUploading ? 'Đang xác nhận...' : 'Xác nhận' }}
              </button>
            </div>
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
    wallets: {
      type: Array,
      default: [],
      required:true
    },
    networks: {
      type: Array,
      default: [],
      required:true
    },
    cryptoIdSelected: {
      type: String,
      default: null
    }
  },
  data() {
    return {

      selectedWalletId: null,
      selectedWalletAddress: null,
      depositAmount: 0,
      uploadedImages: [],
      previewImages: [],
      isUploading: false,
      transactionHistories: [],
      wallets: [],
      selectedNetwork: ''
    };
  },
  computed: {
    selectedWallet() {
      return this.wallets.find(wallet => wallet.cryptocurrency._id === this.selectedWalletId);
    },
    truncatedWalletAddress() {
      const address = this.selectedWalletAddress.address;
      const screenWidth = window.innerWidth;if (screenWidth < 576) {
        const firstTenChars = address.slice(0, 10);
        const lastThreeChars = address.slice(-3);
        return firstTenChars + '...' + lastThreeChars;
      } else {
        return address;
      }
    }},
  methods: {
    setDefaultWallet() {
      const usdtWallet = this.wallets.find(wallet => wallet.cryptocurrency.cryptocurrency_name === 'USDT');
      if (usdtWallet) {
        this.selectedWalletId = usdtWallet.cryptocurrency._id;
      } else if (this.wallets.length > 0) {
        this.selectedWalletId = this.wallets[0].cryptocurrency._id;
      }
    },

    async fetchWallets() {
      try {
        const response = await Api.get('/api/wallets');
        this.wallets = response.data.wallets;
      } catch (error) {
        console.error('Error fetching wallets:', error);
        if(error.response && error.response.data) {
          Notify.error(null,error.response.data.error);
        }else{
          Notify.error()
        }
      }
    },
    async fetchWalletAddress() {
      try {
        const response = await Api.get(`/api/wallets/wallet-address-receive/${this.selectedWalletId}/${this.selectedNetwork}`);
        this.selectedWalletAddress = response.data;
      } catch (error) {
        this.selectedWalletAddress = null;
        if(error.response && error.response.data) {
          Notify.error(null,error.response.data.error);
        }else{
          Notify.error()
        }
        console.error('Error fetching wallet address:', error);
      }
    },
    async confirmDeposit() {
      try {
        if(this.depositAmount <= 0){Notify.error(null,'Số tiền nạp phải lớn hơn 0')
          return
        }
        if(this.uploadedImages.length === 0){
          Notify.error(null,'Vui lòng tải lên hình ảnh xác nhận đã chuyển tiền thành công.')
          return
        }
        if(!this.selectedWalletAddress){
          Notify.error(null,'Vui lòng chọn một mạng lưới.')
          return
        }
        if(!this.selectedWalletAddress.address){
          Notify.error(null,'Đã có sự cố xảy ra, vui lòng liên hệ CSKH để được hỗ trợ.')
          return
        }
        this.isUploading = true;
        const formData = new FormData();

        formData.append('cryptocurrency', this.selectedWalletId);
        formData.append('receiver_wallet_address', this.selectedWalletAddress.address);
        formData.append('transaction_network', this.selectedWalletAddress.network.id);
        formData.append('transaction_amount', this.depositAmount);

        for (let i = 0; i < this.uploadedImages.length; i++) {
          formData.append('transaction_images', this.uploadedImages[i]);
        }

        const response = await Api.post('/api/transactions/deposit', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        Notify.success(null,response.data.message)

        // Reset form fields
        this.selectedWalletId = null;
        this.selectedNetwork = '';
        this.selectedWalletAddress = null;
        this.depositAmount = 0;
        this.uploadedImages = [];
        this.previewImages = [];
        this.$emit('done-deposit')
      } catch (error) {
        console.error('Error confirming deposit:', error);
        if(error.response && error.response.data) {
          Notify.error(null,error.response.data.error);
        }else{
          Notify.error()
        }
      }finally
      {
        this.isUploading = false;
      }
    },
    copyWalletAddress() {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(this.selectedWalletAddress.address)
            .then(() => {
              Notify.success(null,'Đã sao chép địa chỉ ví.');
            })
            .catch((error) => {
              Notify.error(null,'Lỗi khi sao chép địa chỉ ví.');
              console.error('Error copying wallet address:', error);
            });
      } else {
        // Fallback để sao chép địa chỉ ví nếu Clipboard API không khả dụng
        try {
          let tempInput = document.createElement('input');
          tempInput.value = this.selectedWalletAddress.address;
          document.body.appendChild(tempInput);
          tempInput.select();
          document.execCommand('copy');
          document.body.removeChild(tempInput);
          Notify.success(null,'Đã sao chép địa chỉ ví.');
        } catch (error) {
          Notify.error(null,'Lỗi khi sao chép địa chỉ ví.');
          console.error('Error copying wallet address:', error);
        }
      }
    },
    handleImageUpload(event) {
      const files = event.target.files;
      for (let i = 0; i < files.length; i++) {
        this.uploadedImages.push(files[i]);
        const reader = new FileReader();
        reader.onload = (e) => {
          this.previewImages.push(e.target.result);
        };
        reader.readAsDataURL(files[i]);
      }
    },
    removeImage(index) {
      this.uploadedImages.splice(index, 1);
      this.previewImages.splice(index, 1);
    }},
  mounted() {
    this.fetchWallets()
  },
  watch: {
    cryptoIdSelected: {
      handler(newVal) {
        if(newVal){
          this.selectedWalletId = newVal
        }else{
          this.selectedWalletId = 0
        }
      },
      immediate: true
    },
    selectedWallet: {
      handler(newVal) {
        if(newVal && newVal.deposit_default_address_enabled){
          const selectedNetwork = this.networks.find(item => {
            return item.id === newVal.deposit_network
          })
          this.selectedWalletAddress = {
            address: newVal.deposit_address,
            network:selectedNetwork,
          }
        }
      },
      immediate: true
    },
    selectedWalletId(newValue) {
      if (newValue) {
        this.selectedNetwork = '';
        this.selectedWalletAddress = null;
      }
    },
    selectedNetwork(newValue) {
      if (newValue) {
        this.fetchWalletAddress();
      } else {
        this.selectedWalletAddress = null;
      }
    },
    wallets(newValue) {
      if (newValue.length > 0) {
        this.setDefaultWallet();
      }
    },
  }
};
</script>