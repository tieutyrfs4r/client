const mix = require('laravel-mix');
mix.setPublicPath('public')


mix.copy('views/assets','public/assets')
mix.copy('views/front','public/front')
mix.copy('views/logo','public/assets/images')
mix.copy('views/logo','public/front/images')
mix.js('views/resources/market/vue/index.js','public/assets/js/market.js').vue()
mix.js('views/resources/dashboard/vue/index.js','public/assets/js/dashboard.js').vue()
mix.js('views/resources/wallet/vue/index.js','public/assets/js/wallet.js').vue()
mix.js('views/resources/with-draw/vue/index.js','public/assets/js/with-draw.js').vue()
mix.js('views/resources/deposit/vue/index.js','public/assets/js/deposit.js').vue()
mix.js('views/resources/profile/vue/index.js','public/assets/js/profile.js').vue()
mix.js('views/resources/transaction/vue/index.js','public/assets/js/transaction.js').vue()
mix.js('views/resources/local-bank-account/vue/index.js','public/assets/js/local-bank-account.js').vue()
mix.js('views/resources/wallet-address/vue/index.js','public/assets/js/wallet-address.js').vue()
mix.js('views/resources/signup/vue/index.js','public/assets/js/signup.js').vue()
mix.js('views/resources/login/vue/index.js','public/assets/js/login.js').vue()
mix.js('views/resources/reset-password/vue/index.js','public/assets/js/reset-password.js').vue()
mix.js('views/resources/identification/vue/index.js','public/assets/js/identification.js').vue()