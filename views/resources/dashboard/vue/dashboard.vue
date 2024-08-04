<template>
  <div class="container-xxl">

    <wallet-user />
    <market/>
  </div>
</template>

<script>
import WalletUser from "./wallet-user.vue";
import Market from "./market.vue";
import Info from "./info.vue";

export default {
  components: {Info, Market, WalletUser}
}
</script>