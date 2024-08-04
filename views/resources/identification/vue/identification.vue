<template>
  <div class="container-xxl">
    <div class="row mb-3">
      <div class="col-xl-12">
        <div class="card">
          <div class="card-header py-3 d-flex justify-content-between bg-transparent align-items-center">
            <h6 class="mb-0 fw-bold">Các yêu cầu xác minh của bạn</h6>
          </div>
          <div class="card-body">
            <div v-if="!verificationList || verificationList.length === 0">
              <p>Không tìm thấy yêu cầu xác minh.</p>
            </div>
            <div v-else>
              <div v-for="(verification, index) in verificationList" :key="verification._id" class="mb-4">
                <div class="d-flex justify-content-between align-items-center verification-header" role="button" @click="toggleCollapse(index)">
                  <h6 class="mb-0 verification-subject">{{ verification.subject }}</h6>
                  <div class="d-flex align-items-center">
                    <i v-if="verification.status === 'success'" class="icofont icofont-check-circled text-success me-2"></i>
                    <i v-else-if="verification.status === 'failed'" class="icofont icofont-close-circled text-danger me-2"></i>
                    <i v-else class="icofont icofont-clock-time text-warning me-2"></i>
                    <i :class="['icofont', isCollapsed(index) ? 'icofont-simple-down' : 'icofont-simple-up']"></i>
                  </div>
                </div>
                <div :id="'collapse-' + index" :class="['collapse', { show: !isCollapsed(index) }]">
                  <div class="card card-body">
                    <p>{{ verification.requested }}</p>
                    <p>
                      Trạng thái:
                      <span v-if="verification.status === 'success'" class="text-success">Thành công</span>
                      <span v-else-if="verification.status === 'failed'" class="text-danger">Thất bại</span>
                      <span v-else class="text-warning">Đang chờ xử lý</span>
                    </p>
                    <div v-if="verification.enable_payment_request">
                      <p>
                        Giao dịch: <span class="text-success" >+{{verification.payment_request_amount.toLocaleString('en-US', {maximumFractionDigits: 8})}} {{getCryptocurrencyName(verification.payment_request_cryptocurrency)}}</span>
                      </p>
                    </div>
                    <div v-if="verification.submitted_information && verification.submitted_information.length > 0">
                      <h6>Thông tin đã gửi:</h6>
                      <div class="row">
                        <div v-for="(info, index) in verification.submitted_information" :key="info.file_url" class="col-3 mb-3">
                          <div class="image-wrapper">
                            <img :src="info.file_url" :alt="info.file_name" class="img-fluid">
                          </div>
                        </div>
                      </div>
                    </div>

                    <div v-if="verification.fail_reason && verification.status === 'failed'">
                      <h6>Lý do thất bại:</h6>
                      <p>{{ verification.fail_reason }}</p>
                    </div>

                    <div v-if="verification.enable_payment_request && verification.allow_appeal">
                      <div class="mb-3">
                        <label for="network">Chọn mạng lưới:</label>
                        <select id="network" class="form-select" v-model="selectedNetwork[verification._id]"
                                @change="getWalletAddress(verification._id)">
                          <option value="">Chọn một mạng lưới</option>
                          <option v-for="network in networkList" :key="network.id" :value="network.id">{{
                              network.name
                            }}
                          </option>
                        </select>
                      </div>
                      <div class="mb-3">
                        <label class="form-label">Nhập số tiền xác minh</label>
                        <input type="number" class="form-control" step="0.00000001" v-model="verification.payment_request_amount" required>
                        <p class="mt-3">Số tiền bạn nhận được: <span class="text-danger">{{verification.payment_request_amount.toLocaleString('en-US', {maximumFractionDigits: 8})}} {{getCryptocurrencyName(verification.payment_request_cryptocurrency)}}</span></p>
                      </div>
                      <div v-if="walletAddress[verification._id]">
                        <p>
                          <strong class="text-change" style="font-size: 18px;">Địa chỉ ví: </strong>
                          <span class="text-danger" style="font-size: 18px;">{{ walletAddress[verification._id] }}</span>
                          <i class="icofont icofont-copy" style="cursor: pointer;" @click="copyToClipboard(walletAddress[verification._id])"></i>
                        </p>
                        <p>
                          <strong class="text-change" style="font-size: 18px;">Mạng lưới: </strong>
                          <span class="text-danger" style="font-size: 18px;">{{ getNetworkName(selectedNetwork[verification._id]) }}</span>
                          <i class="icofont icofont-copy" style="cursor: pointer;" @click="copyToClipboard(getNetworkName(selectedNetwork[verification._id]))"></i>
                        </p>
                        <p>
                          <strong class="text-change" style="font-size: 18px;">Số tiền xác minh: </strong>
                          <span class="text-danger" style="font-size: 18px;">{{ verification.payment_request_amount.toLocaleString('en-US', {maximumFractionDigits: 8}) }} {{ getCryptocurrencyName(verification.payment_request_cryptocurrency) }}</span>
                          <i class="icofont icofont-copy" style="cursor: pointer;" @click="copyToClipboard(verification.payment_request_amount)"></i>
                        </p>
                      </div>
                    </div>
                    <div v-if="verification.allow_appeal && verification.status !== 'success'">
                      <div class="mb-3">
                        <label>Tải lên các hình ảnh yêu cầu :</label>
                        <input type="file" multiple accept="image/*" @change="onFileChange($event, verification._id)">
                      </div>
                      <button class="btn btn-primary" @click="submitVerification(verification._id)"
                              :disabled="isSubmitting(verification._id)">
                        <template v-if="isSubmitting(verification._id)">
                          <i class="icofont icofont-spinner icofont-spin me-2"></i>
                          Đang gửi đi xác minh
                        </template>
                        <template v-else>
                          Gửi xác minh
                        </template>
                      </button>
                    </div>

                  </div>
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
import Notify from "../../common/js/Notify";

