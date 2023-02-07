<template>
    <q-layout view="hhh lpR fFf">
      <q-header
        class="bg-white shadow-6 flex flex-center"
        style="color: #190f70; font-size: 0.8em;"
      >
        <q-toolbar dense>
          <!-- <q-btn flat round dense icon="apps"
            @click="rightDrawerOpen = !rightDrawerOpen" class="q-mr-md"
            ><q-tooltip content-class="bg-indigo-10" :offset="[10, 10]">
              Menu
            </q-tooltip></q-btn
          > -->
            <q-space></q-space>
            <q-select
              filled
              bg-color="indigo-1"
              color="indigo-10"
              v-model="setCabang"
              :options="cabGrup"
              option-label="namaCabang"
              option-value="kodeCab"
              options-dense
              dense
              label="Set Cabang *"
              emit-value
              map-options
              @input="setCB(setCabang)"
              style="width:300px"
              class="q-ml-xl q-mr-md "
            />
          <!-- <q-btn flat round dense color="red-9" icon="date_range" class="q-mr-lg">
            <q-tooltip content-class="bg-indigo-10">Atur Periode</q-tooltip>
            <q-menu>
              <div class="row no-wrap q-pa-xl">
                <div class="column">
                  <div class="text-5">Tanggal :</div>
                </div>
              </div>
            </q-menu>
          </q-btn> -->
  
          <q-btn flat round dense color="purple-10" icon="account_circle">
            <q-tooltip content-class="bg-indigo-10" :offset="[10, 10]">
              {{ $store.state.auth.user.nama }}
            </q-tooltip>
            <q-menu>
              <div class="row no-wrap q-pa-md">
                <div class="column  items-center col-6">
                  <div class="text-h6 q-mb-md">Change Password</div>
                  <q-form ref="form" @submit="uppass(u)" class="q-gutter-md">
                    <q-input
                      dense
                      v-model="u.pass"
                      :rules="rules.required"
                      label="password"
                      type="password"
                    />
                    <q-input
                      dense
                      v-model="u.password"
                      :rules="rules.cek"
                      label="retype password"
                      type="password"
                    />
                    <q-btn dense type="submit" label="update" />
                  </q-form>
                </div>
                <q-separator vertical inset class="q-mx-sm" />
  
                <div class="column items-center">
                  <q-avatar size="72px">
                    <img src="https://cdn.quasar.dev/img/boy-avatar.png" />
                  </q-avatar>
  
                  <div class="text-subtitle1 q-mt-md q-mb-md">
                    {{ $store.state.auth.user.nama || "" }}
                  </div>
                  <div class="text-caption q-mb-lg text-center">
                    {{ $store.state.auth.user.namaCabang }}
                  </div>
  
                  <q-btn
                    color="red"
                    label="Logout"
                    push
                    size="sm"
                    v-close-popup
                    @click="logout"
                  />
                </div>
              </div>
            </q-menu>
          </q-btn>
         <!--  <div class="lt-md">
            <q-btn
              flat
              round
              icon="menu"
              @click="rightDrawerOpen = !rightDrawerOpen"
            />
          </div> -->
        </q-toolbar>
      </q-header>
      <q-drawer v-model="rightDrawerOpen" side="left" content-class="bg-indigo-1">
        <q-list  dense bordered padding class="rounded-borders">
          <q-expansion-item
            v-for="(menu, m) in menuBar" :key="m" :content-inset-level="1">
            <template v-slot:header>
              <q-item-section avatar>
                <q-avatar rounded :color="menu.color" text-color="white" :icon="menu.icon"/>
              </q-item-section>
              <q-item-section>
                {{ menu.grup }}
              </q-item-section>
            </template>
            <q-item
              v-for="(list, l) in menu.menu" :key="l"
              dense clickable tag="a" :to="list.ke">
              <!-- <q-item-section avatar>
                <q-icon :name="list.icon" />
              </q-item-section> -->
              <q-item-section  :class="`text-${menu.color} text-bold`">
                <q-item-label>{{ list.nama }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-expansion-item>
        </q-list>
        <q-separator></q-separator>
        <q-select
          filled
          bg-color="white"
          color="indigo-10"
          v-model="setCabang"
          :options="cabGrup"
          option-label="namaCabang"
          option-value="kodeCab"
          options-dense
          label="Set Cabang *"
          emit-value
          map-options
          @input="setCB(setCabang)"
          style="width:300px"
          class="q-mt-lg shadow-1"
        />
      </q-drawer>
      <q-page-container>
        <router-view />
      </q-page-container>
      <q-footer class="bg-white shadow-6 text-capitalize">
        <div class="q-gutter-sm">
            <q-tabs dense
          mobile-arrows stretch
          align="justify">
              <q-tab dense
                v-for="(me, i) in menuBar" :key="i"
                :class="`text-${me.color} text-capitalize`" :icon="me.icon" :name="me.grup" :label="me.grup">
                <!-- <q-tooltip :content-class="`bg-${me.color}`">
                  {{ me.grup }}
                </q-tooltip> -->
                    <q-menu fit dense>
                      <q-list style="min-width: 100px">
                        <q-item
                          v-for="(list, l) in me.menu" :key="l"
                          dense clickable tag="a" :to="list.ke">
                          <q-item-section  :class="`text-${me.color} text-bold`">
                            <q-item-label>{{ list.nama }}</q-item-label>
                          </q-item-section>
                        </q-item>
                      </q-list>
                    </q-menu>
              </q-tab>
            </q-tabs>
        </div>
      </q-footer>
    </q-layout>
  </template>
  
  <script>
  import { cabang, upass } from '../services/apiList'
  export default {
    beforeCreate () {
      this.$store.dispatch('auth/user')
        .then(a => {
          if (a !== 'mitra') {
            let rd = a || 'login'
            this.$router.push(`/${rd}`)
          }
        })
    },
    sockets: {
      cekOnline: function (data) {
        this.onlineUser = data
        this.ck = true
      },
      pesan: function (data) {
        this.$q.notify({ message: data.text,
          color: 'red',
          position: 'bottom-right',
          timeout: 30000,
          caption: `Pesan dari ${data.dari.nama}`,
          actions: [
            { label: 'Konfirm', color: 'yellow', handler: () => { this.$socket.emit('balas', { kepada: data.dari.akun, dari: this.$store.state.auth.user.nama, text: 'Oke...' }) } }
          ] })
      }
    },
    data () {
      return {
        leftDrawerOpen: false,
        rightDrawerOpen: false,
        tema: false,
        upld: false,
        userAvatar: undefined,
        label: { submit: 'Upload', cancel: 'Batal' },
        u: { pass: '', password: '' },
        rules: {
          required: [value => !!value || 'Required.'],
          min: [v => (v && v.length >= 4) || 'Min 4 characters'],
          cek: [(v) => v === this.u.pass || 'Password tidak sama...']
        },
        setCabang: this.$store.state.auth.user.kodeCab,
        cabGrup: [this.$store.state.auth.user.cabGrup],
        menuBar: [
          {
            grup: 'Dashboard',
            color: 'light-blue-13',
            icon: 'fas fa-home',
            menu: [
              { icon: '', ke: '/BMPrintex', nama: 'Dashboard HO', color: 'teal-6' },
            //   { icon: '', ke: '/BMPrintex/faa', nama: 'Dashboard FAA', color: 'blue-6' },
              { icon: '', ke: '/BMPrintex/dashboardMarketing', nama: 'Dashboard Marketing', color: 'blue-6' }/* ,
              { icon: '', ke: '/BMPrintex/dashboardService', nama: 'Dashboard Service', color: 'blue-6' } */
            ] },
          // {
            // grup: 'Service Center',
            // color: 'pink-13',
            // icon: 'fas fa-tools',
            // menu: [
            //   { icon: '', ke: '/BMPrintex/servis', nama: 'Service Center', color: 'teal-6' },
            //   { icon: '', ke: '/BMPrintex/servisDone', nama: 'Service Selesai', color: 'blue-6' }
            // ] },
          {
            grup: 'MRP',
            color: 'cyan-5',
            icon: 'fas fa-building',
            menu: [
              { icon: '', ke: '/BMPrintex/project', nama: 'Data Project', color: 'teal-6' }
            ] },
          // {
          //   grup: 'Pesanan Masuk',
          //   color: 'light-blue-13',
          //   icon: 'fas fa-comments-dollar',
          //   menu: [
          //     { icon: '', ke: '/BMPrintex/dataPesanan', nama: 'Pesanan Masuk', color: 'teal-6' },
          //     { icon: '', ke: '/BMPrintex/dataPO', nama: 'Pesanan Pelanggan', color: 'blue-6' },
          //     { icon: '', ke: '/BMPrintex/rkpPesanan', nama: 'Rekap Pesanan Pelanggan', color: 'teal-6' }
          //   ] },
          /* {
            grup: 'Request Pembelian',
            color: 'amber-9',
            icon: 'fas fa-pizza-slice',
            menu: [
              { icon: '', ke: '/BMPrintex/PR', nama: 'Purchase Request', color: 'teal-6' }
            ] }, */
          {
            grup: 'Pembelian',
            color: 'blue-9',
            icon: 'fas fa-bread-slice',
            menu: [
              { icon: '', ke: '/BMPrintex/dtPembelian', nama: 'Data Pembelian', color: 'teal-6' },
              // { icon: '', ke: '/BMPrintex/returPembelian', nama: 'Retur Pembelian', color: 'blue-6' },
              { icon: '', ke: '/BMPrintex/reportBeli', nama: 'Laporan Pembelian', color: 'teal-6' }
            ] },
          {
            grup: 'Penjualan',
            color: 'teal-9',
            icon: 'fas fa-shipping-fast',
            menu: [
              { icon: '', ke: '/BMPrintex/dtPenjualan', nama: 'Data Penjualan', color: 'teal-6' },
              // { icon: '', ke: '/BMPrintex/dtPenjualanSN', nama: 'Data Transaksi per SN', color: 'teal-6' },
              { icon: '', ke: '/BMPrintex/returPenjualan', nama: 'Retur Penjualan', color: 'blue-6' },
              // { icon: '', ke: '/BMPrintex/reportPenjualan', nama: 'Laporan Penjualan', color: 'teal-6' }
            ] },
          {
            grup: ' Laporan Sales',
            color: 'teal-13',
            icon: 'fas fa-chart-pie',
            menu: [
              { icon: '', ke: '/BMPrintex/KasSales', nama: 'Setoran Sales', color: 'teal-6' },
              { icon: '', ke: '/BMPrintex/salesReport', nama: 'Performa Sales', color: 'blue-6' },
              { icon: '', ke: '/BMPrintex/piutangSales', nama: 'Piutang Penjualan Sales', color: 'teal-6' }
            ] },
          {
            grup: 'Produk',
            color: 'pink-13',
            icon: 'fas fa-cubes',
            menu: [
              { icon: '', ke: '/BMPrintex/produk', nama: 'Data Produk', color: 'teal-6' },
              { icon: '', ke: '/BMPrintex/stok', nama: 'Stok Barang', color: 'blue-6' },
              /* { icon: '', ke: '/BMPrintex/kongsi', nama: 'Stok Kongsi', color: 'orange-6' }, */
              /* { icon: '', ke: '/BMPrintex/stokall', nama: 'Stok Barang Semua Cabang', color: 'orange-6' }, */
              // { icon: '', ke: '/BMPrintex/umurstok', nama: 'Umur Stok', color: 'orange-6' },
              // { icon: '', ke: '/BMPrintex/historyBarang', nama: 'History Barang', color: 'orange-6' },
              // { icon: '', ke: '/BMPrintex/mutasi', nama: 'Mutasi Barang', color: 'orange-6' },
              { icon: '', ke: '/BMPrintex/stokOpname', nama: 'Stok Opname', color: 'orange-6' },
              { icon: '', ke: '/BMPrintex/Adjustment', nama: 'Stok Adjustment', color: 'orange-6' }
            ] },
          // {
          //   grup: 'Produksi',
          //   color: 'green-13',
          //   icon: 'fas fa-cookie-bite',
          //   menu: [
          //     { icon: '', ke: '/BMPrintex/BoM', nama: 'Bill of Materials', color: 'teal-6' },
          //     { icon: '', ke: '/BMPrintex/rakit', nama: 'Perakitan', color: 'blue-6' }
          //   ] },
          {
            grup: 'Akunting',
            color: 'indigo-13',
            icon: 'fas fa-money-check-alt',
            menu: [
              // { icon: '', ke: '/BMPrintex/trxTunggu', nama: 'Tunggu Approval', color: 'teal-6' },
              // { icon: '', ke: '/BMPrintex/Kasbon', nama: 'Kasbon Karyawan', color: 'blue-6' },
              // { icon: '', ke: '/BMPrintex/bukuExpedisi', nama: 'Data bukuExpedisi', color: 'teal-6' },
              // { icon: '', ke: '/BMPrintex/jurnalUmum', nama: 'Jurnal Umum', color: 'blue-6' },
              { icon: '', ke: '/BMPrintex/kasmasuk', nama: 'Kas Masuk', color: 'teal-6' },
              { icon: '', ke: '/BMPrintex/kas', nama: 'Kas Keluar', color: 'blue-6' },
              // { icon: '', ke: '/BMPrintex/mutasikas', nama: 'Mutasi Kas', color: 'teal-6' },
              { icon: '', ke: '/BMPrintex/hutang', nama: 'Buku Hutang', color: 'blue-6' },
              { icon: '', ke: '/BMPrintex/Piutang', nama: 'Buku Piutang', color: 'teal-6' },
              // { icon: '', ke: '/BMPrintex/piutangSales', nama: 'Piutang Penjualan Sales', color: 'blue-6' },
              // { icon: '', ke: '/BMPrintex/bukuBesar', nama: 'Buku Besar', color: 'teal-6' },
            //   { icon: '', ke: '/BMPrintex/neracaSaldo', nama: 'Neraca Saldo', color: 'blue-6' },
            //   { icon: '', ke: '/BMPrintex/neraca', nama: 'Neraca', color: 'blue-6' },
            //   { icon: '', ke: '/BMPrintex/rugilaba', nama: 'Rugi Laba', color: 'teal-6' },
            //   { icon: '', ke: '/BMPrintex/aruskas', nama: 'Arus Kas', color: 'blue-6' }
            ] },
          {
            grup: 'Setting',
            color: 'purple-13',
            icon: 'fas fa-cogs',
            menu: [
              { icon: '', ke: '/BMPrintex/partner', nama: 'Data Partner', color: 'teal-6' },
              { icon: '', ke: '/BMPrintex/setting/produkCat', nama: 'Kategori Produk', color: 'orange-6' },             
              { icon: '', ke: '/BMPrintex/Adjustment', nama: 'Stok Adjustment', color: 'orange-6' }
            ] }
        ]
      }
    },
    watch: {
      tema: function (v) {
        v ? this.$q.dark.set(true) : this.$q.dark.set(false)
      }
    },
    computed: {
      photo () {
        let dt = this.$axios.defaults.baseURL
        let url = dt.replace('/api', '')
        return `${url}/statics/photo/${this.$store.state.auth.user.photo}`
      },
      oke () {
        return this.$store.state.auth.token
      },
      hdr () {
        let token = this.$q.cookies.get('token')
        return { Authorization: `Bearer ${token}` }
      }
    },
    mounted () {
      cabang().then(({ data }) => {
        const pegang =
          this.$store.state.auth.user.cabGrup || this.$q.cookies.get('cabGrup')
        this.cabGrup = data.filter(a => pegang.some(s => s === a.kodeCab))
      })
      if (!process.env.SERVER) {
        this.setCabang =
          this.$store.state.auth.user.kodeCab || this.$q.cookies.get('setCabang')
      }
    },
    methods: {
      cek () {
        this.$store.dispatch('auth/user')
          .then(a => {
            console.log(a)
            if (a !== 'mitra') {
              // let rd = a || 'login'
              // redirect(`/${rd}`)
            }
          })
      },
      setCB (x) {
        this.$store.dispatch('auth/setCB', x)
      },
      uppass (x) {
        x.akun = this.$store.state.auth.user.akun
        upass(x)
          .then(({ data }) => {
            this.$q.notify({ message: `${data.st}`, color: 'teal' })
          })
          .catch(err => {
            this.$q.notify({ message: `${err.response.data.st}`, color: 'purple' })
          })
      },
      handleUploaded (resp) {
        console.log(resp)
        this.userAvatar = '/statics/photo/' + resp.photo
      },
      logout () {
        this.$store.dispatch('auth/logoutUser')
          .then((res) => {
            this.$router.push('/login', () => this.$router.go(0))
          })
          .catch(err => {
            console.log(err)
            this.$router.push('/login')
          })
      }
    }
  }
  </script>
  <style>
    .q-page-container {
      background-image: url('../statics/bg_main_frame.jpg')!important;
      background-color: rgba(1,1,1,0.4);
    }
    .q-drawer{
      background: rgba(17, 17, 17, 0.747);
    }
    .navigation-item{
      border-radius: 5px;
    }
    .tab-active{
      background-color: green;
    }
  
  </style>
  