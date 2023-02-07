<template>
  <q-page padding>
    <div class="row q-col-gutter-sm q-py-sm">
          <q-select
            class="q-ml-sm"
            v-if="['MAN','acc','purchase', 'mitra', 'admin'].some(a => a== $store.state.auth.user.userType)"
            v-model="divisi"
            :options="divCab"
            :option-label="(item) => item && item.compCode + ' ' + item.compName"
            option-value="compCode"
            emit-value
            map-options
            style="min-width: 250px; max-width: 250px"
            label="Divisi... "
            @input="gantiCab"
            dense
            lazy-rules/>
          <q-select
            class="q-ml-sm"
            v-if="['MAN','acc','purchase', 'mitra', 'admin'].some(a => a== $store.state.auth.user.userType)"
            v-model="filt.kodeCab"
            :options="cabAll.filter(a => divisi === a.compCode)"
            :option-label="(item) => item && item.kodeCab + ' ' + item.namaCabang"
            option-value="kodeCab"
            option-dense
            emit-value
            map-options
            multiple
            style="min-width: 250px; max-width: 550px"
            label="Pilih cabang... "
            dense
            @input="lihat()"
            lazy-rules>
            <template v-slot:option="scope">
              <q-item
                dense
                v-bind="scope.itemProps"
                v-on="scope.itemEvents"
              >
                <q-item-section>
                  <q-item-label>
                  {{ scope.opt.kodeCab }} {{ scope.opt.namaCabang }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-checkbox v-model="filt.kodeCab" :val="scope.opt.kodeCab" @input="lihat()"/>
                </q-item-section>
              </q-item>
            </template>
            <template v-slot:selected>
              {{ filt.kodeCab.length }} cabang
            </template>
          </q-select>
          <q-toggle v-model="filt.allCab" label="Pilih semua..." @input="gantiCab(filt.allCab)"/>
          <q-chip color="blue-6" class="text-white text-bold q-ml-md" outline clickable >Tahun : {{ filt.tgla }}
            <q-popup-proxy ref="qDateProxy" transition-show="scale" transition-hide="scale">
                <q-date v-model="filt.tgla" @input="(x) => x && (lihat(),$refs.qDateProxy.hide())" mask="YYYY" default-view="Years" :emit-immediately="true" lazy-rules/>
              </q-popup-proxy>
          </q-chip>
      <q-radio v-model="jenis" v-for="(a, i) in jnsLap" :key="i" :label="a.nama" :val="a" color="teal" keep-color/>
    </div>
    <div class="row q-gutter-sm q-py-md">
      <tabelBulanan :pilih="filt" :jenis="jenis"/>
      <!--
      <tabelBulanan :pilih="filt" :jenis="{ nama: 'Cabang', jnsGrup: 'namaCabang' }"/>
      <tabelBulanan :pilih="filt" :jenis="{ nama: 'Kategori Produk', jnsGrup: 'produkCategory' }"/> -->
    </div>
  </q-page>
</template>

<script>
import tabelBulanan from '../components/Dashboard/tabelBulanan.vue'
import { reactive, toRefs, watch } from '@vue/composition-api'
import { company, dtCab } from '../services/apiList'
export default {
  components: { tabelBulanan },
  setup (props, { root, refs }) {
    const dt = reactive({
      filt: {
        allCab: false,
        kodeCab: [root.$store.state.auth.user.kodeCab],
        tgla: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 4),
        tglb: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10),
        jnsTrx: 'J',
        ancab: false
      },
      inRul: [ v => !!v || 'Isi data' ],
      cabAll: [],
      divCab: [],
      divisi: '',
      dtComp: [],
      tgl: {
        from: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 8) + '01',
        to: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10)
      },
      jenis: {
        nama: 'Cabang',
        jnsGrup: 'namaCabang'
      },
      jnsLap: [
        { nama: 'Sales', jnsGrup: 'namaKaryawan' },
        { nama: 'Cabang', jnsGrup: 'namaCabang' },
        { nama: 'Kategori Produk', jnsGrup: 'produkCategory' },
        { nama: 'Pelanggan', jnsGrup: 'namaPartner' }
      ]
    })
    company()
      .then(({ data }) => {
        dt.dtComp = data
      })
    dtCab()
      .then(({ data }) => {
        // dt.filt.kodeCab = data.map(a => a.kodeCab)
        const pegang = root.$store.state.auth.user.cabGrup || root.$q.cookies.get('cabGrup')
        dt.cabAll = data.filter(a => pegang.some(s => s === a.kodeCab))
        let st = new Set(dt.cabAll.map(a => a.compCode))
        dt.divisi = '' // [...st]
        dt.divCab = dt.dtComp.filter(a => st.has(a.compCode))
        // dt.filt.kodeCab = pegang
        lihat()
      })
    const lihat = () => {
    }
    const gantiCab = (x) => {
      dt.filt.kodeCab = []
      if (x) {
        dt.filt.kodeCab = dt.cabAll.filter(a => dt.divisi === a.compCode).map(a => a.kodeCab)
        dt.filt.allCab = true
        lihat()
      } else {
        dt.filt.kodeCab = []
        dt.rkpTgl = []
        // dt.divisi = []
      }
    }
    watch(() => root.$store.state.auth.setCabang, (val) => {
      dt.filt.kodeCab = [val]
      dt.filt.allCab = false
      lihat()
    })
    return { ...toRefs(dt), lihat, gantiCab }
  }
}
</script>
