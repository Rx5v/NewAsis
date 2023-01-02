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
          Akunting Aston Sistem {{ $store.state.auth.user.namaCabang }}
        </q-toolbar-title>
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
                      Upload photo
                    </q-card-section>
                    <q-card-section>
                      <div class="text-center">
                        <img v-if="userAvatar" :src="photo">
                        <button id="pick-avatar">Select an image</button>
                        <!-- <q-no-ssr>
                          <avatar-cropper
                            @uploaded="handleUploaded"
                            trigger="#pick-avatar"
                            :upload-url="`${$axios.defaults.baseURL}/photo`"
                            output-mime="image/png"
                            :upload-headers="hdr"
                            :labels ="label"/>
                        </q-no-ssr> -->
                      </div>
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
         <q-expansion-item :content-inset-level="1">
            <template v-slot:header>
              <q-item-section avatar>
                <q-avatar rounded color="light-blue-13" text-color="white" icon="fas fa-comments-dollar"/>
              </q-item-section>
              <q-item-section>
                Pesanan Masuk
              </q-item-section>
            </template>
            <q-item dense clickable tag="a" to="/acc/dataPesanan">
              <q-item-section avatar>
                <q-icon name="school" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Pesanan Masuk</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/acc/dataPO">
              <q-item-section avatar>
                <q-icon name="school" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Pesanan Pelanggan</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/acc/rkpPesanan">
              <q-item-section avatar>
                <q-icon name="school" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Rekap Pesanan Pelanggan</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/acc/pricing">
              <q-item-section avatar>
                <q-icon name="rss_feed" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Pricing</q-item-label>
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
            <q-item dense clickable tag="a" to="/acc/PR">
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
            <q-item dense clickable tag="a" to="/acc/dtPembelian">
              <q-item-section avatar>
                <q-icon name="code" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Data Pembelian</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/acc/returPembelian">
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
            <q-item dense clickable tag="a" to="/acc/dtPenjualan">
              <q-item-section avatar>
                <q-icon name="code" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Data Penjualan</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/acc/returPenjualan">
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
            <q-item dense clickable tag="a" to="/acc/KasSales">
              <q-item-section avatar>
                <q-icon name="chat" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Setoran Sales</q-item-label>
                <q-item-label caption>Setoran Sales</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/acc/salesReport">
              <q-item-section avatar>
                <q-icon name="chat" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Performa Sales</q-item-label>
                <q-item-label caption>Performa Sales</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/acc/piutangSales">
              <q-item-section avatar>
                <q-icon name="chat" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Piutang Penjualan Sales</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/acc/klaimPoint">
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
            <q-item dense clickable tag="a" to="/acc/produk">
              <q-item-section avatar>
                <q-icon name="record_voice_over" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Produk</q-item-label>
                <q-item-label caption>Stok</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/acc/stok">
              <q-item-section avatar>
                <q-icon name="rss_feed" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Stok Barang</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/acc/stokall">
              <q-item-section avatar>
                <q-icon name="rss_feed" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Stok Barang Semua Cabang</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/acc/umurstok">
              <q-item-section avatar>
                <q-icon name="rss_feed" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Umur Stok</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/acc/historyBarang">
              <q-item-section avatar>
                <q-icon name="rss_feed" />
              </q-item-section>
              <q-item-section>
                <q-item-label>History Barang</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/acc/mutasi">
              <q-item-section avatar>
                <q-icon name="rss_feed" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Mutasi Barang</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/acc/stokOpname">
              <q-item-section avatar>
                <q-icon name="rss_feed" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Stok Opname</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/acc/Adjustment">
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
            <q-item dense clickable tag="a" to="/acc/BoM">
              <q-item-section avatar>
                <q-icon name="record_voice_over" />
              </q-item-section>
              <q-item-section>
                <q-item-label>BoM</q-item-label>
                <q-item-label caption>Bill of Materials</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/acc/rakit">
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
            <q-item dense clickable tag="a" to="/acc">
              <q-item-section avatar>
                <q-icon name="record_voice_over" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Tunggu Approval</q-item-label>
                <q-item-label caption>data waiting Approval</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/acc/Kasbon">
              <q-item-section avatar>
                <q-icon name="chat" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Kasbon Karyawan</q-item-label>
                <q-item-label caption>Data Kasbon</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/acc/bukuExpedisi">
              <q-item-section avatar>
                <q-icon name="chat" />
              </q-item-section>
              <q-item-section>
                <q-item-label>bukuExpedisi</q-item-label>
                <q-item-label caption>Data bukuExpedisi</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/acc/jurnalUmum">
              <q-item-section avatar>
                <q-icon name="record_voice_over" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Jurnal Umum</q-item-label>
                <q-item-label caption>data jurnal umum</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/acc/kasmasuk">
              <q-item-section avatar>
                <q-icon name="rss_feed" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Kas Masuk</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/acc/kas">
              <q-item-section avatar>
                <q-icon name="rss_feed" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Kas Keluar</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/acc/mutasikas">
              <q-item-section avatar>
                <q-icon name="rss_feed" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Mutasi Kas</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/acc/hutang">
              <q-item-section avatar>
                <q-icon name="rss_feed" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Hutang</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/acc/Piutang">
              <q-item-section avatar>
                <q-icon name="rss_feed" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Piutang</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/acc/piutangSales">
              <q-item-section avatar>
                <q-icon name="chat" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Piutang Penjualan Sales</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/acc/bukuBesar">
              <q-item-section avatar>
                <q-icon name="rss_feed" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Buku Besar</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/acc/neracaSaldo">
              <q-item-section avatar>
                <q-icon name="rss_feed" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Neraca Saldo</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/acc/neraca">
              <q-item-section avatar>
                <q-icon name="rss_feed" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Neraca</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/acc/rugilaba">
              <q-item-section avatar>
                <q-icon name="rss_feed" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Rugi Laba</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/acc/aruskas">
              <q-item-section avatar>
                <q-icon name="rss_feed" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Arus Kas</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/acc/akunCOA">
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
            </template>
            <q-item dense clickable tag="a" to="/acc/partner">
              <q-item-section avatar>
                <q-icon name="record_voice_over" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Partner</q-item-label>
                <q-item-label caption>Cust/ Vendor</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/acc/Adjustment">
              <q-item-section avatar>
                <q-icon name="rss_feed" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Stok Adjustment</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/acc/setting/cabang">
              <q-item-section avatar>
                <q-icon name="record_voice_over" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Cabang</q-item-label>
                <q-item-label caption>Cabang dan Mitra</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/acc/setting/user">
              <q-item-section avatar>
                <q-icon name="rss_feed" />
              </q-item-section>
              <q-item-section>
                <q-item-label>User</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/acc/setting/produkCat">
              <q-item-section avatar>
                <q-icon name="rss_feed" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Kategori Produk</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/acc/setting/stokAwal">
              <q-item-section avatar>
                <q-icon name="rss_feed" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Stok Awal Produk</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/acc/setting/uploadHP">
              <q-item-section avatar>
                <q-icon name="rss_feed" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Upload Hutang Piutang Awal</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" to="/acc/setting/uploadProduk">
              <q-item-section avatar>
                <q-icon name="rss_feed" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Upload Data Produk</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense clickable tag="a" @click="cekStatus" >
              <q-item-section avatar>
                <q-icon name="rss_feed" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Cek User Online</q-item-label>
              </q-item-section>
            </q-item>
            <!-- <q-item dense clickable tag="a" to="/acc/setting/chatRoom">
              <q-item-section avatar>
                <q-icon name="fas fa-chat" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Video Conference</q-item-label>
              </q-item-section>
            </q-item> -->
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
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
// import AvatarCropper from 'vue-avatar-cropper'
import { upass } from '../services/apiList'
export default {
  name: 'MyLayout',
  async preFetch ({ store, redirect }) {
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
      ck: false
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
    this.$socket.emit('gabung', this.$store.state.auth.user)
  },
  methods: {
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
      /* this.$axios.get('/logout')
        .then((res) => {
          this.$q.cookies.remove('token')
          this.$store.commit('auth/login', '')
          this.$store.commit('auth/user', {})
          this.$store.commit('auth/isLogged', false)
          this.$router.go('/login')
        })
        .catch(err => {
          console.log(err)
          this.$router.push('/login')
        }) */
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
