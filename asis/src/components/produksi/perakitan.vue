<template>
  <div>
    <q-table
      class="dataTrx"
      :data="dtRakit"
      :columns="jdl"
      row-key="nomorBukti"
      :filter="cari"
      dense>
      <template v-slot:top>
        <div class="col-2 q-table__title">Data Perakitan Produk</div>
        <q-input dense debounce="300" v-model="cari" placeholder="Search" class="q-ml-sm">
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
        <q-input filled v-model="filt.tgl" label="Dari Tanggal" dense lazy-rules readonly>
          <q-icon name="event" class="cursor-pointer">
            <q-popup-proxy ref="qDateProxy" transition-show="scale" transition-hide="scale">
              <q-date v-model="filt.tgl" @input="() => ($refs.qDateProxy.hide(),getList())" mask="YYYY-MM-DD" lazy-rules/>
            </q-popup-proxy>
          </q-icon>
        </q-input>
        <!-- <q-btn
          flat round dense
          icon="add_circle"
          color="accent"
          @click="adP = true"
          class="q-ml-md"
        /> -->
        <q-space/>
        <q-input dense debounce="300" v-model="cari" placeholder="Search">
          <template v-slot:append>
            <q-icon name="search" />
            <q-btn
              flat round dense
              icon="file_download"
              @click="toDown"
              class="q-ml-md"
              color="primary"
            />
          </template>
        </q-input>
        <q-select
          v-if="['MAN','purchase','acc'].some(a=> a== $store.state.auth.user.userType)"
          v-model="filt.kodeCab"
          :options="cabAll"
          :option-label="(item) => item && item.kodeCab + ' ' + item.namaCabang"
          option-value="kodeCab"
          emit-value
          map-options
          style="min-width: 250px; max-width: 300px"
          label="Pilih cabang... "
          dense
          @input="getList"
          lazy-rules/>
      </template>
      <template v-slot:body-cell-No="props">
        <q-td auto-width>
          {{dtRakit.indexOf(props.row) +1}}
        </q-td>
      </template>
      <template v-slot:body-cell-qty="props">
        <q-td auto-width align="right">
          {{ props.row.qty | nomer }}
        </q-td>
      </template>
      <template v-slot:body-cell-hpp="props">
        <q-td auto-width align="right">
          {{ props.row.hpp | duit }}
        </q-td>
      </template>
      <template v-slot:body-cell-act="props">
        <q-td auto-width v-if="['MAN','purchase','acc'].some(a=> a== $store.state.auth.user.userType)">
          <q-btn label="jurnal" flat color="teal" @click="cj=true, getJur(props.row)"/>
        </q-td>
      </template>
    </q-table>
    <q-dialog
      v-model="cj"
      full-width>
      <edJur ref="dtJurnal" :detJur="detJur" :jh="jh" @ok="cj=false"/>
    </q-dialog>
  </div>
</template>
<script>
import { reactive, toRefs } from '@vue/composition-api'
import { cabang, getRakit, getJurtrans } from '../../services/apiList'
import edJur from '../acc/edJur'
export default {
  components: {
    edJur
  },
  setup (props, { root }) {
    const dt = reactive({
      dtRakit: [],
      jdl: [
        { name: 'No', label: 'No', align: 'right' },
        { name: 'nomorBukti', label: 'nomorBukti', field: row => row.nomorBukti, align: 'left' },
        { name: 'tgl', label: 'tgl', field: row => row.tgl, align: 'left' },
        { name: 'kodeProduk', label: 'Kode Produk', field: row => row.kodeProduk, align: 'left' },
        { name: 'namaBarang', label: 'Nama Barang', field: row => row.namaBarang, align: 'left' },
        { name: 'qty', label: 'qty', sortable: true, field: row => row.qty, jml: 'Y', align: 'right' },
        { name: 'namaKaryawan', label: 'Nama Karyawan', field: row => row.namaKaryawan, align: 'left' },
        // { name: 'hpp', label: 'hpp', sortable: true, field: row => row.hpp, jml: 'Y', align: 'right' },
        { name: 'act', label: 'Act' }
      ],
      cari: '',
      filt: { kodeCab: 'MP01', tgl: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 8) + '01' },
      cabAll: [],
      cj: false,
      detJur: [],
      jh: {}
    })
    const getJur = (x) => {
      getJurtrans({ nomorBukti: x.nomorBukti.slice(0, 16) })
        .then(({ data }) => {
          dt.detJur = data
          dt.jh = data[0]
        })
        .catch((err) => {
          console.log(err)
        })
    }
    const getList = () => {
      getRakit(dt.filt)
        .then(({ data }) => {
          dt.dtRakit = data
        })
    }
    cabang()
      .then(({ data }) => {
        dt.cabAll = data
      })
    getList()
    const toDown = () => {
      let x = {
        judul: `Data Perakitan dari tanggal ${dt.filt.tgl} `,
        dt: dt.dtRakit,
        hdr: dt.jdl,
        naFile: `Perakitan${dt.filt.tgl}`
      }
      root.$dwn.toExcel(x)
    }
    return { ...toRefs(dt), toDown, getList, getJur }
  }
}
</script>