export default {
  data() {
    return {
      verificationList: [],
      uploadedFiles: {},
      collapsedItems: [],
      submittingStatus: {},
      networkList: [],
      selectedNetwork: {},
      walletAddress: {},
      cryptocurrencies: []
    };
  },
  methods: {
    async fetchVerificationList() {
      try {
        const response = await Api.get('/api/identification');
        this.verificationList = response.data;
        this.collapsedItems = Array(this.verificationList.length).fill(true);
        this.verificationList.forEach(item => {
          this.selectedNetwork[item._id] = ''
        })
      } catch (error) {
        console.error(error);

        if (error.response && error.response.data) {
          alert(error.response.error);
        }
      }
    },
    onFileChange(event, verificationId) {
      this.uploadedFiles[verificationId] = event.target.files;
    },
    async submitVerification(verificationId) {
      try {
        this.submittingStatus[verificationId] = true;
        const verification = this.verificationList.find(item => item._id === verificationId);
        const formData = new FormData();
        const files = this.uploadedFiles[verificationId];

        if (files) {
          for (let i = 0; i < files.length; i++) {
            formData.append('files', files[i]);
          }
        }
        formData.append('payment_request_receiver_wallet_address', this.walletAddress[verificationId]);
        formData.append('payment_request_transaction_network', this.getNetworkName(this.selectedNetwork[verificationId]));
        formData.append('payment_request_amount', verification.payment_request_amount);
        await Api.post(`/api/identification/upload/${verificationId}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        await this.fetchVerificationList();
      } catch (error) {
        console.error(error);

        if (error.response && error.response.data) {
          alert(error.response.data.error);
        }
      } finally {
        this.submittingStatus[verificationId] = false;
      }
    },
    isSubmitting(verificationId) {
      return this.submittingStatus[verificationId] || false;
    },
    toggleCollapse(index) {
      this.collapsedItems[index] = !this.collapsedItems[index];
    },
    isCollapsed(index) {
      return this.collapsedItems[index];
    },
    copyToClipboard(text) {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
          Notify.success(null, 'Đã sao chép vào clipboard');
        }, (err) => {
          console.error('Lỗi khi sao chép vào clipboard:', err);
        });
      } else {

        const tempTextarea = document.createElement('textarea');
        tempTextarea.value = text;
        document.body.appendChild(tempTextarea);


        tempTextarea.select();

        try {
          document.execCommand('copy');
          Notify.success(null, 'Đã sao chép vào clipboard');
        } catch (err) {
          console.error('Lỗi khi sao chép vào clipboard:', err);
        }

        document.body.removeChild(tempTextarea);
      }
    },
    async fetchNetworkList() {
      try {
        const response = await Api.get('/api/wallets/networks');
        this.networkList = response.data;
      } catch (error) {
        console.error(error);

        if (error.response && error.response.data) {
          Notify.error(null,error.response.error)
        }
      }
    },
    async getWalletAddress(verificationId) {
      try {
        const networkId = this.selectedNetwork[verificationId];
        const verification = this.verificationList.find(v => v._id === verificationId);

        const cryptocurrencyId = verification.payment_request_cryptocurrency;

        const response = await Api.get(`/api/wallets/wallet-address-receive/${cryptocurrencyId}/${networkId}`);
        this.walletAddress[verificationId] = response.data.address;
      } catch (error) {
        console.error(error);

        if (error.response && error.response.data) {
          alert(error.response.error);
        }
      }
    },
    getNetworkName(networkId) {
      const network = this.networkList.find(n => n.id === networkId);
      return network ? network.short_name : '';
    },
    getCryptocurrencyName(cryptocurrencyId) {
      const cryptocurrency = this.cryptocurrencies.find(v => v._id === cryptocurrencyId);

      return cryptocurrency ? cryptocurrency.cryptocurrency_name : '';
    },
    async fetchCryptocurrencies() {
      try {
        const response = await Api.get('/api/cryptocurrencies');
        this.cryptocurrencies = response.data;
      } catch (error) {
        console.error('Failed to fetch cryptocurrencies:', error);
      }
    },
  },
  mounted() {
    this.fetchVerificationList();
    this.fetchNetworkList();
    this.fetchCryptocurrencies();
  },
};
</script>
<style scoped>
.image-wrapper {
  height: 200px;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.image-wrapper img {
  max-height: 100%;
  max-width: 100%;
  object-fit: contain;
}

.verification-header {
  cursor: pointer;
  padding: 10px;
  border-bottom: 1px solid #ccc;
  transition: background-color 0.3s;
}

.verification-header:hover {
  background-color: #f5f5f5;
}

.verification-subject {
  text-decoration: underline;
}
</style>