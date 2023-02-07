<template>
  <q-layout view="hHh Lpr lFf">
    <q-header elevated class="print-hide">
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
         HO Aston Sistem {{ $store.state.auth.user.namaCabang }}
        </q-toolbar-title>
        <q-select filled v-model="setCabang" :options="cabGrup"
          class="text-white q-mr-md"
          bg-color="secondary"
          option-label="namaCabang" option-value="kodeCab"
          options-dense
          dense label="Set Cabang *" emit-value  map-options
          @input="setCB(setCabang)"
          style="width:300px"/>
        <q-btn dense color="purple" round icon="add_shopping_cart" class="q-ml-md">
          <q-badge color="red" floating>{{ not.newPO }}</q-badge>
        </q-btn>
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
       <q-list dense bordered padding class="rounded-borders text-white">
          <q-item dense clickable tag="a" to="/man">
            <q-item-section avatar>
              <q-avatar rounded color="light-blue-13" text-color="white" icon="fas fa-home"/>
            </q-item-section>
            <q-item-section>
              <q-item-label>Dashboard Investor</q-item-label>
            </q-item-section>
          </q-item>
          <q-item dense clickable tag="a" to="/man/ASI">
            <q-item-section avatar>
              <q-avatar rounded color="light-blue-13" text-color="red" icon="fas fa-chart-pie"/>
            </q-item-section>
            <q-item-section>
              <q-item-label>Dashboard ASI</q-item-label>
            </q-item-section>
          </q-item>
          <q-item dense clickable tag="a" to="/man/faa">
          <q-item-section avatar>
            <q-avatar rounded color="light-blue-13" text-color="white" icon="fas fa-chart-pie"/>
          </q-item-section>
          <q-item-section>
            <q-item-label>Dashboard FAA</q-item-label>
          </q-item-section>
        </q-item>
          <q-expansion-item :content-inset-level="1">
            <template v-slot:header>
              <q-item-section avatar>
                <q-avatar rounded color="light-blue-13" text-color="white" icon="fas fa-comments-dollar"/>
              </q-item-section>
              <q-item-section>
                Pesanan Masuk
              </q-item-section>
            </template>
            <q-item dense clickable tag="a" to="/man/dataPesanan">
              <q-item-section avatar>
                <q-icon name="school" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Pesanan Masuk</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/man/dataPO">
              <q-item-section avatar>
                <q-icon name="school" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Pesanan Pelanggan</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/man/rkpPesanan">
              <q-item-section avatar>
                <q-icon name="school" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Rekap Pesanan Pelanggan</q-item-label>
              </q-item-section>
            </q-item>
          </q-expansion-item>
          <q-expansion-item :content-inset-level="1">
            <template v-slot:header>
              <q-item-section avatar>
                <q-avatar rounded color="amber-9" text-color="white" icon="fas fa-pizza-slice"/>
              </q-item-section>
              <q-item-section>
                Request Pembelian
              </q-item-section>
            </template>
            <q-item dense clickable tag="a" to="/man/PR">
              <q-item-section avatar>
                <q-icon name="school" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Purchase Request</q-item-label>
                <q-item-label caption>PR</q-item-label>
              </q-item-section>
            </q-item>
          </q-expansion-item>
          <q-expansion-item :content-inset-level="1">
            <template v-slot:header>
              <q-item-section avatar>
                <q-avatar rounded color="blue-9" text-color="white" icon="fas fa-bread-slice"/>
              </q-item-section>
              <q-item-section>
                Pembelian
              </q-item-section>
            </template>
            <q-item dense clickable tag="a" to="/man/dtPembelian">
              <q-item-section avatar>
                <q-icon name="code" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Data Pembelian</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/man/returPembelian">
              <q-item-section avatar>
                <q-icon name="rss_feed" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Retur Pembelian</q-item-label>
              </q-item-section>
            </q-item>
          </q-expansion-item>
          <q-expansion-item :content-inset-level="1">
            <template v-slot:header>
              <q-item-section avatar>
                <q-avatar rounded color="teal-9" text-color="white" icon="fas fa-shipping-fast"/>
              </q-item-section>
              <q-item-section>
                Penjualan
              </q-item-section>
            </template>
            <q-item dense clickable tag="a" to="/man/dtPenjualan">
              <q-item-section avatar>
                <q-icon name="code" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Data Penjualan</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/man/returPenjualan">
              <q-item-section avatar>
                <q-icon name="rss_feed" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Retur Penjualan</q-item-label>
              </q-item-section>
            </q-item>
          </q-expansion-item>
          <q-expansion-item :content-inset-level="1">
            <template v-slot:header>
              <q-item-section avatar>
                <q-avatar rounded color="teal-13" text-color="white" icon="fas fa-chart-pie"/>
              </q-item-section>
              <q-item-section>
                Laporan Sales
              </q-item-section>
            </template>
            <q-item dense clickable tag="a" to="/man/KasSales">
              <q-item-section avatar>
                <q-icon name="chat" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Setoran Sales</q-item-label>
                <q-item-label caption>Setoran Sales</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/man/salesReport">
              <q-item-section avatar>
                <q-icon name="chat" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Performa Sales</q-item-label>
                <q-item-label caption>Performa Sales</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/man/piutangSales">
              <q-item-section avatar>
                <q-icon name="chat" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Piutang Penjualan Sales</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/man/klaimPoint">
              <q-item-section avatar>
                <q-icon name="chat" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Klaim Point</q-item-label>
                <q-item-label caption>Point Member</q-item-label>
              </q-item-section>
            </q-item>
          </q-expansion-item>
          <q-expansion-item :content-inset-level="1">
            <template v-slot:header>
              <q-item-section avatar>
                <q-avatar rounded color="pink-13" text-color="white" icon="fas fa-cubes"/>
              </q-item-section>
              <q-item-section>
                Produk
              </q-item-section>
            </template>
            <q-item dense clickable tag="a" to="/man/produk">
              <q-item-section avatar>
                <q-icon name="record_voice_over" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Produk</q-item-label>
                <q-item-label caption>Stok</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/man/stok">
              <q-item-section avatar>
                <q-icon name="rss_feed" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Stok Barang</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/man/kongsi">
              <q-item-section avatar>
                <q-icon name="rss_feed" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Stok Kongsi</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/man/stokall">
              <q-item-section avatar>
                <q-icon name="rss_feed" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Stok Barang Semua Cabang</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/man/umurstok">
              <q-item-section avatar>
                <q-icon name="rss_feed" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Umur Stok</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/man/historyBarang">
              <q-item-section avatar>
                <q-icon name="rss_feed" />
              </q-item-section>
              <q-item-section>
                <q-item-label>History Barang</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/man/mutasi">
              <q-item-section avatar>
                <q-icon name="rss_feed" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Mutasi Barang</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/man/stokOpname">
              <q-item-section avatar>
                <q-icon name="rss_feed" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Stok Opname</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/man/Adjustment">
              <q-item-section avatar>
                <q-icon name="rss_feed" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Stok Adjustment</q-item-label>
              </q-item-section>
            </q-item>
          </q-expansion-item>
          <q-expansion-item :content-inset-level="1">
            <template v-slot:header>
              <q-item-section avatar>
                <q-avatar rounded color="green-13" text-color="white" icon="fas fa-cookie-bite"/>
              </q-item-section>
              <q-item-section>
                Produksi
              </q-item-section>
            </template>
            <q-item dense clickable tag="a" to="/man/BoM">
              <q-item-section avatar>
                <q-icon name="record_voice_over" />
              </q-item-section>
              <q-item-section>
                <q-item-label>BoM</q-item-label>
                <q-item-label caption>Bill of Materials</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/man/rakit">
              <q-item-section avatar>
                <q-icon name="rss_feed" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Perakitan</q-item-label>
              </q-item-section>
            </q-item>
          </q-expansion-item>
          <q-expansion-item :content-inset-level="1">
            <template v-slot:header>
              <q-item-section avatar>
                <q-avatar rounded color="indigo-13" text-color="white" icon="fas fa-money-check-alt"/>
              </q-item-section>
              <q-item-section>
                Akunting
              </q-item-section>
            </template>
            <q-item dense clickable tag="a" to="/man/acc">
              <q-item-section avatar>
                <q-icon name="record_voice_over" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Tunggu Approval</q-item-label>
                <q-item-label caption>data waiting Approval</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/man/Kasbon">
              <q-item-section avatar>
                <q-icon name="chat" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Kasbon Karyawan</q-item-label>
                <q-item-label caption>Data Kasbon</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/man/bukuExpedisi">
              <q-item-section avatar>
                <q-icon name="chat" />
              </q-item-section>
              <q-item-section>
                <q-item-label>bukuExpedisi</q-item-label>
                <q-item-label caption>Data bukuExpedisi</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/man/acc/jurnalUmum">
              <q-item-section avatar>
                <q-icon name="record_voice_over" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Jurnal Umum</q-item-label>
                <q-item-label caption>data jurnal umum</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/man/acc/kasmasuk">
              <q-item-section avatar>
                <q-icon name="rss_feed" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Kas Masuk</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/man/acc/kas">
              <q-item-section avatar>
                <q-icon name="rss_feed" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Kas Keluar</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/man/acc/mutasikas">
              <q-item-section avatar>
                <q-icon name="rss_feed" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Mutasi Kas</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/man/acc/hutang">
              <q-item-section avatar>
                <q-icon name="rss_feed" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Hutang</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/man/acc/Piutang">
              <q-item-section avatar>
                <q-icon name="rss_feed" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Piutang</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/man/acc/bukuBesar">
              <q-item-section avatar>
                <q-icon name="rss_feed" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Buku Besar</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/man/acc/neracaSaldo">
              <q-item-section avatar>
                <q-icon name="rss_feed" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Neraca Saldo</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/man/acc/neraca">
              <q-item-section avatar>
                <q-icon name="rss_feed" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Neraca</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/man/acc/rugilaba">
              <q-item-section avatar>
                <q-icon name="rss_feed" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Rugi Laba</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/man/acc/aruskas">
              <q-item-section avatar>
                <q-icon name="rss_feed" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Arus Kas</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/man/acc/akunCOA">
              <q-item-section avatar>
                <q-icon name="fas fa-cubes" class="text-teal" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Data Akun COA</q-item-label>
              </q-item-section>
            </q-item>
          </q-expansion-item>
          <q-expansion-item :content-inset-level="1">
            <template v-slot:header>
              <q-item-section avatar>
                <q-avatar rounded color="purple-13" text-color="white" icon="fas fa-cogs"/>
              </q-item-section>
              <q-item-section>
                Setting
              </q-item-section>
            </template><q-item dense clickable tag="a" to="/man/setting/partner">
              <q-item-section avatar>
                <q-icon name="record_voice_over" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Partner</q-item-label>
                <q-item-label caption>Cust/ Vendor</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/man/setting/cabang">
              <q-item-section avatar>
                <q-icon name="record_voice_over" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Cabang</q-item-label>
                <q-item-label caption>Cabang dan Mitra</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/man/setting/user">
              <q-item-section avatar>
                <q-icon name="rss_feed" />
              </q-item-section>
              <q-item-section>
                <q-item-label>User</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/man/setting/produkCat">
              <q-item-section avatar>
                <q-icon name="rss_feed" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Kategori Produk</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/man/setting/stokAwal">
              <q-item-section avatar>
                <q-icon name="rss_feed" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Stok Awal Produk</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/man/acc/uploadHP">
              <q-item-section avatar>
                <q-icon name="rss_feed" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Upload Hutang Piutang Awal</q-item-label>
              </q-item-section>
            </q-item>
          </q-expansion-item>
      </q-list>
    </q-drawer>

    <q-page-container :style="`${tema ? 'background-image: url(../statics/darkThemes.jpg) !important;' : 'background-image: url(../statics/bg_main_frame.jpg) !important;'}`">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import { cabang, upass } from '../services/apiList'
