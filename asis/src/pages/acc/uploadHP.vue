<template>
  <q-page padding>
    <q-card>
      <q-card-section>
        <draftHP/>
      </q-card-section>
      <q-card-section>
        <draftJurnal class="q-mt-md"/>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script>
import draftHP from '../../components/acc/draftHP'
import draftJurnal from '../../components/acc/draftJurnal'
export default {
  // name: 'PageName',
  components: {
    draftHP,
    draftJurnal
  }
}
</script>
