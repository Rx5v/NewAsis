<template>
  <q-page padding>
    <q-table
      class="dataTrx"
      :data="dataExp"
      :columns="jdl"
      row-key="idExp"
      :pagination.sync="halaman"
      :filter="cari"
      dense>
      <template v-slot:top>
        <div class="col-2 q-table__title">Buku Hutang Expedisi</div>
        <q-input dense debounce="300" v-model="cari" placeholder="Search" class="q-ml-sm">
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
          multiple
          style="min-width: 250px; max-width: 300px"
          label="Pilih cabang... "
          :rules="inRul"
          @input="expDt"
          dense
          lazy-rules/>
      </template>
      <template
        v-slot:body-cell-no="props">
        <q-td auto-width>
            {{ dataExp.indexOf(props.row) + 1 }}
        </q-td>
      </template>
      <template
        v-slot:body-cell-noresi="props">
        <q-td >
          {{ props.row.noresi }}
          <q-popup-edit v-model="props.row.noresi">
            <q-input
              v-model="props.row.noresi"
              label="Nomor Resi"
              dense
              autofocus
              @change="upExp(props.row)"/>
          </q-popup-edit>
        </q-td>
      </template>
      <template
        v-slot:body-cell-biaya="props">
        <q-td align="right">
            {{ props.row.biaya | duit }}
        </q-td>
      </template>
      <template
        v-slot:body-cell-act="props">
        <q-td auto-width>
          <q-btn label="cek Bayar" color="teal" flat @click="getByr(props.row)"/>
          <q-btn label="jurnal" color="teal" flat @click="cj=true,getJur(props.row)"/>
        </q-td>
      </template>
    </q-table>
    <q-dialog
      v-model="cj"
      full-width>
      <edJur ref="dtJurnal" :detJur="detJur" :jh="jh" @ok="cj=false"/>
    </q-dialog>
    <q-dialog
      v-model="ck"
      full-width>
      <q-table
        class="detHP"
        :data="detByr"
        :columns="jdlB"
        row-key="iddetJur"
        separator="cell"
        no-data-label="Belum ada pembayaran"
        dense>
        <template v-slot:top>
          <div class="col-2 q-table__title">Detail Pembayaran </div>
          <q-chip >{{ exp.namaExpedisi }}</q-chip>
          <q-chip >Nomer Resi: {{ exp.noresi }}</q-chip>
          <q-chip >Biaya: {{ exp.biaya | duit }}</q-chip>
        </template>
        <template
          v-slot:body-cell-nilai="props">
          <q-td align="right">
              {{ props.row.nilai | duit }}
          </q-td>
        </template>
        <template v-slot:bottom-row>
          <q-tr>
            <q-th colspan="4" align="center">Jumlah Total Terbayar</q-th>
            <q-th align="right">{{ detByr.reduce((a,b)=> $dwn.jumlah([a,b.nilai]),0) | duit }}</q-th>
          </q-tr>
          <q-tr class="text-red">
            <q-th colspan="4" align="center" class="text-red">Sisa Hutang</q-th>
            <q-th align="right" >{{ exp.biaya-detByr.reduce((a,b)=> $dwn.jumlah([a,b.nilai]),0) | duit }}</q-th>
          </q-tr>
        </template>
        <template v-slot:no-data="{ message }">
          <div class="full-width row flex-center text-error q-gutter-sm">
            <q-icon size="2em" name="sentiment_dissatisfied" />
            <span>
              {{ message }}
            </span>
          </div>
        </template>
      </q-table>
    </q-dialog>
    <!-- content -->
  </q-page>
</template>

<script>

import { cabang, detExp, addTrxpaket, getJurtrans, cekByr } from '../services/apiList'
import { reactive, toRefs, computed } from '@vue/composition-api'
import edJur from './acc/edJur'
export default {
  components: {
    edJur
  },
  setup (props, { root }) {
    const dt = reactive({
      cari: '',
      cabAll: [],
      inRul: [ v => !!v || 'Isi data' ],
      filt: { kodeCab: [] },
      options: [],
      halaman: { rowsPerPage: 10 },
      dataExp: [],
      jdl: [
        { name: 'no', label: 'No.' },
        { name: 'kodeCab', label: 'Kode Cab', field: row => row.kodeCab, align: 'left' },
        { name: 'nomorBukti', label: 'nomorBukti', sortable: true, field: row => row.nomorBukti, align: 'left' },
        { name: 'tglKirim', label: 'tglKirim', field: row => row.tglKirim, align: 'left' },
        { name: 'noresi', label: 'noresi', sortable: true, field: row => row.noresi, align: 'left' },
        { name: 'namaExpedisi', label: 'namaExpedisi', field: row => row.namaExpedisi, align: 'left' },
        { name: 'alamatTujuan', label: 'alamatTujuan', field: row => row.alamatTujuan, align: 'left' },
        { name: 'biaya', label: 'biaya', sortable: true, field: row => row.biaya, jml: 'Y', align: 'right' },
        { name: 'act', label: 'act' }
      ],
      detJur: [],
      jh: {},
      cj: false,
      ck: false,
      jdlB: [
        { name: 'tgl', label: 'tgl', field: row => row.tgl, align: 'left' },
        { name: 'nomorJurnal', label: 'Nomor Jurnal', field: row => row.nomorJurnal, align: 'left' },
        { name: 'desk', label: 'Judul', field: row => row.desk, align: 'left' },
        { name: 'kodeAkun', label: 'Akun', field: row => row.namaAkun, align: 'right' },
        { name: 'nilai', label: 'nilai', field: row => row.nilai, jml: 'Y', align: 'right' }
      ],
      detByr: [],
      exp: {}
    })
    const total = computed(() => {
      let x = {}
      x.biaya = dt.dataExp.reduce((a, b) => root.$dwn.jumlah([a, b.biaya]), 0)
      return x
    })
    const expDt = () => {
      detExp(dt.filt)
        .then(({ data }) => {
          dt.dataExp = data
        })
    }
    expDt()
    cabang()
      .then(({ data }) => {
        dt.cabAll = data
      })
    const upExp = (x) => {
      addTrxpaket(x)
        .then(res => {
          root.$q.notify({ message: `${res.data.st}`, color: 'teal' })
        })
        .catch((err) => {
          root.$q.notify({ message: `${err.response.data.st}`, color: 'purple' })
        })
    }
    const getJur = (x) => {
      getJurtrans(x)
        .then(({ data }) => {
          dt.detJur = data
          dt.jh = data[0]
        })
        .catch((err) => {
          console.log(err)
        })
    }
    const getByr = (x) => {
      if (x) {
        x.kodeAkun = '210150003'
        dt.exp = x
        dt.detByr = []
        cekByr(x)
          .then(({ data }) => {
            dt.detByr = data
            dt.ck = true
          })
          .catch((err) => {
            root.$q.notify({ message: `${err.response.data.st}`, color: 'purple' })
          })
      }
    }
    const toDown = () => {
      let x = {
        judul: `Data Expedisi Cabang ${root.$store.state.auth.user.namaCabang} `,
        dt: dt.dataExp,
        hdr: dt.jdl,
        naFile: `dataExp`
      }
      root.$dwn.toExcel(x)
    }
    return { ...toRefs(dt), expDt, total, toDown, upExp, getJur, getByr }
  }
}
</script>