// import AvatarCropper from 'vue-avatar-cropper'

export default {
  name: 'MyLayout',
  /* preFetch ({ store, redirect }) {
    console.log('iki layout pree')
    store.dispatch('auth/user')
      .then(userType => {
        console.log(userType)
        if (userType !== 'MAN') {
          console.log('bukan man')
          redirect(`/${userType}`)
        } else {
          console.log('siap')
        }
      })
      .catch(err => {
        console.log(err)
        redirect('/login')
      })
  }, */
  beforeCreate () {
    this.$store.dispatch('auth/user')
      .then(a => {
        if (a !== 'MAN') {
          let rd = a || 'login'
          this.$router.push(`/${rd}`)
        }
      })
  },
  /* components: {
    AvatarCropper
  }, */
  sockets: {
    cekOnline: function (data) {
      console.log(data)
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
      not: {
        newPO: 0
      },
      cabGrup: [],
      setCabang: this.$store.state.auth.user.kodeCab
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
      console.log(token)
      return { Authorization: `Bearer ${token}` }
    }
  },
  mounted () {
    cabang()
      .then(({ data }) => {
        const pegang = this.$store.state.auth.user.cabGrup || this.$q.cookies.get('cabGrup')
        this.cabGrup = data.filter(a => pegang.some(s => s === a.kodeCab))
      })
    if (!process.env.SERVER) {
      this.setCabang = this.$store.state.auth.user.kodeCab || this.$q.cookies.get('setCabang')
    }
  },
  methods: {
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
    setCB (x) {
      this.$store.dispatch('auth/setCB', x)
    },
    logout () {
      this.$store.dispatch('auth/logoutUser')
        .then((res) => {
          this.$router.push({ name: 'login' }, () => this.$router.go(0))
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
  /* .q-card{
    background-image: url('../statics/gelombang.svg')!important;
  } */

</style>
