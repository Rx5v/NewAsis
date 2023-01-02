<template>
  <q-page padding>
    <dataJurnal @add="adP = true"/>
    <q-dialog
      v-model="adP">
      <q-card style="width: 700px; max-width: 80vw;">
        <q-card-section>
          <inJur/>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import inJur from '../../components/acc/inJur'
import dataJurnal from '../../components/dataJurnal'
export default {
  name: 'jurnalUmum',
  components: {
    dataJurnal,
    inJur
  },
  data () {
    return {
      adP: false
    }
  }
}
</script>
