<template>
  <q-page padding>
    <q-table
      class="dataTrx"
      :data="dtBarang"
      :columns="jdl"
      row-key="kodeProduk"
      selection="multiple"
      :selected.sync="selected"
      :pagination.sync="halaman"
      :filter="cari"
      dense>
      <template v-slot:top>
        <div class="col-2 q-table__title">Data Stok Barang</div>
        <q-select
          v-if="!allCat"
          v-model="filt.kodeCat"
          use-input
          :options="options"
          :option-label="(item) => item && item.kodeCat + ' ' + item.produkCategory"
          option-value="kodeCat"
          @filter="filterFn"
          emit-value
          map-options
          multiple
          style="min-width: 250px; max-width: 300px"
          label="Pilih Kategori... "
          :rules="inRul"
          dense
          options-dense>
        </q-select>
        <div class="q-gutter-sm">
          <q-toggle v-model="allCat" label="All Kategori" color="orange" @input="pilKat"/>
        </div>
        <div class="q-gutter-sm">
          <q-toggle v-model="stKos" label="Stok Kosong" color="orange"/>
        </div>
        <q-space />
        <!-- <div class="q-gutter-sm">
          <q-checkbox v-model="milik" val="ASI" label="Aston" color="orange"/>
          <q-checkbox v-model="milik" val="MITRA" label="Cabang" color="warning"/>
        </div> -->
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
          v-model="kodeCab"
          :options="$store.state.auth.user.userType ==='MAN' ? cabAll : cabAsi"
          :option-label="(item) => item && item.kodeCab + ' ' + item.namaCabang"
          option-value="kodeCab"
          options-dense
          emit-value
          map-options
          style="min-width: 250px; max-width: 300px"
          label="Pilih cabang... "
          :rules="inRul"
          dense
          @input="getStok()"
          lazy-rules/>
      </template>
      <template
        v-slot:body-cell-hargaRetail="props">
        <q-td align="right">
          {{ props.row.hargaRetail | duit }}
        </q-td>
      </template>
      <template
        v-slot:body-cell-saldo="props">
        <q-td align="right">
          {{ props.row.saldo | nomer }}
        </q-td>
      </template>
      <template
        v-slot:body-cell-hpp="props">
        <q-td v-if="['MAN','purchase','acc','mitra'].some(a=> a== $store.state.auth.user.userType)" align="right">
            {{ props.row.hpp | duit }}
        </q-td>
      </template>
      <template
        v-slot:body-cell-nilaiPersediaan="props">
        <q-td v-if="['MAN','purchase','acc','mitra'].some(a=> a== $store.state.auth.user.userType)" align="right">
            {{ props.row.nilaiPersediaan | duit }}
        </q-td>
      </template>
      <template v-slot:bottom-row>
        <q-tr v-if="['MAN','purchase','acc','mitra'].some(a=> a== $store.state.auth.user.userType)">
          <q-th :colspan="['MAN','purchase','acc','mitra'].some(a=> a== $store.state.auth.user.userType) ? 6 : 5" align="center">Jumlah Total Persediaan</q-th>
          <q-th align="right">{{ total.persediaan | duit }}</q-th>
        </q-tr>
      </template>
    </q-table>
    <!-- content -->
  </q-page>
</template>

<script>

