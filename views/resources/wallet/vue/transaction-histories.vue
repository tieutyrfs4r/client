<template>
  <div class="row g-3 mb-3 row-deck">
    <div class="col-xl-12">
      <div class="card">
        <div class="card-header py-3 d-flex justify-content-between">
          <h6 class="mb-0 fw-bold">Các giao dịch gần đây</h6>
        </div>
        <div class="card-body">
          <div class="table-responsive text-nowrap mb-3">
            <table class="priceTable table table-hover custom-table-2 table-bordered align-middle mb-0" style="width:100%">
              <thead>
              <tr>
                <th>Trạng thái</th>
                <th>Số lượng</th>
                <th>Loại tiền</th>
                <th>Loại giao dịch</th>
                <th>Trước giao dịch</th>
                <th>Sau giao dịch</th>
                <th>Thông tin thêm</th>
                <th>Ngày giờ</th>
              </tr>
              </thead>
              <tbody>
              <tr v-for="transaction in transactionHistories" :key="transaction.id">
                <td>
                  <span v-if="transaction.transaction_status === 'pending'" class="badge bg-warning text-dark">
                    <i class="bi bi-hourglass-split"></i> Đang chờ xử lý
                  </span>
                  <span v-else-if="transaction.transaction_status === 'success'" class="badge bg-success">
                    <i class="bi bi-check-circle-fill"></i> Thành công
                  </span>
                  <span v-else-if="transaction.transaction_status === 'failed'" class="badge bg-danger">
                    <i class="bi bi-x-circle-fill"></i> Thất bại
                  </span>
                  <span v-else-if="transaction.transaction_status === 'cancelled'" class="badge bg-secondary">
                    <i class="bi bi-x-octagon-fill"></i> Đã bị hủy
                  </span>
                </td>
                <td>{{ transaction.transaction_amount.toLocaleString('en-US', {maximumFractionDigits: 8}) }}</td>
                <td>
                  <template v-if="transaction.transaction_type !== 'withdraw-vnd'">
                    <img :src="transaction?.cryptocurrency?.img_url" alt="" class="img-fluid avatar mx-1">
                    {{ transaction?.cryptocurrency?.cryptocurrency_name }}
                  </template>
                  <template v-else>
                    <img src="https://uxwing.com/wp-content/themes/uxwing/download/e-commerce-currency-shopping/coin-vietnamese-dong-vnd-icon.png" alt="" class="img-fluid avatar mx-1">
                    VNĐ
                  </template>

                </td>
                <td>
                <span :class="getTransactionTypeClass(transaction.transaction_type)">
                  {{ getTransactionTypeLabel(transaction.transaction_type) }}
                </span>
                </td>

                <td>{{ transaction.balance_before_transaction?.toLocaleString('en-US', {maximumFractionDigits: 8}) }}</td>
                <td>{{ transaction.balance_after_transaction?.toLocaleString('en-US', {maximumFractionDigits: 8}) }}</td>

                <td>
                  {{transaction.failure_reason}}
                </td>
                <td>{{ formatDate(transaction.created_at) }}</td>
              </tr>
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script>
import moment from "moment";
export default {
  props: {
    transactionHistories: {
      type: Array,
      required: true
    }
  },

  methods: {

    formatDate(date) {
      return moment(date).format('DD/MM/YYYY HH:mm:ss')
    },
    getTransactionTypeClass(transactionType) {
      switch (transactionType) {
        case 'deposit':
          return 'color-price-up';
        case 'withdraw':
          return 'color-price-down';
        case 'buy':
          return 'color-price-up';
        case 'sell':
          return 'color-price-down';
        default:
          return '';
      }
    },
    getTransactionTypeLabel(transactionType) {
      switch (transactionType) {
        case 'deposit':
          return 'Nạp tiền';
        case 'withdraw':
          return 'Rút tiền';
        case 'sell':
          return 'Bán';
        case 'buy':
          return 'Mua';
        case 'exchange':
          return 'Quy đổi';
        case 'withdraw-vnd':
          return 'Rút VNĐ về ngân hàng địa phương';
        default:
          return 'Không rõ';
      }
    },
  }
}
</script>