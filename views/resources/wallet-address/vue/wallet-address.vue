<template>
  <div class="container-xxl">
    <div class="row g-3">
      <div class="col-12">
        <button type="button" class="btn btn-primary mb-3" @click="showModal(null)">Thêm địa chỉ ví</button>
        <div class="table-responsive">
          <table class="table align-middle table-bordered mb-0 custom-table-2">
            <thead>
            <tr>
              <th>Thao tác</th>
              <th>Biệt danh</th>
              <th>Loại tiền điện tử</th>
              <th>Địa chỉ ví</th>
              <th>Mạng lưới</th>

            </tr>
            </thead>
            <tbody>
            <tr v-for="(address, index) in userWalletAddresses" :key="address.id">
              <td>
                <button type="button" class="btn btn-info me-2 text-white" @click="showModal(address)">Sửa</button>
                <button type="button" class="btn btn-warning text-white" @click="showDeleteModal(address)">Xóa</button>
              </td>
              <td>{{ address.name }}</td>
              <td>{{ getCryptoName( address.cryptocurrency) }}</td>
              <td>
                <span class="badge bg-warning">{{ address.address }}</span>
              </td>
              <td>{{ getNetWorkName(address.network) }}</td>

            </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <div class="modal fade" id="addressModal" tabindex="-1" aria-labelledby="addressModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="addressModalLabel">{{ editAddress ? 'Sửa địa chỉ ví' : 'Thêm địa chỉ ví' }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form>
              <div class="mb-3">
                <label for="name" class="form-label">Biệt danh</label>
                <input type="text" class="form-control" id="name" v-model="address.name">
              </div>
              <div class="mb-3">
                <label for="cryptocurrency" class="form-label">Loại tiền điện tử</label>
                <select class="form-select" id="cryptocurrency" v-model="address.cryptocurrency">
                  <option value="">Chọn loại tiền điện tử</option>
                  <option v-for="crypto in cryptocurrencies" :value="crypto._id" :key="crypto._id">{{ crypto.cryptocurrency_name }}</option>
                </select>
              </div>
              <div class="mb-3">
                <label for="network" class="form-label">Mạng lưới</label>
                <select class="form-select" id="network" v-model="address.network">
                  <option value="">Chọn mạng lưới</option>
                  <option v-for="network in networks" :value="network.id" :key="network.id">{{ network.name }} ({{network.short_name}})</option>
                </select>
              </div>
              <div class="mb-3">
                <label for="address" class="form-label">Địa chỉ ví</label>
                <input type="text" class="form-control" id="address" v-model="address.address">
              </div>

            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
            <button type="button" class="btn btn-primary" @click="saveAddress">{{ editAddress ? 'Lưu' : 'Thêm' }}</button>
          </div>
        </div>
      </div>
    </div>
    <div class="modal fade" id="deleteModal" tabindex="-1" aria-labelledby="deleteModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="deleteModalLabel">Xóa địa chỉ ví</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <p>Bạn có chắc chắn muốn xóa địa chỉ ví này?</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
            <button type="button" class="btn btn-danger" @click="deleteAddress">Xóa</button>
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
      userWalletAddresses: [],
      address: {
        cryptocurrency: '',
        address: '',
        network: ''
      },
      editAddress: null,
      cryptocurrencies: [],
      networks: []
    };
  },
  methods: {
    showModal(address) {
      if (address) {
        this.editAddress = {
          ...address
        };
        this.address = {
          ...address
        };
      } else {
        this.editAddress = null;
        this.address = {
          cryptocurrency: '',
          name: '',
          address: '',
          network: ''
        };
      }
      $('#addressModal').modal('show');
    },
    showDeleteModal(address) {
      this.editAddress = address;
      $('#deleteModal').modal('show');
    },
    async fetchUserWalletAddresses() {
      try {
        const response = await Api.get('/api/wallet-addresses');
        this.userWalletAddresses = response.data;
      } catch (error) {
        console.log(error)
        Notify.error()
      }
    },
    async fetchCryptocurrencies() {
      try {
        const response = await Api.get('/api/wallets');
        const wallets = response.data.wallets;
        this.cryptocurrencies = []
        wallets.forEach(wallet => {
          this.cryptocurrencies.push(wallet.cryptocurrency)
        })
      } catch (error) {
        console.log(error)
        Notify.error()
      }
    },
    async fetchNetworks() {
      try {
        const response = await Api.get('/api/wallets/networks');
        this.networks = response.data;
      } catch (error) {
        console.log(error)
        Notify.error()
      }
    },
    async saveAddress() {
      try {
        if (this.editAddress) {
          await Api.put(`/api/wallet-addresses/${this.editAddress._id}`, this.address);
        } else {
          await Api.post('/api/wallet-addresses', this.address);
        }
        $('#addressModal').modal('hide');
        await this.fetchUserWalletAddresses();
        Notify.success();
      } catch (error) {
        console.error(error);
        if (error.response && error.response.data) {
          Notify.error(null, error.response.data.error);
        } else {
          Notify.error();
        }
      }
    },
    async deleteAddress() {
      try {
        await Api.delete(`/api/wallet-addresses/${this.editAddress._id}`);
        $('#deleteModal').modal('hide');
        await this.fetchUserWalletAddresses();
      } catch (error) {
        console.error(error);
        if (error.response && error.response.data) {
          Notify.error(null, error.response.data.error);
        } else {
          Notify.error();
        }
      }
    },
    getCryptoName(cryptoId){
      const cryptocurrency = this.cryptocurrencies.find(item => (item._id === cryptoId));
      return cryptocurrency ? cryptocurrency.cryptocurrency_name : ''
    },
    getNetWorkName(networkId){
      const network = this.networks.find(item => (item.id === networkId));
      return network ? network.name : ''
    }
  },
  mounted() {
    this.fetchUserWalletAddresses();
    this.fetchCryptocurrencies();
    this.fetchNetworks();
  }
};
</script>