import { dtCab, stok, getProdukCat } from '../services/apiList'
import { reactive, toRefs, computed, watch } from '@vue/composition-api'
export default {
  props: {
    cabang: {
      type: String,
      default: ''
    }
  },
  setup (props, { root }) {
    const dt = reactive({
      dtProduk: [],
      adP: false,
      allCat: true,
      inRul: [ v => !!v || 'Isi data' ],
      selected: [],
      cari: '',
      cabAll: [],
      kodeCab: props.cabang === '' ? root.$store.state.auth.user.kodeCab : props.cabang,
      filt: { kodeCat: [] },
      options: [],
      milik: ['ASI', 'MITRA'],
      halaman: { rowsPerPage: 10 },
      stKos: false
    })
    const jdl = computed(() => {
      let a = ['MAN', 'purchase', 'acc', 'mitra'].some(a => a === root.$store.state.auth.user.userType) ? [
        { name: 'kodeProduk', label: 'Kode', field: row => row.kodeProduk, sortable: true, align: 'left' },
        { name: 'namaBarang', label: 'Nama Produk', field: row => row.namaBarang, sortable: true, align: 'left' },
        { name: 'SKU', label: 'SKU', field: row => row.sku, sortable: true, align: 'left' },
        { name: 'saldo', label: 'Stok', sortable: true, field: row => row.saldo, jml: 'Y', align: 'right' },
        { name: 'hpp', label: '@ hpp', sortable: true, field: row => row.hpp, align: 'right' },
        { name: 'nilaiPersediaan', label: 'nilaiPersediaan', sortable: true, field: row => row.nilaiPersediaan, jml: 'Y', align: 'right' },
        { name: 'hargaRetail', label: 'Harga Retail', sortable: true, field: row => row.hargaRetail, align: 'right' }
      ] : [
        { name: 'kodeProduk', label: 'Kode', field: row => row.kodeProduk, sortable: true, align: 'left' },
        { name: 'namaBarang', label: 'Nama Produk', field: row => row.namaBarang, sortable: true, align: 'left' },
        { name: 'SKU', label: 'SKU', field: row => row.sku, sortable: true, align: 'left' },
        { name: 'saldo', label: 'Stok', sortable: true, field: row => row.saldo, jml: 'Y', align: 'right' },
        { name: 'hargaRetail', label: 'Harga Retail', sortable: true, field: row => row.hargaRetail, jml: 'Y', align: 'right' }
      ]
      return a
    })
    const getStok = () => {
      // let compID = dt.cabAll.find(a => a.kodeCab === dt.kodeCab).compCode
      stok(dt.kodeCab)
        .then(({ data }) => {
          dt.dtProduk = data.map(a => {
            let s = a
            s.nilaiPersediaan = root.$dwn.kali([a.hpp, a.saldo])
            return s
          })
        })
        .catch((err) => {
          console.log(err)
        })
    }
    watch(() => root.$store.state.auth.setCabang, (val) => {
      dt.kodeCab = val
    })
    const dtBarang = computed(() => {
      let dtFilt = dt.dtProduk // .filter(a => a.shareToGrup.some(s => s === root.$store.state.auth.user.)) // .filter(a => dt.milik.some(x => a.compID === x) && dt.filt.kodeCat.some(x => x === a.kodeCat))
      return dt.stKos ? dtFilt : dtFilt.filter(a => a.saldo !== 0)
    })
    const total = computed(() => {
      let x = {}
      x.persediaan = dtBarang.value.reduce((a, b) => root.$dwn.jumlah([a, b.nilaiPersediaan]), 0)
      return x
    })
    const filterFn = (val, update) => {
      if (val === '') {
        update(() => {
          dt.options = dt.produkCat
        })
        return
      }
      update(() => {
        const needle = val.toLowerCase()
        dt.options = dt.produkCat.filter(v => (v.produkCategory.toLowerCase().indexOf(needle) > -1) || (v.kodeCat.toLowerCase().indexOf(needle) > -1))
      })
    }
    const pilKat = () => {
      dt.filt.kodeCat = dt.allCat ? dt.produkCat.map(a => a.kodeCat) : []
    }
    getStok()
    getProdukCat()
      .then(res => {
        dt.produkCat = res.data
        dt.filt.kodeCat = dt.produkCat.map(a => a.kodeCat)
      })
    dtCab()
      .then(({ data }) => {
        dt.cabAll = data
      })
    const cabAsi = computed(() => {
      return dt.cabAll.filter(a => a.compCode === 'ASI')
    })
    const toDown = () => {
      let x = {
        judul: `Data Stok Cabang ${root.$store.state.auth.user.namaCabang} `,
        dt: dtBarang.value,
        hdr: jdl.value,
        naFile: `dataStok`
      }
      root.$dwn.toExcel(x)
    }
    return { ...toRefs(dt), cabAsi, jdl, getStok, dtBarang, filterFn, pilKat, total, toDown }
  },
  watch: {
    selected: function (v) {
      this.$emit('dtStok', v)
    }
  }
}
</script>
