<template>
  <q-card style="width: 800px">
    <q-card-section>
      <div class="text-h6">Check Serial Nomer</div>
      <q-separator color="purple" spaced/>
    </q-card-section>
    <q-card-section>
      <q-input v-model="cari" :hint="`Serial No : ${cari}`" persistent-hint
        label="Serial No"
        counter>
        <template v-slot:append>
          <q-icon name="search" />
          <q-btn
            round dense
            icon="check"
            @click="cariBar(cari)"
            class="q-ml-md"
            color="primary"
          />
          <q-icon name="camera" @click="scan" class="text-orange q-ml-md" />
        </template>
      </q-input>
      <q-list bordered padding>
        <q-item-label header>List Penjualan</q-item-label>
        <q-item
          v-for="(i) in dataSN"
          :key="i"
        >
          <q-item-section>
            <q-item-label>
              {{ i.nomorBukti }}
            </q-item-label>
            <q-item-label caption lines="2">
              {{ i.namaBarang }}
            </q-item-label>
          </q-item-section>
          <q-item-section>
            <q-item-label>
              {{ i.tglKirim }}
            </q-item-label>
            <q-item-label caption lines="2">
              {{ i.status }}
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-item-label caption>{{ i.namaPartner }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-card-section>
  </q-card>
</template>
<script>
import { cariSN } from '../services/apiList'

export default {
  data: () => ({
    cari: '',
    dtCari: [],
    dtSearch: [],
    dataSN: []
  }),
  methods: {
    scan () {
      if (typeof cordova !== 'undefined') {
        cordova.plugins.barcodeScanner.scan(
          result => {
            this.cariBar(result.text)
          },
          (error) => {
            this.$q.notify({ message: `ada kesalahan ${error}`, color: 'purple' })
          },
          {
            preferFrontCamera: false, // iOS and Android
            showFlipCameraButton: true, // iOS and Android
            showTorchButton: true, // iOS and Android
            saveHistory: true, // Android, save scan history (default false)
            prompt: 'Place a barcode inside the scan area', // Android
            resultDisplayDuration: 500, // Android, display scanned text for X ms. 0 suppresses it entirely, default 1500
            //           formats: 'QR_CODE,PDF_417', // default: all but PDF_417 and RSS_EXPANDED
            orientation: 'portrait', // Android only (portrait|landscape), default unset so it rotates with the device
            disableAnimations: true, // iOS
            disableSuccessBeep: false // iOS and Android
          }
        )
      } else {
        this.$q.notify({ message: 'buka di mobile device....', color: 'accent' })
      }
    },
    async cariBar (x) {
      try {
        const { data } = await cariSN(x)
        this.cari = x
        this.dataSN = data
        this.$q.notify({ message: `${data[0].namaBarang}`, color: 'primary' })
      } catch (err) {
        this.$q.notify({ message: `Tidak ketemu....`, color: 'warning' })
        console.log(err)
      }
    }
  }
}
</script>
