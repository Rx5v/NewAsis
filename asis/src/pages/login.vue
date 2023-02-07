<template>
  <q-page class="flex flex-center">
    <q-card class="my-card shadow-4 col-md-4">
      <div style="height: 2%; background-color: #2B366E"></div>
      <q-card-section
        class="text-center"
        style="color:#353535;margin-bottom:5vh; margin-top:2vh"
      >
        <div class="text-h5 text-bold">ASIS</div>
        <div class="text-subtitle2">Aston Integrated System</div>
      </q-card-section>

      <q-card-section horizontal class="q-py-sm q-px-sm justify-center">
        <div class="col-sm-10 q-px-sm justify-center">
          <q-form @submit="ambil" @reset="onReset" class="q-gutter-md">
            <q-input
              standard
              v-model="lgn.username"
              label=" Username / Email  "
              type="text"
              :rules="inRul"
            >
              <template v-slot:prepend>
                <q-icon name="person" />
              </template>
            </q-input>
            <q-input
              standard
              v-model="lgn.password"
              label=" Password  "
              type="password"
              :rules="inRul"
            >
              <template v-slot:prepend>
                <q-icon name="lock" />
              </template>
            </q-input>

            <q-btn
              label="Login"
              type="submit"
              color="primary"
              style="width:300px"
            />
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
      inRul: [v => !!v || 'Isi data']
    }
  },
  methods: {
    async ambil () {
      let a = await this.$store.dispatch('auth/loginUser', this.lgn)
      if (a) {
        let user = a.user.userType
        this.$router.push(`/${user}`)
      }
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
  max-width: 400px
  height: 420px
  border-radius: 5px
</style>
