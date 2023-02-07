<template>
  <q-page class="flex flex-center">
    <q-card class="my-card">
      <q-card-section class="bg-primary text-white">
        <div class="text-h6 center">Login</div>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <q-form
          @submit="ambil"
          @reset="onReset"
          class="q-gutter-md">
          <q-input filled v-model="lgn.username" label="Username" :rules="inRul" />
          <q-input filled v-model="lgn.password" label="Sandi" type="password" :rules="inRul"/>
          <div align="right">
            <q-btn label="Submit" type="submit" color="primary"/>
            <q-btn label="Reset" type="reset" color="primary" flat class="q-ml-sm" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script>
export default {
  name: 'login',
  data () {
    return {
      data: [],
      lgn: { username: '', password: '' },
      inRul: [ v => !!v || 'Isi data' ]
    }
  },
  methods: {
    ambil () {
      this.$store.dispatch('auth/loginUser', this.lgn)
        .then((res) => {
          //        this.$store.commit('auth/user', res.user[0])
          let user = res.user[0].userType
          switch (user) {
            case 'sales':
              this.$router.push('/sales')
              break
            case 'admin' :
              this.$router.push('/admin')
              break
            case 'purchase' :
              this.$router.push('/purchase')
              break
            case 'acc' :
              this.$router.push('/acc')
              break
            case 'mitra' :
              this.$router.push('/mitra')
              break
            case 'MAN':
              this.$router.push('/')
              break
            default:
              this.$q.notify({
                color: 'negative',
                position: 'top',
                message: `login gagal...`,
                icon: 'report_problem'
              })
          }
        })
        .catch((err) => {
          console.log(err)
          this.$q.notify({
            color: 'negative',
            position: 'top',
            message: `${err.response.data}`,
            icon: 'report_problem'
          })
        })
    },
    onReset () {
      this.lgn = { username: '', password: '' }
    }
  }
}
</script>
<style lang="sass" scoped>
.my-card
  width: 100%
  max-width: 300px
</style>
