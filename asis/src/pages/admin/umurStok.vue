<template>
  <q-page padding>
    <q-table
      :data="dtProduk"
      :columns="jdl"
      row-key="kodeProduk"
      :filter="cari"
      :pagination.sync="halaman"
      :visible-columns="visibleColumns"
      dense>
      <template v-slot:top>
        <div class="col-2 q-table__title">Data Umur Stok</div>
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
          <template v-slot:option="scope">
            <q-item
              v-bind="scope.itemProps"
              v-on="scope.itemEvents"
              dense
            >
              <q-item-section>
                <q-item-label v-html="scope.opt.produkCategory" ></q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-checkbox dense v-model="filt.kodeCat" :val="scope.opt.kodeCat" />
              </q-item-section>
            </q-item>
          </template>
        </q-select>
        <q-toggle v-model="allCat" label="All Kategori" color="orange"/>
        <q-select
          v-model="filt.umur"
          use-input
          :options="umur"
          option-label="text"
          emit-value
          map-options
          multiple
          style="min-width: 250px; max-width: 300px"
          class="q-ml-md"
          label="Pilih Umur... "
          :rules="inRul"
          dense
          options-dense>
        </q-select>
        <q-space />
        <q-chip color="blue" class="text-white">{{ filt.tgla }}
          <q-popup-proxy ref="qDateProxy" transition-show="scale" transition-hide="scale">
            <q-date v-model="filt.tgla" @input="(x) => x && (getUmur(),$refs.qDateProxy.hide())" mask="YYYY-MM-DD" lazy-rules :rules="inRul"/>
          </q-popup-proxy>
        </q-chip>
        <q-input dense debounce="300" v-model="cari" placeholder="Search">
          <template v-slot:append>
            <q-icon name="search" />
            <q-btn
              flat round dense
              icon="file_download"
              @click="toDown()"
              class="q-ml-md"
              color="primary"
            />
          </template>
        </q-input>
        <!-- <q-select
          v-if="['MAN','purchase', 'acc'].some(a=> a== $store.state.auth.user.userType)"
          v-model="filt.kodeCab"
          :options="$store.state.auth.user.userType ==='MAN' ? cabAll : cabAsi"
          :option-label="(item) => item && item.kodeCab + ' ' + item.namaCabang"
          option-value="kodeCab"
          emit-value
          map-options
          style="min-width: 250px; max-width: 300px"
          label="Pilih cabang... "
          :rules="inRul"
          dense
          @input="getUmur()"
          lazy-rules/> -->
      </template>
      <template v-slot:body="props">
        <q-tr :props="props">
          <q-td
            v-for="col in props.cols"
            :key="col.name"
            :props="props"
          >
          <template v-if="col.name == 'No'">
            {{ dtUmur.indexOf(props.row) + 1 }}
          </template>
          <template v-else-if="col.name === 'Act'">
            <q-btn outline rounded label="Cek" @click="cekHis(props.row)"/>
          </template>
          <template v-if="col.fmt == 'nomer'">
            {{ col.value | nomer }}
          </template>
          <template v-else-if="col.fmt == 'duit'">
            {{ col.value | duit }}
          </template>
          <template v-else>
            {{ col.value }}
          </template>
          </q-td>
        </q-tr>
      </template>
      <template v-slot:bottom-row>
        <q-tr>
          <q-th align="right" colspan="4">Total</q-th>
          <q-th align="right">{{ dtProduk.reduce((a, b) => $dwn.jumlah([a, b.saldo]), 0) | duit}}</q-th>
          <q-th align="right"></q-th>
          <q-th align="right" v-for="i in filt.umur" :key="i">
            {{ dtProduk.reduce((a, b) => $dwn.jumlah([a, b[i]]), 0) | duit}}
          </q-th>
          <q-th align="right">{{ dtProduk.reduce((a, b) => $dwn.jumlah([a, b.nilaiUmur]), 0) | duit}}</q-th>
          <q-th align="right">{{ dtProduk.reduce((a, b) => $dwn.jumlah([a, b.total]), 0) | duit}}</q-th>
        </q-tr>
      </template>
    </q-table>
    <q-dialog v-model="hb" seamless position="bottom"
      full-width>
      <q-card class="bg-teal-5">
        <q-card-actions>
          <q-btn icon="close" dense class="absolute-top-right" color="accent" v-close-popup/>
        </q-card-actions>
        <q-card-section>
          <hisBarang ref="ch" />
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>
<script>
import { umurstok, dtCab, getProdukCat } from '../../services/apiList'
import { computed, onMounted, reactive, toRefs, watch } from '@vue/composition-api'
import hisBarang from '../../components/hisBarang'
export default {
  components: {
    hisBarang
  },
  setup (props, { root, refs }) {
    const dt = reactive({
      cari: '',
      dtUmur: [],
      filt: { kodeCab: root.$store.state.auth.setCabang, kodeCat: [], tgla: new Date().toLocaleString('sv', { timeZoneName: 'short' }), umur: ['u30', 'u60', 'u90', 'u91'] },
      tgl: new Date().toLocaleString('sv', { timeZoneName: 'short' }),
      allCat: true,
      produkCat: [],
      options: [],
      inRul: [ v => !!v || 'Isi data' ],
      cabAll: [],
      hb: false,
      halaman: { rowsPerPage: 15 },
      umur: [
        { text: 'Umur 30', value: 'u30' },
        { text: 'Umur 60', value: 'u60' },
        { text: 'Umur 90', value: 'u90' },
        { text: 'Umur > 90', value: 'u91' }
      ]
    })
    const jdl = computed(() => {
      let b = [
        { name: 'No', label: 'No', align: 'left' },
        { name: 'namaKategori', label: 'Kategori', field: row => row.namaKategori, sortable: true, align: 'left' },
        { name: 'kodeProduk', label: 'Kode Produk', field: row => row.kodeProduk, fmt: 'text', align: 'left', sortable: true },
        { name: 'namaBarang', label: 'Nama Produk', field: row => row.namaBarang, fmt: 'text', align: 'left', sortable: true },
        { name: 'saldo', label: 'Stock', field: row => row.saldo, fmt: 'nomer', jml: 'Y', align: 'right', sortable: true },
        { name: 'hpp', label: 'Hpp', field: row => row.hpp, fmt: 'nomer', jml: 'Y', align: 'right', sortable: true },
        { name: 'u30', label: '0-30', field: row => row.u30, fmt: 'nomer', jml: 'Y', align: 'right', sortable: true },
        { name: 'u60', label: '31-60', field: row => row.u60, fmt: 'nomer', jml: 'Y', align: 'right', sortable: true },
        { name: 'u90', label: '61-90', field: row => row.u90, fmt: 'nomer', jml: 'Y', align: 'right', sortable: true },
        { name: 'u91', label: '>90', field: row => row.u91, fmt: 'nomer', jml: 'Y', align: 'right', sortable: true },
        { name: 'nilaiUmur', label: 'Nilai Umur', field: row => row.nilaiUmur, fmt: 'duit', jml: 'Y', align: 'right', sortable: true },
        { name: 'total', label: 'Total Persediaan', field: row => row.total, fmt: 'duit', jml: 'Y', align: 'right', sortable: true },
        { name: 'Act', label: 'Act', fmt: 'text' }
      ]
      if (['MAN', 'purchase', 'acc'].every(a => a !== root.$store.state.auth.user.userType)) { b.splice(8, 1) }
      return b
    })
    const cabAsi = computed(() => {
      const pegang = root.$store.state.auth.user.cabGrup
      return dt.cabAll.filter(a => pegang.some(s => s === a.kodeCab))
    })
    const getUmur = () => {
      if (dt.filt.kodeCab.length) {
        umurstok(dt.filt)
          .then(({ data }) => {
            dt.dtUmur = data
          })
      }
    }
    watch(() => root.$store.state.auth.setCabang, (val) => {
      dt.filt.kodeCab = val
      getUmur()
    })
    const dtProduk = computed(() => {
      const dataUmur = dt.dtUmur.filter(a => dt.filt.umur.some(s => a[s] !== 0) || (a.saldo === 0 && (a.total > 1 || a.total < -1))).map(a => {
        // let um = dt.filt.umur.map(s => s)
        a.nilaiUmur = root.$dwn.kali([root.$dwn.jumlah(dt.filt.umur.map(s => a[s])), a.hpp])
        return a
      })
      return dt.allCat ? dataUmur : dataUmur.filter(a => dt.filt.kodeCat.some(s => s === a.kodeCat))
    })
    onMounted(() => {
      dtCab()
        .then(({ data }) => {
          dt.cabAll = data
        })
      umurstok(dt.filt.kodeCab)
        .then(({ data }) => {
          dt.dtUmur = data
        })
      getProdukCat()
        .then(({ data }) => {
          dt.produkCat = data
        })
    })
    const toDown = () => {
      const dataDown = dtProduk.value.map((a, i) => {
        a.No = i + 1
        return a
      })
      const hdr = jdl.value.filter(a => visibleColumns.value.some(s => s === a.name))
      console.log(hdr)
      let x = {
        judul: `UmurStok ${dt.cabAll.find(a => a.kodeCab === dt.filt.kodeCab).namaCabang}`,
        dt: dataDown,
        hdr: hdr,
        naFile: `UmurStok_${dt.filt.kodeCab}`
      }
      root.$dwn.toExcel(x)
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
        dt.options = dt.produkCat.filter(v => (v.produkCategory.toLowerCase().indexOf(needle) > -1))
      })
    }
    const cekHis = (x) => {
      dt.hb = true
      const a = {
        kodeCab: dt.filt.kodeCab,
        kodeProduk: x.kodeProduk
      }
      root.$nextTick(() => refs.ch.cekHis(a))
    }
    const visibleColumns = computed(() => {
      return ['No', 'namaKategori', 'kodeProduk', 'namaBarang', 'saldo', 'hpp', ...dt.filt.umur, 'nilaiUmur', 'total', 'Act']
    })
    return { ...toRefs(dt), visibleColumns, getUmur, jdl, toDown, cabAsi, dtProduk, filterFn, cekHis }
  }
}
</script>
