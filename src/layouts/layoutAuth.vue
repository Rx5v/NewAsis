<template>
  <q-layout view="hHh Lpr fFf">
    <q-footer> </q-footer>
    <q-page-container class="authContainer">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
export default {
  // name: 'LayoutName',
  /* preFetch ({ store, redirect }) {
    store.dispatch('auth/user')
      .then(userType => {
        if (userType) {
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
  data () {
    return {
      tema: false
    }
  },
  watch: {
    tema: function (v) {
      v ? this.$q.dark.set(true) : this.$q.dark.set(false)
    }
  }
}
</script>
<style>
.authContainer {
  background-image: url("../statics/bgcolor.png") !important;
  background-color: rgba(1, 1, 1, 0.4);
  background-size: cover;
}
.q-drawer {
  background: rgba(17, 17, 17, 0.747);
}
.navigation-item {
  border-radius: 5px;
}
.tab-active {
  background-color: green;
}
/* .q-card{
    background-image: url('../statics/gelombang.svg')!important;
  } */
</style>
