<template>
  <div class="toast-container position-fixed top-0 end-0 p-3" style="z-index: 99999" data-bs-autohide="true" :data-bs-delay="duration">
    <div :id="toastId" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="toast-header" :class="toastClass">
        <i class="bx me-2" :class="iconClass"></i>
        <strong class="me-auto">{{ toastTitle }}</strong>
        <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
      <div class="toast-body">
        {{ toastMessage }}
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      toastId: '',
      toastType: '',
      toastTitle: '',
      toastMessage: '',
      duration: 5000
    };
  },
  computed: {
    toastClass() {
      return this.toastType === 'success' ? 'bg-success text-white' : 'bg-warning text-white';
    },
    iconClass() {
      return this.toastType === 'success' ? 'bx-check-circle' : 'bx-x-circle';
    }
  },
  methods: {
    showNotify(type, title, message,duration = 5000) {

      this.toastId = 'toast-' + Math.random().toString(36).substring(7);
      this.toastType = type;
      this.toastTitle = title;
      this.duration = duration
      if(!title){
        if(type === 'success'){
          this.toastTitle = 'Thành công'
        }
        if(type === 'error'){
          this.toastTitle = 'Thất bại'
        }
      }
      this.toastMessage = message;
      if(!message){
        if(type === 'success'){
          this.toastMessage = 'Thao tác thành công'
        }
        if(type === 'error'){
          this.toastMessage = 'Thao tác thất bại'
        }
      }
      this.$nextTick(() => {
        const toast = new bootstrap.Toast(document.getElementById(this.toastId));
        toast._config.delay = this.duration
        toast.show();
      });
    }
  }
};
</script>