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
          Gudang Aston Sistem {{ $store.state.auth.user.namaCabang }}
        </q-toolbar-title>
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

    <q-drawer v-model="leftDrawerOpen" side="left" content-class="bg-indigo-1">
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
    </q-drawer>
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import { upass } from '../services/apiList'
export default {
  beforeCreate () {
    this.$store.dispatch('auth/user')
      .then(a => {
        if (a !== 'gudang') {
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
      menuBar: [
        {
          grup: 'Pesanan Masuk',
          color: 'light-blue-13',
          icon: 'fas fa-comments-dollar',
          menu: [
            { icon: '', ke: '/gudang/dataPesanan', nama: 'Pesanan Masuk', color: 'teal-6' },
            { icon: '', ke: '/gudang/dataPO', nama: 'Pesanan Pelanggan', color: 'blue-6' },
            { icon: '', ke: '/gudang/rkpPesanan', nama: 'Rekap Pesanan Pelanggan', color: 'teal-6' }
          ] },
        /* {
          grup: 'Request Pembelian',
          color: 'amber-9',
          icon: 'fas fa-pizza-slice',
          menu: [
            { icon: '', ke: '/gudang/PR', nama: 'Purchase Request', color: 'teal-6' }
          ] }, */
        {
          grup: 'Penjualan',
          color: 'teal-9',
          icon: 'fas fa-shipping-fast',
          menu: [
            { icon: '', ke: '/gudang', nama: 'Data Penjualan', color: 'teal-6' },
            { icon: '', ke: '/gudang/dtPenjualanSN', nama: 'Data Transaksi per SN', color: 'teal-6' }
          ] },
        {
          grup: 'Produk',
          color: 'pink-13',
          icon: 'fas fa-cubes',
          menu: [
            { icon: '', ke: '/gudang/stok', nama: 'Stok Barang', color: 'blue-6' },
            /* { icon: '', ke: '/gudang/kongsi', nama: 'Stok Kongsi', color: 'orange-6' }, */
            /* { icon: '', ke: '/gudang/stokall', nama: 'Stok Barang Semua Cabang', color: 'orange-6' }, */
            { icon: '', ke: '/gudang/umurstok', nama: 'Umur Stok', color: 'orange-6' },
            { icon: '', ke: '/gudang/historyBarang', nama: 'History Barang', color: 'orange-6' },
            { icon: '', ke: '/gudang/mutasi', nama: 'Mutasi Barang', color: 'orange-6' },
            { icon: '', ke: '/gudang/stokOpname', nama: 'Stok Opname', color: 'orange-6' },
            { icon: '', ke: '/gudang/Adjustment', nama: 'Stok Adjustment', color: 'orange-6' }
          ] },
        {
          grup: 'Produksi',
          color: 'green-13',
          icon: 'fas fa-cookie-bite',
          menu: [
            { icon: '', ke: '/gudang/BoM', nama: 'Bill of Materials', color: 'teal-6' },
            { icon: '', ke: '/gudang/rakit', nama: 'Perakitan', color: 'blue-6' }
          ] },
        {
          grup: 'Setting',
          color: 'purple-13',
          icon: 'fas fa-cogs',
          menu: [
            { icon: '', ke: '/gudang/partner', nama: 'Data Partner', color: 'teal-6' }
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
      console.log(token)
      return { Authorization: `Bearer ${token}` }
    }
  },
  mounted () {
    this.$store.dispatch('auth/setCB', this.$store.state.auth.user.kodeCab)
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
  /* .q-card{
    background-image: url('../statics/gelombang.svg')!important;
  } */

</style>
