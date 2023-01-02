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
          Sales {{ $store.state.auth.setCabang }}
          Sales {{ $store.state.auth.user.namaCabang }}
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

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above      
    
      
      class="print-hide bg-pimary text-white"

      
    >
      <q-list dense bordered padding class="rounded-borders text-white" separator>
          <q-expansion-item :content-inset-level="1">
            <template v-slot:header>
              <q-item-section avatar>
                <q-avatar rounded color="light-blue-13" text-color="white" icon="fa fa-shopping-cart"/>
              </q-item-section>
              <q-item-section>
                Penjualan
              </q-item-section>
            </template>
            <q-item dense clickable tag="a" to="/cs/mrp">
              <q-item-section avatar>
                <q-avatar rounded color="teal-8" text-color="white" icon="business" />
              </q-item-section>
              <q-item-section>
                <q-item-label>MRP</q-item-label>
              </q-item-section>
            </q-item>                                  
            <q-item dense clickable tag="a" to="/cs/dtPenjualan">
              <q-item-section avatar>
                <q-avatar rounded color="deep-orange-13" text-color="white" icon="fas fa-book"/>
              </q-item-section>
              <q-item-section>
                <q-item-label>Data Penjualan</q-item-label>
              </q-item-section>
            </q-item>                  
          </q-expansion-item>          
          <q-expansion-item :content-inset-level="1">
            <template v-slot:header>
              <q-item-section avatar>
                <q-avatar rounded color="teal-13" text-color="white" icon="fas fa-chart-pie"/>
              </q-item-section>
              <q-item-section>
                Laporan Keuangan
              </q-item-section>
            </template>           
            <q-item dense clickable tag="a" to="/cs/piutang">
              <q-item-section avatar>
                <q-avatar rounded color="blue-13" text-color="white" icon="account_balance_wallet"></q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label>Piutang Customer</q-item-label>
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
            <q-item dense clickable tag="a" to="/cs/partner">
              <q-item-section avatar>
                <q-avatar rounded color="light-blue-9" text-color="white" icon="people" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Data Customers</q-item-label>
              </q-item-section>
            </q-item>
          </q-expansion-item>
          <q-expansion-item :content-inset-level="1">
            <template v-slot:header>
              <q-item-section avatar>
                <q-avatar rounded color="cyan-9" text-color="white" icon="fas fa-cubes"/>
              </q-item-section>
              <q-item-section>
                Product
              </q-item-section>
            </template>
            <q-item dense clickable tag="a" to="/cs/produk">
              <q-item-section avatar>
                <q-avatar rounded color="blue-9" text-color="white" icon="fas fa-cubes"/>
              </q-item-section>
              <q-item-section>
                <q-item-label>Data Produk</q-item-label>
              </q-item-section>
            </q-item> 
            <q-item dense clickable tag="a" to="/cs/stok">
              <q-item-section avatar>
                <q-avatar rounded color="pink-13" text-color="white" icon="fas fa-cubes"/>
              </q-item-section>
              <q-item-section>
                <q-item-label>Stok Barang</q-item-label>
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
// import AvatarCropper from 'vue-avatar-cropper'
import { upass } from '../services/apiList'
export default {
  name: 'cs',
  /* preFetch ({ store, redirect }) {
    store.dispatch('auth/user')
      .then(a => {
        console.log(a)
        if (a !== 'sales') {
          let rd = a || 'login'
          redirect(`/${rd}`)
        }
      })
  }, */
  beforeCreate () {
    this.$store.dispatch('auth/user')
      .then(a => {
        if (a !== 'cs') {
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
      tab: 'mails',
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
      }
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
