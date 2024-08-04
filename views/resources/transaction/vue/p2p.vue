<template>
  <div class="mt-3 text-end">
    <ul class="nav nav-pills rounded d-inline-flex justify-content-end" role="tablist">
      <li class="nav-item"><a class="nav-link active" data-bs-toggle="tab" href="#buy-p2p" role="tab">Mua P2P</a></li>
      <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#sell-p2p" role="tab">Bán P2P</a></li>
    </ul>

    <div class="tab-content mt-3" >
      <div class="tab-pane fade show active" id="buy-p2p">
        <div class="card no-bg">
          <div class="card-header py-3 d-flex justify-content-between bg-transparent border-bottom-0 align-items-center flex-wrap">
            <h6 class="mb-0 fw-bold">P2P Mua</h6>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table id="p2pone" class="priceTable table table-hover custom-table table-bordered align-middle mb-0" style="width:100%">
                <thead>
                <tr>
                  <th>Người bán</th>
                  <th>Giá bán</th>
                  <th>Giới hạn/Có sẵn</th>
                  <th>Phương thức thanh toán</th>
                  <th>Thao tác</th>
                </tr>
                </thead>
                <tbody>
                <tr v-for="(adv, index) in buyAdvs" :key="index">
                  <td>
                    <div class="d-flex align-items-center">
                      <div class="avatar xs rounded-circle no-thumbnail">{{ adv.advertiser.nickName.charAt(0) }}</div>
                      <span class="mx-1 fs-6">{{ adv.advertiser.nickName }}</span>
                      <i class="icofont-badge fs-5 text-warning" v-if="adv.advertiser.userIdentity === 'BLOCK_MERCHANT'"></i>
                    </div>
                    <div class="d-flex align-items-center">
                      <span class="text-muted small mx-1">{{ parseFloat(adv.advertiser.monthOrderCount).toLocaleString('en-US', {maximumFractionDigits: 8}) }} giao dịch</span>
                      <span class="text-muted small mx-1">{{ (parseFloat(adv.advertiser.monthFinishRate) * 100).toFixed(2) }}% hoàn thành</span>
                    </div>
                  </td>
                  <td>
                    <div class="d-flex align-items-center">
                      <span>{{ parseFloat(adv.adv.price).toLocaleString('en-US', {maximumFractionDigits: 8}) }} <small class="text-muted small">VND</small></span>
                    </div>
                  </td>
                  <td>
                    <div class="d-flex align-items-center">
                      <span class="text-muted small mx-1 min-width-5">Có sẵn</span>
                      <span class="mx-1">{{ parseFloat(adv.adv.surplusAmount).toLocaleString('en-US', {maximumFractionDigits: 8}) }} USDT</span>
                    </div>
                    <div class="d-flex align-items-center">
                      <span class="text-muted small mx-1 min-width-55">Khoảng tiền</span>
                      <span class="mx-1">{{ parseFloat(adv.adv.minSingleTransAmount).toLocaleString('en-US', {maximumFractionDigits: 8}) }} VND - {{ parseFloat(adv.adv.maxSingleTransAmount).toLocaleString('en-US', {maximumFractionDigits: 8}) }} VND</span>
                    </div>
                  </td>
                  <td>
                    <span class="badge bg-light text-dark mx-1">Chuyển khoản ngân hàng</span>
                  </td>
                  <td>
                    <a href="#" @click="buyUsdt" title="" class="text-info px-3">Mua USDT</a>
                  </td>
                </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="card-footer">
            <nav>
              <ul class="pagination justify-content-center">
                <li class="page-item" :class="{ disabled: buyPagination.currentPage === 1 }">
                  <a class="page-link" @click.prevent="changeBuyPage(buyPagination.currentPage - 1)" href="#">Trước</a>
                </li>
                <li class="page-item" v-for="page in buyPagination.totalPages" :key="page" :class="{ active: page === buyPagination.currentPage }">
                  <a class="page-link" @click.prevent="changeBuyPage(page)" href="#">{{ page }}</a>
                </li>
                <li class="page-item" :class="{ disabled: buyPagination.currentPage === buyPagination.totalPages }">
                  <a class="page-link" @click.prevent="changeBuyPage(buyPagination.currentPage + 1)" href="#">Sau</a>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
      <div class="tab-pane fade" id="sell-p2p">
        <div class="card no-bg">
          <div class="card-header py-3 d-flex justify-content-between bg-transparent border-bottom-0 align-items-center flex-wrap">
            <h6 class="mb-0 fw-bold">P2P Bán</h6>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="priceTable table table-hover custom-table table-bordered align-middle mb-0" style="width:100%">
                <thead>
                <tr>
                  <th>Người mua</th>
                  <th>Giá mua</th>
                  <th>Giới hạn/Có sẵn</th>
                  <th>Phương thức thanh toán</th>
                  <th>Thao tác</th>
                </tr>
                </thead>
                <tbody>
                <tr v-for="(adv, index) in sellAdvs" :key="index">
                  <td>
                    <div class="d-flex align-items-center">
                      <div class="avatar xs rounded-circle no-thumbnail">{{ adv.advertiser.nickName.charAt(0) }}</div>
                      <span class="mx-1 fs-6">{{ adv.advertiser.nickName }}</span>
                      <i class="icofont-badge fs-5 text-warning" v-if="adv.advertiser.userIdentity === 'BLOCK_MERCHANT'"></i>
                    </div>
                    <div class="d-flex align-items-center">
                      <span class="text-muted small mx-1">{{ parseFloat(adv.advertiser.monthOrderCount).toLocaleString('en-US', {maximumFractionDigits: 8}) }} giao dịch</span>
                      <span class="text-muted small mx-1">{{ (parseFloat(adv.advertiser.monthFinishRate) * 100).toFixed(2) }}% hoàn thành</span>
                    </div>
                  </td>
                  <td>
                    <div class="d-flex align-items-center">
                      <span>{{ parseFloat(adv.adv.price).toLocaleString('en-US', {maximumFractionDigits: 8}) }} <small class="text-muted small">VND</small></span>
                    </div>
                  </td>
                  <td>
                    <div class="d-flex align-items-center">
                      <span class="text-muted small mx-1 min-width-5">Mua tối đa</span>
                      <span class="mx-1">{{ parseFloat(adv.adv.surplusAmount).toLocaleString('en-US', {maximumFractionDigits: 8}) }} USDT</span>
                    </div>
                    <div class="d-flex align-items-center">
                      <span class="text-muted small mx-1 min-width-55">Khoảng tiền</span>
                      <span class="mx-1">{{ parseFloat(adv.adv.minSingleTransAmount).toLocaleString('en-US', {maximumFractionDigits: 8}) }} VND - {{ parseFloat(adv.adv.maxSingleTransAmount).toLocaleString('en-US', {maximumFractionDigits: 8}) }} VND</span>
                    </div>
                  </td>
                  <td>
                    <span class="badge bg-light text-dark mx-1">Chuyển khoản ngân hàng</span>
                  </td>
                  <td>
                    <a href="#" @click="sellUsdt" title="" class="text-info px-3">Bán USDT</a>
                  </td>
                </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="card-footer">
            <nav>
              <ul class="pagination justify-content-center">
                <li class="page-item" :class="{ disabled: sellPagination.currentPage === 1 }">
                  <a class="page-link" @click.prevent="changeSellPage(sellPagination.currentPage - 1)" href="#">Trước</a>
                </li>
                <li class="page-item" v-for="page in sellPagination.totalPages" :key="page" :class="{ active: page === sellPagination.currentPage }">
                  <a class="page-link" @click.prevent="changeSellPage(page)" href="#">{{ page }}</a>
                </li>
                <li class="page-item" :class="{ disabled: sellPagination.currentPage === sellPagination.totalPages }">
                  <a class="page-link" @click.prevent="changeSellPage(sellPagination.currentPage + 1)" href="#">Sau</a>
                </li>
              </ul>
            </nav>
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
      buyAdvs: [],
      sellAdvs: [],
      buyPagination: {
        currentPage: 1,
        totalPages: 1
      },
      sellPagination: {
        currentPage: 1,
        totalPages: 1
      },
    };
  },
  methods: {
    async getBuyAdvs(page = 1) {
      try {
        const response = await Api.post('/api/p2p/data', {
          page: page,
          rows: 10,
          type: 'Sell',
        });
        this.buyAdvs = response.data.data;
        this.buyPagination = {
          currentPage: page,
          totalPages: response.data.totalPages
        };
      } catch (e) {
        console.error(e);
      }
    },
    async getSellAdvs(page = 1) {
      try {
        const response = await Api.post('/api/p2p/data', {
          page: page,
          rows: 10,
          type: 'Buy',
        });
        this.sellAdvs = response.data.data;
        this.sellPagination = {
          currentPage: page,
          totalPages: response.data.totalPages
        };
      } catch (e) {
        console.error(e);
      }
    },
    changeBuyPage(page) {
      if (page < 1 || page > this.buyPagination.totalPages) return;
      this.getBuyAdvs(page);
    },
    changeSellPage(page) {
      if (page < 1 || page > this.sellPagination.totalPages) return;
      this.getSellAdvs(page);
    },
    async buyUsdt(){
      try{
        const response = await Api.post('/api/p2p/buy-usdt', {})
      }catch(error){
        console.log(error)
        if(error.response && error.response.data) {
          Notify.error(null,error.response.data.error);
        }else{
          Notify.error()
        }
      }
    },
    async sellUsdt(){
      try{
        const response = await Api.post('/api/p2p/sell-usdt', {})
      }catch(error){
        console.log(error)
        if(error.response && error.response.data) {
          Notify.error(null,error.response.data.error);
        }else{
          Notify.error()
        }
      }
    }
  },
  mounted() {
    this.getBuyAdvs();
    this.getSellAdvs();
  },
};
</script>
<style>
.pagination {
  display: flex;
  justify-content: center;
  padding: 1rem 0;
}
.page-item {
  margin: 0 0.25rem;
}
.page-item.disabled .page-link {
  pointer-events: none;
  opacity: 0.5;
}
.page-item.active .page-link {
  background-color: #007bff;
  border-color: #007bff;
  color: white;
}
</style>
