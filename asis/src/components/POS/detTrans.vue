<template>
  <div class="flex flex-center">
    <q-card>
      <q-card-section>
        <q-form
          @reset="onReset"
          class="q-gutter-md">
          <q-table
            class="dataPR"
            :data="detTrx"
            :columns="jdld"
            row-key="kodeProduk"
            :pagination.sync="pagination"
            dense
            separator="cell">
            <template v-slot:top>
              <q-toolbar>
                <div class="col-4 q-table__title">{{ jenis.label }} Barang</div>
                <q-space/>
              </q-toolbar>
              <div class="row q-gutter-sm justify-between" >
                <div class="col-xs-6 col-sm-4 col-md-3">
                  <q-input filled v-model="jd.tgl" label="Tanggal" dense lazy-rules :rules="inRul" readonly/>
                </div>
                <div class="col-xs-6 col-sm-4 col-md-3" v-if="pr.ac==='N'">
                  <q-input :value="pr.namaPartner" dense lazy-rules readonly/>
                </div>
                <div class="col-xs-6 col-sm-4 col-md-3">
                  <q-input :value="jd.noBukti" dense lazy-rules readonly/>
                </div>
                <div class="col-xs-6 col-sm-4 col-md-3">
                </div>
                <div class="col-xs-6 col-sm-4 col-md-3">
                </div>
              </div>
            </template>
            <template v-slot:body="props">
              <q-tr :props="props">
                <q-td>
                  {{ detTrx.indexOf(props.row) +1 }}
                </q-td>
                <q-td key="kodeProduk" :props="props">
                  {{ props.row.kodeProduk }}
                </q-td>
                <q-td key="namaBarang" :props="props">
                  {{ props.row.namaBarang }}
                </q-td>
                <q-td key="qty" :props="props">
                  {{ props.row.qty }}
                </q-td>
                <template v-if="['MAN','purchase'].some(a=> a== $store.state.auth.user.userType) || pr.jnsTrx==='J'">
                  <q-td key="hargaSat" :props="props">
                    {{ props.row.hargaSat | duit }}
                  </q-td>
                  <q-td key="dpp" :props="props">
                    {{ props.row.dpp | duit }}
                  </q-td>
                  <q-td key="ppn" :props="props">
                    {{ props.row.ppn | duit }}
                  </q-td>
                </template>
                <q-td key="act"  :props="props">
                  <q-icon name="close" color="red" @click="ondel(props.row)" />
                </q-td>
              </q-tr>
            </template>
            <template
              v-if="['MAN','purchase'].some(a=> a== $store.state.auth.user.userType) || pr.jnsTrx==='J'"
              v-slot:bottom-row>
              <q-tr>
                <q-td colspan="5" align="right">Jumlah DPP</q-td>
                <q-td align="right"  colspan="2">{{ total.tdpp | duit }}</q-td>
              </q-tr>
              <q-tr>
                <q-td colspan="5" align="right">Jumlah PPN</q-td>
                <q-td align="right"  colspan="2">{{ total.tppn | duit }}</q-td>
              </q-tr>
              <q-tr>
                <q-td colspan="2">Biaya Kirim</q-td>
                <q-td colspan="3">
                  <q-select
                    clearable
                    dense
                    filled
                    color="purple-12"
                    v-model="exp.partnerID"
                    :options="expedisi"
                    option-value="kodePartner"
                    option-label="namaPartner"
                    emit-value
                    map-options
                    style="min-width: 250px; max-width: 300px"
                    label="Expedisi" />
                </q-td>
                <q-td class="text-right"  colspan="2">
                  {{ exp.biaya | duit }}
                </q-td>
              </q-tr>
              <q-tr>
                <q-td colspan="5" align="right">Total harga</q-td>
                <q-td align="right" colspan="2">{{ $dwn.jumlah([total.tharga,exp.biaya]) | duit }}</q-td>
              </q-tr>
            </template>
          </q-table>
          <div align="right">
            <q-btn label="Retur" type="submit" color="primary"/>
            <q-btn label="Reset" type="reset" color="primary" flat class="q-ml-sm" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </div>
