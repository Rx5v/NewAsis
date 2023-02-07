<template>
  <q-page padding>
    <q-table
      class="dataTrx"
      :data="dtBarang"
      :columns="jdl"
      row-key="kodeProduk"
      selection="single"
      :selected.sync="selected"
      :pagination.sync="halaman"
      :filter="cari"
      dense>
      <template v-slot:top>
        <div class="col-2 q-table__title">Data Stok Barang Semua Cabang</div>
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
        <q-space />
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
            @input="getStok()"
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
                  <q-checkbox v-model="filt.kodeCab" :val="scope.opt.kodeCab" @input="getStok()"/>
                </q-item-section>
              </q-item>
            </template>
            <template v-slot:selected>
              {{ filt.kodeCab.length }} cabang
            </template>
          </q-select>
          <q-toggle v-model="filt.allCab" label="Pilih semua..." @input="gantiCab(filt.allCab)"/>
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
      </template>
    </q-table>
    <!-- content -->
  </q-page>
</template>

<script>

import { company, dtCab, dtProduk, getProdukCat, stokall } from '../services/apiList'
import { reactive, toRefs, computed, onMounted } from '@vue/composition-api'
export default {
  setup (props, { root }) {
    const dt = reactive({
      dtProduk: [],
      adP: false,
      inRul: [ v => !!v || 'Isi data' ],
      selected: [],
      cari: '',
      cabAll: [],
      kodeCab: [],
      halaman: { rowsPerPage: 10 },
      filt: {
        allCab: false,
        kodeCab: [root.$store.state.auth.user.kodeCab],
        kodeCat: []
      },
      dtPivot: {
        rows: ['kodeProduk', 'namaBarang'],
        cols: ['kodeCab'],
        vals: ['saldo']
      },
      divCab: [],
      divisi: '',
      dtComp: [],
      allCabang: [],
      allCat: true,
      produkCat: [],
      options: []
    })
    onMounted(() => {
      company()
        .then(({ data }) => {
          dt.dtComp = data
        })
      dtCab()
        .then(({ data }) => {
          // dt.filt.kodeCab = data.map(a => a.kodeCab)
          dt.allCabang = data // .filter(a => a.compCode === root.$store.state.auth.user.compCode)
          const pegang = root.$store.state.auth.user.cabGrup || root.$q.cookies.get('cabGrup')
          dt.cabAll = data.filter(a => pegang.some(s => s === a.kodeCab))
          let st = new Set(dt.cabAll.map(a => a.compCode))
          dt.divisi = '' // [...st]
          dt.divCab = dt.dtComp.filter(a => st.has(a.compCode))
          getStok()
          // dt.filt.kodeCab = pegang
        })
    })
    const jdl = computed(() => {
      let j = [
        { name: 'kodeProduk', label: 'Kode', field: row => row.kodeProduk, align: 'left', sortable: true },
        { name: 'namaBarang', label: 'Nama Produk', field: row => row.namaBarang, align: 'left', sortable: true }
      ]
      if (dt.allCabang.length) {
        for (let i in dt.filt.kodeCab) {
          j.push({ name: dt.allCabang.find(a => a.kodeCab === dt.filt.kodeCab[i]).namaCabang, label: dt.allCabang.find(a => a.kodeCab === dt.filt.kodeCab[i]).namaCabang, field: row => row[dt.filt.kodeCab[i]], jml: 'Y', align: 'right', sortable: true })
        }
      }
      j.push({ name: 'totalSaldo', label: 'Total Stok', field: row => row.totalSaldo, jml: 'Y', align: 'right', sortable: true })
      return j
    })
    const pilihan = computed(() => {
      return ['kodeProduk', 'namaBarang', ...dt.filt.kodeCab]
    })
    const getStok = () => {
      if (dt.filt.kodeCab.length) {
        stokall(dt.filt.kodeCab)
          .then(({ data }) => {
            dt.dtProduk = data
          })
          .catch((err) => {
            console.log(err)
          })
      }
    }
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
    getProdukCat()
      .then(res => {
        dt.produkCat = res.data
        dt.filt.kodeCat = dt.produkCat.map(a => a.kodeCat)
      })
    const gantiCab = (x) => {
      dt.filt.kodeCab = []
      if (x) {
        dt.filt.kodeCab = dt.allCabang.filter(a => dt.divisi === a.compCode).map(a => a.kodeCab)
        dt.filt.allCab = true
        getStok()
      } else {
        dt.filt.kodeCab = []
        dt.rkpTgl = []
        // dt.divisi = []
      }
    }
    const dtBarang = computed(() => {
      const dtFilt = dt.dtProduk.filter(a => dt.filt.kodeCat.some(x => x === a.kodeCat))
      return dtFilt
    })
    const toDown = () => {
      const jd = [ ...jdl.value ]
      let x = {
        judul: 'Data Stok All Cabang',
        dt: dtBarang.value,
        hdr: jd,
        naFile: 'StokAllCabang_'
      }
      root.$dwn.toExcel(x)
    }
    return { ...toRefs(dt), jdl, getStok, pilihan, gantiCab, filterFn, pilKat, dtBarang, toDown }
  },
  watch: {
    selected: function (v) {
      let e = Object.assign({}, v[0])
      this.$emit('dtStok', e)
    }
  }
}
</script>
