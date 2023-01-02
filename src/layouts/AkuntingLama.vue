<template>
  <q-layout view="hHh Lpr lFf">
    <q-header reveal elevated class="print-hide">
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          @click="leftDrawerOpen = !leftDrawerOpen"
          icon="menu"
          aria-label="Menu"
        />
        <q-toolbar-title>
          {{ $store.state.auth.user.namaCabang }}
        </q-toolbar-title>
        <q-select filled v-model="setCabang" :options="cabGrup"
          class="text-white q-mr-md"
          bg-color="secondary"
          option-label="namaCabang" option-value="kodeCab"
          options-dense
          dense label="Set Cabang *" emit-value  map-options
          @input="setCB(setCabang)"
          style="width:300px"/>
        <q-btn dense color="pink" round push icon="pan_tool" class="q-mr-md" to="/acc/PR">
          <q-badge color="pink" floating>{{ not.newPR }}</q-badge>
          <q-tooltip>
            PR
          </q-tooltip>
        </q-btn>
        <q-btn dense color="purple" round push icon="add_shopping_cart" class="q-mr-md" to="/acc/dataPO">
          <q-badge color="red" floating>{{ not.newPO }}</q-badge>
          <q-tooltip>
            Pesanan Pelanggan
          </q-tooltip>
        </q-btn>
        <q-btn fab-mini icon="chat" outline class="q-mr-xs" @click="kirimPesan" color="white"/>
        <q-btn color="warning" round icon="account_circle">
          <q-menu>
            <div class="row no-wrap q-pa-md">
              <div class="column">
                <div class="text-h6 q-mb-md">Settings</div>
                <q-toggle v-model="tema" label="Dark Mode" />
                <q-form
                  ref="form"
                  @submit="uppass(u)"
                  class="q-gutter-md">
                  <q-input dense v-model="u.pass" :rules="rules.required" label="password" type="password"/>
                  <q-input dense v-model="u.password" :rules="rules.cek" label="retype password" type="password"/>
                  <q-btn dense type="submit" label="update"/>
                </q-form>
              </div>
              <q-separator vertical inset class="q-mx-lg" />
              <div class="column items-center">
                <q-avatar size="72px" @click="upld = true">
                  <img :src="photo">
                </q-avatar>
                <div class="text-teal q-mt-md q-mb-xs">{{ $store.state.auth.user.nama || '' }} </div>
                <q-btn
                  color="primary"
                  label="Logout"
                  push
                  size="sm"
                  v-close-popup
                  @click="logout"
                />
                <q-dialog
                  v-model="upld"
                  max-width="600px">
                  <q-card>
                    <q-card-section>
                      <q-uploader
                        :url="$axios.defaults.baseURL + '/photo'"
                        style="max-width: 300px"
                        field-name="photo"
                        accept=".jpg, image/*"
                        label="Unggah Photo"
                        @failed="(x) => $q.notify({ message: x.xhr.responseText, color: 'orange' })"
                        :headers="[{name: 'Authorization', value: `Bearer ${$store.state.auth.token}`}]"
                        />
                    </q-card-section>
                  </q-card>
                </q-dialog>
              </div>
            </div>
          </q-menu>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      overlay
      bordered
      elevated
      class="print-hide"
    >
      <q-list  dense bordered padding class="rounded-borders text-white">
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
      <q-dialog
        v-model="ck">
        <q-card
          style="width: 600px">
          <q-card-section>
            <q-list dense>
              <q-item-section v-for="a in onlineUser" :key="a">
                {{ a }}
              </q-item-section>
            </q-list>
          </q-card-section>
        </q-card>
      </q-dialog>
    </q-drawer>
    <q-page-container :style="`${tema ? 'background-image: url(../statics/darkThemes.jpg) !important;' : 'background-image: url(../statics/bg_main_frame.jpg) !important;'}`">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