</template>

<script>
import { exPartner, detTrx } from '../../services/apiList'
import { reactive, computed, toRefs } from '@vue/composition-api'

export default {
  // name: 'PageName',
  props: {
    jnsTrx: {
      type: String,
      default: function () {
        return 'J'
      }
    },
    status: {
      type: String,
      default: function () {
        return 'T'
      }
    },
    pr: {
      type: Object,
      default: function () {
        return {
          tgl: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10),
          jnsTrx: 'J',
          ct: 'tempo',
          ac: false,
          cabLain: '',
          tempo: '0'
        }
      }
    }
  },
  setup (props, { root }) {
    const dt = reactive({
      jd: {
        tgl: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10),
        noBukti: this.pr.nomorBukti
      },
      inRul: [ v => !!v || 'Isi data' ],
      selected: [],
      cari: '',
      expedisi: [],
      exp: { partnerID: null, biaya: 0 },
      pagination: {
        rowsPerPage: 15
      },
      ad: {},
      pil: false,
      dtpil: {},
      detTrx: []
    })
    exPartner()
      .then(res => {
        dt.expedisi = res.data
      })
    const jdld = computed(() => {
      let a = [
        { name: 'No', label: 'No', field: row => row.index, align: 'right' },
        { name: 'kodeProduk', label: 'Kode Produk', field: row => row.kodeProduk, align: 'left' },
        { name: 'namaBarang', label: 'Nama Produk', field: row => row.namaBarang, align: 'left' },
        { name: 'qty', label: 'Qty', field: row => row.qty, jml: 'Y', align: 'right' },
        { name: 'hargaSat', label: 'harga @', field: row => row.hargaSat, jml: 'Y', align: 'right' },
        // { name: 'hpp', label: 'hpp', field: row => row.hpp, align: 'right' },
        { name: 'dpp', label: 'DPP', field: row => row.dpp, jml: 'Y', align: 'right' },
        { name: 'ppn', label: 'PPN', field: row => row.ppn, jml: 'Y', align: 'right' },
        { name: 'act', label: 'Act' }
      ]
      let b = ['MAN', 'purchase'].some(a => a === root.$store.state.auth.user.userType) || props.pr.jnsTrx === 'J' ? a.splice(-1) : a.splice(4, 3)
      console.log(b)
      return a
    })
    const jenis = computed(() => {
      let x = {}
      x.label = props.pr.jnsTrx === 'J' ? 'Penjualan' : 'Pembelian'
      x.value = 'R' + props.pr.jnsTrx
      return x
    })
    const total = computed(() => {
      let x = {}
      x.totalHarga = dt.detTrx.reduce((a, b) => {
        return root.$dwn.jumlah([a, b.jmlHarga, b.ppn])
      }, 0)
      x.tdpp = dt.detTrx.reduce((a, b) => root.$dwn.jumlah([a, b.dpp]), 0)
      x.tppn = dt.detTrx.reduce((a, b) => root.$dwn.jumlah([a, b.ppn]), 0)
      x.tharga = root.$dwn.jumlah([x.tdpp, x.tppn])
      x.totalQty = dt.detTrx.reduce((a, b) => {
        return root.$dwn.jumlah([a, b.qty])
      }, 0)
      return x
    })
    const getdetTrx = (x) => {
      detTrx(x)
        .then(res => {
          dt.detPR = res.data
        })
        .catch((err) => {
          console.log(err)
          root.$q.notify({ message: `${err.response.data.st}`, color: 'purple' })
        })
    }
    const onReset = () => {
      //      this.pr = { tgl: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10), jnsTrx: 'J', ct: 'sales', ac: false, cabLain: '' }
      dt.detTrx = []
      dt.exp = {}
    }
    return {
      ...toRefs(dt),
      total,
      jenis,
      jdld,
      getdetTrx,
      onReset
    }
  },
  watch: {
    selected: function (v) {
      let e = Object.assign({}, v[0])
      this.$emit('dtBrg', e)
      this.getdetPR(e)
    }
  }
}
</script>
