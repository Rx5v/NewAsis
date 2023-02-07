<template>
  <div>
    <q-table
      class="dataPR"
      :data="dtProduk"
      :columns="jdl"
      :pagination.sync="halaman"
      row-key="kodeProduk"
      :filter="cari"
      dense>
      <template v-slot:top>
        <div class="col-2 q-table__title">Mutasi Barang</div>
        <q-chip color="blue-6" class="text-white text-bold">Periode : {{ tgl && tgl.from ? tgl.from + ' ~ ' + tgl.to : tgl }}
          <q-popup-proxy ref="qDateProxy" transition-show="scale" transition-hide="scale">
            <q-date range v-model="tgl" @input="(x) => x && (cekHis(),$refs.qDateProxy.hide())" mask="YYYY-MM-DD" lazy-rules/>
          </q-popup-proxy>
        </q-chip>
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
        <q-toggle v-model="allCat" label="All Kategori" color="orange" @input="pilKat" class="q-ml-md"/>
        <q-input dense debounce="300" v-model="cari" placeholder="Search" class="q-ml-md">
          <template v-slot:append>
            <q-icon name="search" />
            <!-- <q-btn
              flat round dense
              icon="file_download"
              @click="toDown()"
              class="q-ml-md"
              color="primary"
            /> -->
          </template>
        </q-input>
        <q-select
          v-if="['MAN','purchase', 'acc'].some(a=> a== $store.state.auth.user.userType)"
          v-model="filt.kodeCab"
          :options="cabAll"
          :option-label="(item) => item && item.kodeCab + ' ' + item.namaCabang"
          option-value="kodeCab"
          emit-value
          map-options
          style="min-width: 250px; max-width: 300px"
          label="Pilih cabang... "
          :rules="inRul"
          dense
          class="q-ml-md"
          @input="cekHis()"
          lazy-rules/>
        <q-btn
          flat round dense
          icon="file_download"
          @click="toDown"
          class="q-ml-md"
          color="primary"
        />
      </template>
      <template v-slot:body="props">
        <q-tr :props="props">
          <q-td
            v-for="col in props.cols"
            :key="col.name"
            :props="props"
          >
          <template v-if="col.name == 'No'">
            {{ dtHis.indexOf(props.row) + 1 }}
          </template>
          <template v-else-if="col.fmt == 'nomer'">
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
    </q-table>
  </div>
</template>
<script>
import { computed, onMounted, reactive, toRefs } from '@vue/composition-api'
import { dtCab, getProdukCat, mutasi } from '../../services/apiList'
export default {
  setup (props, { root }) {
    const dt = reactive({
      filt: {
        tgla: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10),
        tglb: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10),
        kodeCab: 'MP01',
        kodeCat: []
      },
      jdl: [
        { name: 'No', label: 'No', align: 'left' },
        { name: 'namaKategori', label: 'Nama Kategori', field: row => row.namaKategori, align: 'left', sortable: true },
        { name: 'kodeProduk', label: 'Kode Produk', field: row => row.kodeProduk, align: 'left', sortable: true },
        { name: 'namaBarang', label: 'Nama Produk', field: row => row.namaBarang, align: 'left', sortable: true },
        { name: 'sawal', label: 'Saldo Awal', field: row => row.sawal, fmt: 'nomer', align: 'right', sortable: true },
        { name: 'masuk', label: 'Masuk', field: row => row.masuk, fmt: 'nomer', jml: 'Y', align: 'right', sortable: true },
        { name: 'keluar', label: 'Keluar', field: row => row.keluar, fmt: 'nomer', jml: 'Y', align: 'right', sortable: true },
        { name: 'saldo', label: 'Saldo', field: row => row.saldo, fmt: 'nomer', align: 'right', sortable: true },
        { name: 'act', label: 'Act' }
      ],
      tgl: {
        from: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 8) + '01',
        to: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10)
      },
      cabAll: [],
      dtHis: [],
      cari: '',
      inRul: [ v => !!v || 'Isi data' ],
      options: [],
      produkCat: [],
      allCat: true,
      halaman: { rowsPerPage: 15 }
    })
    const cekHis = () => {
      dt.filt.tgla = dt.tgl && dt.tgl.from ? dt.tgl.from : dt.tgl || new Date()
      dt.filt.tglb = dt.tgl && dt.tgl.from ? dt.tgl.to : dt.tgl || new Date()
      mutasi(dt.filt)
        .then(res => {
          let data = res.data
          for (let i in data) {
            data[i].saldo = root.$dwn.jumlah([data[i].sawal, data[i].masuk, -data[i].keluar])
          }
          dt.dtHis = data
        })
        .catch(err => {
          console.log(err)
        })
    }
    const toDown = () => {
      let x = {
        judul: `Mutasi Barang ${dt.cabAll.find(a => a.kodeCab === dt.filt.kodeCab).namaCabang} Periode: ${dt.filt.tgla} s/d ${dt.filt.tglb}`,
        dt: dtProduk.value,
        hdr: dt.jdl,
        naFile: `mutasiStok_${dt.filt.kodeCab}`
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
    onMounted(() => {
      dtCab()
        .then(({ data }) => {
          dt.cabAll = data
        })
      getProdukCat()
        .then(({ data }) => {
          dt.produkCat = data
        })
    })
    const dtProduk = computed(() => {
      return dt.allCat ? dt.dtHis : dt.dtHis.filter(x => dt.filt.kodeCat.some(a => a === x.kodeCat))
    })
    const pilKat = () => {
      dt.filt.kodeCat = dt.allCat ? dt.produkCat.map(a => a.kodeCat) : []
    }
    return { ...toRefs(dt), toDown, cekHis, filterFn, pilKat, dtProduk }
  }
}
</script>
