<template>
  <div class="container-xxl">
    <div class="row g-3">
      <div class="col-12">
        <button type="button" class="btn btn-primary mb-3" @click="showModal(null)">Thêm tài khoản</button>
        <div class="table-responsive">
          <table class="table align-middle table-bordered mb-0 custom-table-2">
            <thead>
            <tr>
              <th>Thao tác</th>
              <th>Tên tài khoản</th>
              <th>Tên người hưởng thụ</th>
              <th>Tên ngân hàng</th>
              <th>Số tài khoản ngân hàng</th>
              <th>Chi nhánh</th>

            </tr>
            </thead>
            <tbody>
            <tr v-for="(account, index) in localBankAccounts" :key="account.id">
              <td>
                <button type="button" class="btn btn-info me-2 text-white" @click="showModal(account)">Sửa</button>
                <button type="button" class="btn btn-warning text-white" @click="showDeleteModal(account)">Xóa</button>
              </td>
              <td>{{ account.name }}</td>
              <td><span class="badge bg-info">{{ account.account_name }}</span></td>
              <td>{{ account.bank_name }}</td>
              <td>{{ account.account_number }}</td>
              <td>{{ account.branch_name }}</td>

            </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>


    <div class="modal fade" id="accountModal" tabindex="-1" aria-labelledby="accountModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="accountModalLabel">{{ editAccount ? 'Sửa tài khoản' : 'Thêm tài khoản' }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form>
              <div class="mb-3">
                <label for="name" class="form-label">Tên tài khoản</label>
                <input type="text" class="form-control" id="name" v-model="account.name">
              </div>
              <div class="mb-3">
                <label for="account_name" class="form-label">Tên người hưởng thụ</label>
                <input type="text" class="form-control" id="account_name" v-model="account.account_name">
              </div>
              <div class="mb-3">
                <label for="bank_name" class="form-label">Tên ngân hàng</label>
                <select class="form-select" id="bank_name" v-model="account.bank_name">
                  <option value="">Chọn ngân hàng</option>
                  <option v-for="bank in banks" :value="bank.shortName" :key="bank.id">{{ bank.shortName }}</option>
                </select>
              </div>
              <div class="mb-3">
                <label for="account_number" class="form-label">Số tài khoản ngân hàng</label>
                <input type="text" class="form-control" id="account_number" v-model="account.account_number">
              </div>
              <div class="mb-3">
                <label for="branch_name" class="form-label">Chi nhánh</label>
                <input type="text" class="form-control" id="branch_name" v-model="account.branch_name">
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary " data-bs-dismiss="modal">Đóng</button>
            <button type="button" class="btn btn-primary" @click="saveAccount">{{ editAccount ? 'Lưu' : 'Thêm' }}</button>
          </div>
        </div>
      </div>
    </div>


    <div class="modal fade" id="deleteModal" tabindex="-1" aria-labelledby="deleteModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="deleteModalLabel">Xóa tài khoản</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <p>Bạn có chắc chắn muốn xóa tài khoản này?</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary " data-bs-dismiss="modal">Đóng</button>
            <button type="button" class="btn btn-danger" @click="deleteAccount">Xóa</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import Api from "../../common/js/Api";
import axios from "axios";
import Notify from "../../common/js/Notify";

export default {
  data() {
    return {
      localBankAccounts: [],
      account: {
        name: '',
        account_name: '',
        bank_name: '',
        account_number: '',
        branch_name: '',
        banks: []
      },
      editAccount: null
    };
  },
  methods: {
    showModal(account) {
      if (account) {
        this.editAccount = { ...account };
        this.account = { ...account };
      } else {
        this.editAccount = null;
        this.account = {
          name: '',
          account_name: '',
          bank_name: '',
          account_number: '',
          branch_name: ''
        };
      }
      $('#accountModal').modal('show');
    },
    showDeleteModal(account) {
      this.editAccount = account;
      $('#deleteModal').modal('show');
    },
    async fetchLocalBankAccounts() {
      try {
        const response = await Api.get('/api/local-bank-accounts');
        this.localBankAccounts = response.data;
      } catch (error) {
        console.error(error);
      }
    },
    async saveAccount() {
      try {
        if (this.editAccount) {
          await Api.put(`/api/local-bank-accounts/${this.editAccount._id}`, this.account);
        } else {
          await Api.post('/api/local-bank-accounts', this.account);
        }
        $('#accountModal').modal('hide');
        await this.fetchLocalBankAccounts();
        Notify.success()
      } catch (error) {
        console.error(error);
        if(error.response && error.response.data) {
          Notify.error(null,error.response.data.error);
        }else{
          Notify.error()
        }
      }
    },
    async fetchBanks() {
      try {
        const response = await axios.get('https://api.vietqr.io/v2/banks');
        this.banks = response.data.data;
      } catch (error) {
        console.error(error);
      }
    },
    async deleteAccount() {
      try {
        await Api.delete(`/api/local-bank-accounts/${this.editAccount._id}`);
        $('#deleteModal').modal('hide');
        await this.fetchLocalBankAccounts();
      } catch (error) {
        console.error(error);
      }
    }
  },
  mounted() {
    this.fetchLocalBankAccounts();
    this.fetchBanks();
  }
};
</script>