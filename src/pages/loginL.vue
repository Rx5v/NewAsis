<template>
  <q-page class="flex flex-center">
    <q-card class="my-card shadow-6 col-md-6">
      <q-card-section class="bg-primary text-white">
        <q-toolbar class="bg-primary text-white">
          <q-toolbar-title>Aston Sistem</q-toolbar-title>
          <q-btn flat round dense icon="fas fa-user-shield" />
        </q-toolbar>
      </q-card-section>
      <q-separator />
      <q-card-section horizontal class="q-py-sm q-px-sm justify-center">
        <div class="col-sm-6 q-px-sm">
          <q-img src="../assets/iso_urs1.jpg" :ratio="1" class="rounded-borders"/>
        </div>
        <div class="col-sm-6 q-px-sm">
          <q-form
            @submit="ambil"
            @reset="onReset"
            class="q-gutter-md">
            <q-input filled v-model="lgn.username" label="Username" :rules="inRul" />
            <q-input filled v-model="lgn.password" label="Sandi" type="password" :rules="inRul"/>
            <div align="right">
              <q-btn label="Reset" type="reset" color="warning" class="q-ml-sm" outline rounded />
              <q-btn label="Login" type="submit" color="primary" class="q-ml-sm" outline rounded/>
            </div>
          </q-form>
        </div>
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
          let user = res.user.userType
          this.$router.push(`/${user}`)
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
  max-width: 600px
  height: 450px
  border-radius: 20px
</style>
