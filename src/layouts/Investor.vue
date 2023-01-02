<template>
  <q-layout view="hHh Lpr lFf">
    <q-header
      class="bg-white shadow-6 flex flex-center"
      style="height: 70px;color: #190f70;"
    >
      <q-toolbar>
        <q-btn flat round dense icon="apps"
          @click="rightDrawerOpen = !rightDrawerOpen" class="q-mr-md"
          ><q-tooltip content-class="bg-indigo-10" :offset="[10, 10]">
            Menu
          </q-tooltip></q-btn
        >
        <q-toolbar-title>
          Dashboard
        </q-toolbar-title>
        <q-space></q-space>
        <div class="row gt-sm">
          <q-tabs v-for="me in menuBar" :key="me">
            <q-separator vertical inset class="q-mx-md" />
            <q-item clickable v-ripple :to="`${me.ke}`" dense>
              <q-item-section> {{ me.label }} </q-item-section>
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
      <q-list bordered padding class="rounded-borders">
        <q-item
          v-for="(menu, m) in menuBar" :key="m" :content-inset-level="1" :to="menu.ke">
            <q-item-section avatar>
              <q-avatar rounded :color="menu.color" text-color="white" :icon="menu.icon"/>
            </q-item-section>
            <q-item-section>
              {{ menu.label }}
            </q-item-section>
          <!-- <q-item
            v-for="(list, l) in menu.menu" :key="l"
            dense clickable tag="a" :to="list.ke">
            <q-item-section  :class="`text-${menu.color} text-bold`">
              <q-item-label>{{ list.nama }}</q-item-label>
            </q-item-section>
          </q-item> -->
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
import { computed, reactive, toRefs } from '@vue/composition-api'
import { upass } from '../services/apiList'
export default {
  beforeCreate () {
    this.$store.dispatch('auth/user')
      .then(a => {
        if (a !== 'investor') {
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
  setup (props, { root }) {
    const dt = reactive({
      menuBar: [
        { icon: 'fas fa-home', ke: '/investor', label: 'Dashboard', color: 'teal-6' },
        { icon: 'fas fa-pizza-slice', ke: '/investor/neraca', label: 'Neraca', color: 'blue-6' },
        { icon: 'fas fa-chart-pie', ke: '/investor/rugilaba', label: 'Rugi Laba', color: 'orange-6' },
        { label: 'Arus Kas', ke: '/investor/aruskas', icon: 'fas fa-chart-pie', color: 'accent' },
        { label: 'Buku Besar', ke: '/investor/bubes', icon: 'fas fa-chart-pie', color: 'purple-9' }
      ],
      rightDrawerOpen: false,
      tema: false,
      upld: false,
      userAvatar: undefined,
      label: { submit: 'Upload', cancel: 'Batal' },
      u: { pass: '', password: '' },
      rules: {
        required: [value => !!value || 'Required.'],
        min: [v => (v && v.length >= 4) || 'Min 4 characters'],
        cek: [(v) => v === dt.u.pass || 'Password tidak sama...']
      }
    })
    const photo = computed(() => {
      let dt = root.$axios.defaults.baseURL
      let url = dt.replace('/api', '')
      return `${url}/statics/photo/${root.$store.state.auth.user.photo}`
    })
    const uppass = (x) => {
      x.akun = root.$store.state.auth.user.akun
      upass(x)
        .then(({ data }) => {
          root.$q.notify({ message: `${data.st}`, color: 'teal' })
        })
        .catch(err => {
          root.$q.notify({ message: `${err.response.data.st}`, color: 'purple' })
        })
    }
    return {
      ...toRefs(dt),
      photo,
      uppass
    }
  },
  watch: {
    tema: function (v) {
      v ? this.$q.dark.set(true) : this.$q.dark.set(false)
    }
  },
  methods: {
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
