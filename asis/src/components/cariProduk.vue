<template>
  <q-card>
    <q-card-section>
      <q-select
        filled
        v-model="cari"
        use-input
        hide-selected
        fill-input
        input-debounce="0"
        :options="dtCari"
        option-label="namaBarang"
        option-value="kodeProduk"
        @filter="filterFn"
        @input="emi()"
        label="Cari Produk..."
        :hint="`kode : ${cari ? cari.kodeProduk :''}`"
      >
        <template v-slot:no-option>
          <q-item>
            <q-item-section class="text-grey">
              No results
            </q-item-section>
          </q-item>
        </template>
        <template v-slot:selected-item>
          <q-item>
            <q-item-section class="text-grey">
              {{ selected }}
            </q-item-section>
          </q-item>
        </template>
        <template v-slot:option="scope">
          <q-item
            v-bind="scope.itemProps"
            v-on="scope.itemEvents"
          >
            <q-item-section>
              <q-item-label>{{scope.opt.kodeProduk}}</q-item-label>
              <q-item-label caption>SKU: {{scope.opt.sku}} Nama: {{scope.opt.namaBarang}}</q-item-label>
            </q-item-section>
          </q-item>
        </template>
        <template v-slot:append>
          <q-icon
            v-if="cari !== null"
            class="cursor-pointer"
            name="clear"
            @click="cari = null"
          />
          <q-icon name="camera" @click="scan" class="text-orange" />
        </template>
      </q-select>
    </q-card-section>
  </q-card>
</template>
<script>
import { crProduk, crstok } from '../services/apiList'

export default {
  props: {
    jnsTrx: {
      type: String,
      default: 'B'
    },
    kodeCab: {
      type: String,
      default: ''
    }
  },
  data: () => ({
    cari: '',
    dtCari: [],
    dtSearch: []
  }),
  /* watch: {
    cari: function (v) {
      let e = Object.assign({}, v)
      console.log('cari ', e)
      if (e) this.$emit('dtProduk', e)
      this.cari = ''
    }
  }, */
  methods: {
    async filterFn (val, update, abort) {
      if (val.length < 2) {
        abort()
        return
      } else {
        const { data } = this.jnsTrx === 'J' ? await crstok({ text: val, kodeCab: this.kodeCab }) : await crProduk(val)
        this.dtSearch = data
      }
      update(async () => {
        const needle = val.toLowerCase()
        this.dtCari = this.dtSearch.filter(v => (v.namaBarang.toLowerCase().indexOf(needle) > -1 || v.sku.toLowerCase().indexOf(needle) > -1 || v.kodeProduk.toLowerCase().indexOf(needle) > -1))
      })
    },
    emi () {
      if (this.cari) {
        this.$emit('dtProduk', { ...this.cari })
        this.cari = ''
      }
    },
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
        const { data } = this.jnsTrx === 'J' ? await crstok({ text: x, kodeCab: this.kodeCab }) : await crProduk(x)
        this.cari = data[0]
        this.emi()
        this.$q.notify({ message: `${data[0].namaBarang}`, color: 'primary' })
      } catch (err) {
        this.$q.notify({ message: `Tidak ketemu....`, color: 'warning' })
        console.log(err)
      }
    }
  }
}
</script>
