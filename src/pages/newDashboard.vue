<template>
  <q-layout>
    <q-header
      class="bg-white shadow-6 flex flex-center"
      style="height: 70px;color: #190f70;"
    >
      <q-toolbar>
        <q-btn flat round dense icon="apps" to="/menu" class="q-mr-md"
          ><q-tooltip content-class="bg-indigo-10" :offset="[10, 10]">
            Menu
          </q-tooltip></q-btn
        >
        <q-toolbar-title>
          Dashboard
        </q-toolbar-title>
        <q-space></q-space>
        <div class="row gt-sm">
          <q-tabs v-for="me in menu" :key="me">
            <q-separator vertical inset class="q-mx-md" />
            <q-item clickable v-ripple :to="`${me.to}`" dense>
              <q-item-section> {{ me.menu }} </q-item-section>
            </q-item>
          </q-tabs>
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
        </div>
        <q-btn flat round dense color="red-9" icon="date_range" class="q-mr-lg">
          <q-tooltip content-class="bg-indigo-10">Atur Periode</q-tooltip>
          <q-menu>
            <div class="row no-wrap q-pa-xl">
              <div class="column">
                <div class="text-5">Tanggal :</div>
              </div>
            </div>
          </q-menu>
        </q-btn>

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
        <div class="lt-md">
          <q-btn
            flat
            round
            icon="menu"
            @click="rightDrawerOpen = !rightDrawerOpen"
          />
        </div>
      </q-toolbar>
    </q-header>
    <q-drawer v-model="rightDrawerOpen" side="left" content-class="bg-indigo-1">
      <q-list v-for="m in menu" :key="m">
        <q-item
          clickable
          v-ripple
          :to="`${m.to}`"
          style="background-color: white"
        >
          <q-item-section> {{ m.menu }} </q-item-section>
        </q-item>
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
  </q-layout>
</template>

<script>
import { cabang, newNotif, upass } from '../services/apiList'
export default {
  sockets: {
    cekOnline: function (data) {
      this.onlineUser = data
      this.ck = true
    },
    pesan: function (data) {
      this.$q.notify({
        message: data.text,
        color: 'red',
        position: 'bottom-right',
        timeout: 30000,
        caption: `Pesan dari ${data.dari.nama}`,
        actions: [
          {
            label: 'Konfirm',
            color: 'yellow',
            handler: () => {
              this.$socket.emit('balas', {
                kepada: data.dari.akun,
                dari: this.$store.state.auth.user.nama,
                text: 'Oke...'
              })
            }
          }
        ]
      })
    },
    umbal: function (data) {
      this.$q.notify({
        message: data.text,
        color: 'red',
        position: 'bottom-right',
        timeout: 30000,
        caption: `Pesan dari ${data.dari}`
      })
    }
  },
  data () {
    return {
      rightDrawerOpen: false,
      tema: false,
      label: { submit: 'Upload', cancel: 'Batal' },
      u: { pass: '', password: '' },
      rules: {
        required: [value => !!value || 'Required.'],
        min: [v => (v && v.length >= 4) || 'Min 4 characters'],
        cek: [v => v === this.u.pass || 'Password tidak sama...']
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
      menu: [
        {
          menu: 'Dashboard Faa',
          to: '/acc/newDashboardFaa'
        },
        {
          menu: 'Dashboard Investor',
          to: '/acc/newDashboardInvestor'
        },
        {
          menu: 'Dashboard HO',
          to: '/acc/dashboard'
        }
      ],
      tgl: {
        from:
          new Date()
            .toLocaleString('sv', { timeZoneName: 'short' })
            .slice(0, 8) + '01',
        to: new Date()
          .toLocaleString('sv', { timeZoneName: 'short' })
          .slice(0, 10)
      }
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
    this.$store.dispatch('auth/user').then(a => {
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
      newNotif().then(({ data }) => {
        this.not = data
      })
    },
    cekStatus () {
      this.$socket.emit('getOnline')
    },
    kirimPesan () {
      this.$q
        .dialog({
          title: 'Kirim Pesan',
          message: 'Tulis pesan ke semua user...',
          prompt: {
            model: '',
            type: 'text' // optional
          },
          cancel: true,
          persistent: true
        })
        .onOk(data => {
          if (data) {
            this.$socket.emit('sendAll', {
              dari: {
                nama: this.$store.state.auth.user.nama,
                akun: this.$store.state.auth.user.akun
              },
              text: data
            })
          }
          // console.log('>>>> OK, received', data)
        })
        .onCancel(() => {
          // console.log('>>>> Cancel')
        })
        .onDismiss(() => {
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
          this.$q.notify({
            message: `${err.response.data.st}`,
            color: 'purple'
          })
        })
    },
    handleUploaded (resp) {
      console.log(resp)
      this.userAvatar = '/statics/photo/' + resp.photo
    },
    logout () {
      this.$store.dispatch('auth/logoutUser').then(res => {
        this.$router.push('/login', () => this.$router.go(0))
      })
    }
  }
}
</script>
<style>
body {
  font-family: Lexend Deca;
}
.q-layout {
  background-color: rgb(232, 235, 255);
}
</style>