// import AvatarCropper from 'vue-avatar-cropper'
import { cabang, newNotif, upass } from '../services/apiList'
export default {
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
    },
    umbal: function (data) {
      this.$q.notify({ message: data.text,
        color: 'red',
        position: 'bottom-right',
        timeout: 30000,
        caption: `Pesan dari ${data.dari}`
      })
    }
  },
  data () {
    return {
      leftDrawerOpen: false,
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
      onlineUser: [],
      ck: false,
      not: {
        newPO: 0,
        newPR: 0
      },
      counter: 0,
      setCabang: this.$store.state.auth.user.kodeCab,
      cabGrup: [this.$store.state.auth.user.cabGrup],
      menuBar: [
        {
          grup: 'Dashboard',
          color: 'light-blue-13',
          icon: 'fas fa-home',
          menu: [
            { icon: '', ke: '/acc', nama: 'Dashboard HO', color: 'teal-6' },
            { icon: '', ke: '/acc/faa', nama: 'Dashboard FAA', color: 'blue-6' },
            { icon: '', ke: '/acc/investor', nama: 'Dashboard Investor', color: 'blue-6' }
          ] },
        {
          grup: 'Service Center',
          color: 'pink-13',
          icon: 'fas fa-tools',
          menu: [
            { icon: '', ke: '/acc/servis', nama: 'Service Center', color: 'teal-6' },
            { icon: '', ke: '/acc/servisDone', nama: 'Service Selesai', color: 'blue-6' }
          ] },
        {
          grup: 'Project Management',
          color: 'pink-13',
          icon: 'fas fa-tools',
          menu: [
            { icon: '', ke: '/acc/project', nama: 'Data Project', color: 'teal-6' }
          ] },
        {
          grup: 'Pesanan Masuk',
          color: 'light-blue-13',
          icon: 'fas fa-comments-dollar',
          menu: [
            { icon: '', ke: '/acc/dataPesanan', nama: 'Pesanan Masuk', color: 'teal-6' },
            { icon: '', ke: '/acc/dataPO', nama: 'Pesanan Pelanggan', color: 'blue-6' },
            { icon: '', ke: '/acc/rkpPesanan', nama: 'Rekap Pesanan Pelanggan', color: 'teal-6' },
            { icon: '', ke: '/acc/pricing', nama: 'Pricing', color: 'blue-6' }
          ] },
        {
          grup: 'Request Pembelian',
          color: 'amber-9',
          icon: 'fas fa-pizza-slice',
          menu: [
            { icon: '', ke: '/acc/PR', nama: 'Purchase Request', color: 'teal-6' }
          ] },
        {
          grup: 'Pembelian',
          color: 'blue-9',
          icon: 'fas fa-bread-slice',
          menu: [
            { icon: '', ke: '/acc/dtPembelian', nama: 'Data Pembelian', color: 'teal-6' },
            { icon: '', ke: '/acc/returPembelian', nama: 'Retur Pembelian', color: 'blue-6' },
            { icon: '', ke: '/acc/reportBeli', nama: 'Laporan Pembelian', color: 'teal-6' }
          ] },
        {
          grup: 'Penjualan',
          color: 'teal-9',
          icon: 'fas fa-shipping-fast',
          menu: [
            { icon: '', ke: '/acc/dtPenjualan', nama: 'Data Penjualan', color: 'teal-6' },
            { icon: '', ke: '/acc/returPenjualan', nama: 'Retur Penjualan', color: 'blue-6' },
            { icon: '', ke: '/acc/reportPenjualan', nama: 'Laporan Penjualan', color: 'teal-6' }
          ] },
        {
          grup: ' Laporan Sales',
          color: 'teal-13',
          icon: 'fas fa-chart-pie',
          menu: [
            { icon: '', ke: '/acc/KasSales', nama: 'Setoran Sales', color: 'teal-6' },
            { icon: '', ke: '/acc/salesReport', nama: 'Performa Sales', color: 'blue-6' },
            { icon: '', ke: '/acc/piutangSales', nama: 'Piutang Penjualan Sales', color: 'teal-6' },
            { icon: '', ke: '/acc/klaimPoint', nama: 'Klaim Point', color: 'blue-6' }
          ] },
        {
          grup: 'Produk',
          color: 'pink-13',
          icon: 'fas fa-cubes',
          menu: [
            { icon: '', ke: '/acc/produk', nama: 'Data Produk', color: 'teal-6' },
            { icon: '', ke: '/acc/stok', nama: 'Stok Barang', color: 'blue-6' },
            { icon: '', ke: '/acc/kongsi', nama: 'Stok Kongsi', color: 'orange-6' },
            { icon: '', ke: '/acc/stokall', nama: 'Stok Barang Semua Cabang', color: 'orange-6' },
            { icon: '', ke: '/acc/umurstok', nama: 'Umur Stok', color: 'orange-6' },
            { icon: '', ke: '/acc/historyBarang', nama: 'History Barang', color: 'orange-6' },
            { icon: '', ke: '/acc/mutasi', nama: 'Mutasi Barang', color: 'orange-6' },
            { icon: '', ke: '/acc/stokOpname', nama: 'Stok Opname', color: 'orange-6' },
            { icon: '', ke: '/acc/Adjustment', nama: 'Stok Adjustment', color: 'orange-6' }
          ] },
        {
          grup: 'Produksi',
          color: 'green-13',
          icon: 'fas fa-cookie-bite',
          menu: [
            { icon: '', ke: '/acc/BoM', nama: 'Bill of Materials', color: 'teal-6' },
            { icon: '', ke: '/acc/rakit', nama: 'Perakitan', color: 'blue-6' }
          ] },
        {
          grup: 'Akunting',
          color: 'indigo-13',
          icon: 'fas fa-money-check-alt',
          menu: [
            { icon: '', ke: '/acc/trxTunggu', nama: 'Tunggu Approval', color: 'teal-6' },
            { icon: '', ke: '/acc/Kasbon', nama: 'Kasbon Karyawan', color: 'blue-6' },
            { icon: '', ke: '/acc/bukuExpedisi', nama: 'Data bukuExpedisi', color: 'teal-6' },
            { icon: '', ke: '/acc/jurnalUmum', nama: 'Jurnal Umum', color: 'blue-6' },
            { icon: '', ke: '/acc/kasmasuk', nama: 'Kas Masuk', color: 'teal-6' },
            { icon: '', ke: '/acc/kas', nama: 'Kas Keluar', color: 'blue-6' },
            { icon: '', ke: '/acc/mutasikas', nama: 'Mutasi Kas', color: 'teal-6' },
            { icon: '', ke: '/acc/hutang', nama: 'Buku Hutang', color: 'blue-6' },
            { icon: '', ke: '/acc/Piutang', nama: 'Buku Piutang', color: 'teal-6' },
            { icon: '', ke: '/acc/piutangSales', nama: 'Piutang Penjualan Sales', color: 'blue-6' },
            { icon: '', ke: '/acc/bukuBesar', nama: 'Buku Besar', color: 'teal-6' },
            { icon: '', ke: '/acc/neracaSaldo', nama: 'Neraca Saldo', color: 'blue-6' },
            { icon: '', ke: '/acc/neraca', nama: 'Neraca', color: 'blue-6' },
            { icon: '', ke: '/acc/rugilaba', nama: 'Rugi Laba', color: 'teal-6' },
            { icon: '', ke: '/acc/aruskas', nama: 'Arus Kas', color: 'blue-6' },
            { icon: '', ke: '/acc/akunCOA', nama: 'Data Akun COA', color: 'teal-6' }
          ] },
        {
          grup: 'Setting',
          color: 'purple-13',
          icon: 'fas fa-cogs',
          menu: [
            { icon: '', ke: '/acc/partner', nama: 'Data Partner', color: 'teal-6' },
            { icon: '', ke: '/acc/setting/custCat', nama: 'Kategori Pelanggan', color: 'orange-6' },
            { icon: '', ke: '/acc/setting/produkCat', nama: 'Kategori Produk', color: 'orange-6' },
            { icon: '', ke: '/acc/setting/uploadProduk', nama: 'Upload Data Produk', color: 'orange-6' },
            { icon: '', ke: '/acc/setting/stokAwal', nama: 'Stok Awal Produk', color: 'orange-6' },
            { icon: '', ke: '/acc/setting/uploadHP', nama: 'Upload Hutang Piutang Awal', color: 'orange-6' },
            { icon: '', ke: '/acc/Adjustment', nama: 'Stok Adjustment', color: 'orange-6' },
            { icon: '', ke: '/acc/setting/user', nama: 'User', color: 'orange-6' },
            { icon: '', ke: '/acc/setting/cabang', nama: 'Cabang dan Mitra', color: 'blue-6' }
          ] }
      ]
    }
  },
  watch: {
    tema: function (v) {
      v ? this.$q.dark.set(true) : this.$q.dark.set(false)
    },
    counter: function (v) {
      // if (v % 5000 === 0) {
      this.cekNot()
      // }
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
  beforeCreate () {
    this.$store.dispatch('auth/user')
      .then(a => {
        if (a !== 'acc') {
          let rd = a || 'login'
          this.$router.push(`/${rd}`)
        }
      })
  },
  mounted () {
    this.$socket.emit('gabung', this.$store.state.auth.user)
    this.cekNot()
    this.startInterval()
    cabang()
      .then(({ data }) => {
        const pegang = this.$store.state.auth.user.cabGrup || this.$q.cookies.get('cabGrup')
        this.cabGrup = data.filter(a => pegang.some(s => s === a.kodeCab))
      })
    if (!process.env.SERVER) {
      this.setCabang = this.$store.state.auth.user.kodeCab || this.$q.cookies.get('setCabang')
    }
  },
  beforeDestroy () {
    this.clearInterval(this.counter)
  },
  methods: {
    startInterval () {
      setInterval(() => {
        this.counter++
      }, 300000)
    },
    cekNot () {
      newNotif()
        .then(({ data }) => {
          this.not = data
        })
    },
    cekStatus () {
      this.$socket.emit('getOnline')
    },
    kirimPesan () {
      this.$q.dialog({
        title: 'Kirim Pesan',
        message: 'Tulis pesan ke semua user...',
        prompt: {
          model: '',
          type: 'text' // optional
        },
        cancel: true,
        persistent: true
      }).onOk(data => {
        if (data) {
          this.$socket.emit('sendAll', { dari: { nama: this.$store.state.auth.user.nama, akun: this.$store.state.auth.user.akun }, text: data })
        }
        // console.log('>>>> OK, received', data)
      }).onCancel(() => {
        // console.log('>>>> Cancel')
      }).onDismiss(() => {
        // console.log('I am triggered on both OK and Cancel')
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
    }
  }
}
</script>
<style>
  .q-page-container {
    backdrop-filter: blur(10px);
    /* background-image: url('../statics/bg_main_frame.jpg') !important; */
    background-color: rgba(1,1,1,0.4);
  }
  .q-drawer{
    background: rgba(0, 0, 0, 0.836);
  }
  .navigation-item{
    border-radius: 5px;
  }
  .tab-active{
    background-color: green;
  }

</style>
