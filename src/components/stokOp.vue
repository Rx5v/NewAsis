<template>
  <q-page padding>
    <q-table
      class="dataTrx"
      :data="dtStokOp"
      :columns="jdl"
      row-key="nomorStokOp"
      selection="single"
      :selected.sync="selected"
      :filter="cari"
      :pagination.sync="halaman"
      dense>
      <template v-slot:top>
        <div class="col-2 q-table__title">Stok Opname</div>
        <q-input filled v-model="filt.tgl" label="Tanggal" dense lazy-rules :rules="inRul" readonly>
          <template v-slot:append>
            <q-icon name="event" class="cursor-pointer">
              <q-popup-proxy v-if="['MAN','acc', 'mitra'].some(a=> a== $store.state.auth.user.userType)" ref="qDateProxy" transition-show="scale" transition-hide="scale">
                <q-date v-model="filt.tgl" @input="() => $refs.qDateProxy.hide()" mask="YYYY-MM-DD" lazy-rules :rules="inRul"/>
              </q-popup-proxy>
            </q-icon>
          </template>
        </q-input>
        <q-btn
          flat round dense
          icon="add_circle"
          @click="buatStk"
          class="q-ml-md"
          color="accent"
        />
        <q-space/>
        <q-input dense debounce="300" v-model="cari" placeholder="Search" class="q-ml-sm">
          <template v-slot:append>
            <q-icon name="search" />
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
      <template v-slot:body-cell-status="props">
        <q-td auto-width>
           <template v-if="['MAN','purchase','acc','mitra'].some(a=> a===$store.state.auth.user.userType)">
            <q-select
              v-model="props.row.status"
              dense
              options-dense
              :options="['Open','Lock','Closed']"
              @input="updPR(props.row,'Status')"/>
          </template>
          <template v-else>
            {{ props.row.status }}
          </template>
        </q-td>
      </template>
    </q-table>
    <q-table
      class="dataTrx q-mt-md"
      :data="dtBarang"
      :columns="jdld"
      row-key="kodeProduk"
      :filter="carib"
      :pagination.sync="halaman"
      dense>
      <template v-slot:top>
        <div class="col-2 q-table__title">Detail Stok Opname</div>
        <q-select
          v-if="!allCat"
          v-model="kodeCat"
          use-input
          :options="optionsC"
          :option-label="(item) => item && item.kodeCat + ' ' + item.produkCategory"
          option-value="kodeCat"
          @filter="filterFnC"
          emit-value
          map-options
          multiple
          style="min-width: 250px; max-width: 300px"
          label="Pilih Kategori... "
          :rules="inRul"
          dense
          options-dense>
          <!-- <template v-slot:option="scope">
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
          </template> -->
        </q-select>
        <div class="q-gutter-sm">
          <q-toggle v-model="allCat" label="All Kategori" color="orange" @input="pilKat"/>
          <q-toggle v-model="allSelisih" label="Filter Selisih" color="orange" class="q-mr-sm"/>
        </div>
        <q-chip>{{ jh.nomorStokOp }}</q-chip>
        <q-chip>{{ jh.tgl }}</q-chip>
        <q-chip>Status: {{ jh.status }}</q-chip>
        <q-btn label="Adjust" @click="adjus" color="deep-orange" v-if="['MAN','purchase','acc','mitra'].some(a=> a===$store.state.auth.user.userType) && jh.status === 'Lock'"/>
        <q-space/>
        <q-input dense debounce="300" v-model="carib" placeholder="Search produk..." class="q-ml-sm">
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
        <q-btn
          flat round dense
          icon="file_download"
          @click="toDown"
          class="q-ml-md"
          color="primary"
        />
        {{ jh.kodeCat }}
      </template>
      <template v-slot:body="props">
        <q-tr :props="props">
          <q-td auto-width>
            {{ detailStok.indexOf(props.row) +1 }}
          </q-td>
          <q-td key="kodeProduk" :props="props">
            {{ props.row.kodeProduk }}
          </q-td>
          <q-td key="namaBarang" :props="props">
            {{ props.row.namaBarang }}
          </q-td>
          <q-td key="saldo" :props="props">
            {{ props.row.saldo | nomer }}
          </q-td>
           <q-td key="adjusted" :props="props">
            {{ props.row.adjusted | nomer }}
          </q-td>
          <q-td key="cek" :props="props">
            <q-chip color="purple" text-color="white" dense>{{ props.row.cek | nomer }}</q-chip>
            <q-popup-edit v-model="props.row.cek">
              <q-input v-model="props.row.cek" dense autofocus counter  @input="hit(props.row)" @change="detSim(props.row)"/>
            </q-popup-edit>
          </q-td>
          <q-td key="selisih" :props="props">
            {{ props.row.selisih | nomer }}
          </q-td>

          <!-- <q-td key="akunBiaya" :props="props">
            <q-select
              filled
              v-model="props.row.akunBiaya"
              use-input
              dense
              options-dense
              label="Pilih Akun COA"
              :options="options"
              :option-label="(item) => item && item.kodeAkun + ' ' + item.namaAkun"
              option-value="kodeAkun"
              map-options
              emit-value
              @filter="filterFn"
              @input="detSim(props.row)"
              style="max-width: 350px"
            >
              <template v-slot:no-option>
                <q-item>
                  <q-item-section class="text-grey">
                    No results
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
          </q-td>
          <q-td key="biaya" :props="props">
            {{ props.row.biaya | duit }}
          </q-td> -->
          <q-td key="keterangan" :props="props">
            {{ props.row.keterangan }}
            <q-popup-edit v-model="props.row.keterangan">
              <q-input v-model="props.row.keterangan" dense autofocus counter @change="detSim(props.row)"/>
            </q-popup-edit>
          </q-td>
        </q-tr>
      </template>
      <template v-slot:bottom-row>
        <q-tr>
          <q-th :colspan="3" align="center">Jumlah</q-th>
          <q-th align="right">{{ total.saldo | nomer }}</q-th>
          <q-th align="right">{{ total.adjust | nomer }}</q-th>
          <q-th align="right">{{ total.cek | nomer }}</q-th>
          <q-th align="right">{{ total.selisih | nomer }}</q-th>
        </q-tr>
      </template>
    </q-table>
    <q-dialog
      v-model="adj"
      full-width>
      <adjust ref="adjs"  :pr="pr" :detRR="[...detRR]" @tutup="onReset"/>
    </q-dialog>
  </q-page>
</template>

<script>

import { cabang, liststokop, createstokop, getstokop, stokop, detstokop, accRek, stokopup, getProdukCat } from '../services/apiList'
import { computed, onMounted, reactive, toRefs, watch } from '@vue/composition-api'
import adjust from './adjust'
export default {
  components: {
    adjust
  },
  setup (props, { refs, root }) {
    const dt = reactive({
      allCat: true,
      allSelisih: false,
      dtStokOp: [],
      jdl: [
        { name: 'kodeCab', label: 'Kode Cabang', field: row => row.kodeCab, align: 'left' },
        { name: 'nomorStokOp', label: 'Nomor Stok Opname', field: row => row.nomorStokOp, align: 'left' },
        { name: 'tgl', label: 'Tanggal', field: row => row.tgl, align: 'left' },
        { name: 'status', label: 'Status', sortable: true, field: row => row.status, align: 'right' },
        { name: 'act', label: 'act', align: 'right' }
      ],
      detailStok: [],
      jdld: [
        { name: 'No', label: 'No', align: 'right' },
        { name: 'kodeProduk', label: 'Kode Produk', sortable: true, field: row => row.kodeProduk, align: 'left' },
        { name: 'namaBarang', label: 'Nama Barang', sortable: true, field: row => row.namaBarang, align: 'left' },
        { name: 'saldo', label: 'Saldo Sistem', sortable: true, field: row => row.saldo, jml: 'Y', align: 'right' },
        { name: 'adjusted', label: 'Adjusted', sortable: true, field: row => row.adjusted, jml: 'Y', align: 'right' },
        { name: 'cek', label: 'Fisik', sortable: true, field: row => row.cek, fmt: 'nom', jml: 'Y', align: 'right' },
        { name: 'selisih', label: 'Selisih', sortable: true, field: row => row.selisih, jml: 'Y', align: 'right' },

        /* { name: 'akunBiaya', label: 'akunBiaya', field: row => row.akunBiaya, align: 'left' },
        { name: 'biaya', label: 'biaya', sortable: true, field: row => row.biaya, jml: 'Y', align: 'right' }, */
        { name: 'keterangan', label: 'Keterangan', field: row => row.keterangan, align: 'right' }
      ],
      jh: {},
      kodeCat: [],
      adP: false,
      inRul: [ v => !!v || 'Isi data' ],
      selected: [],
      cari: '',
      carib: '',
      cabAll: [],
      filt: { kodeCab: root.$store.state.auth.setCabang, tgl: new Date() },
      alAkun: [],
      options: [],
      adj: false,
      detR: [],
      pr: { kodeCab: root.$store.state.auth.setCabang, nomorStokOp: 'Adjust', desk: '', jenis: 'Tambah' },
      halaman: { rowsPerPage: 10 },
      produkCat: [],
      optionsC: []
    })
    accRek()
      .then(res => {
        dt.alAkun = res.data
      })
    const filterFn = (val, update) => {
      if (val === '') {
        update(() => {
          dt.options = dt.alAkunelect
        })
        return
      }
      update(() => {
        const needle = val.toLowerCase()
        dt.options = dt.alAkun.filter(v => (v.namaAkun.toLowerCase().indexOf(needle) > -1 || v.kodeAkun.toLowerCase().indexOf(needle) > -1))
      })
    }
    const getList = () => {
      dt.dtStokOp = []
      liststokop(dt.filt)
        .then(({ data }) => {
          dt.dtStokOp = data
        })
        .catch((err) => {
          console.log(err)
        })
    }
    const buatStk = () => {
      root.$q.dialog({
        title: `Buat Stok Opname`,
        message: `Stok Opname tanggal ${dt.filt.tgl} ?`,
        cancel: true,
        persistent: false
      }).onOk(() => {
        createstokop(dt.filt)
          .then(res => {
            getList()
            root.$q.notify({ message: `${res.data.st}`, color: 'teal' })
          })
          .catch(err => {
            console.log(err)
            root.$q.notify({ message: `${err.response.data.st}`, color: 'purple' })
          })
      }).onCancel(() => {
        // console.log('>>>> Cancel')
      }).onDismiss(() => {
        // console.log('I am triggered on both OK and Cancel')
      })
    }
    const detStk = (x) => {
      getstokop(x)
        .then(res => {
          dt.detailStok = res.data
        })
        .catch(err => {
          console.log(err)
          root.$q.notify({ message: `${err.response.data.st}`, color: 'purple' })
        })
    }
    const simpan = () => {
      stokop(dt.detailStok)
        .then(res => {
          root.$q.notify({ message: `${res.data.st}`, color: 'teal' })
        })
        .catch(err => {
          console.log(err)
          root.$q.notify({ message: `${err.response.data.st}`, color: 'purple' })
        })
    }
    const hit = (x) => {
      x.selisih = root.$dwn.jumlah([x.cek, -x.saldo])
      x.qty = x.selisih
      x.adjust = x.selisih
    //  x.adjust = x.selisih
    }
    const detSim = (x) => {
      detstokop(x)
        .then(res => {
          root.$q.notify({ message: `${res.data.st}`, color: 'teal' })
        })
        .catch(err => {
          console.log(err)
          root.$q.notify({ message: `${err.response.data.st}`, color: 'purple' })
        })
    }
    const updPR = (x) => {
      stokopup(x)
        .then(res => {
          root.$q.notify({ message: `${res.data.st}`, color: 'teal' })
        })
        .catch(err => {
          console.log(err)
          root.$q.notify({ message: `${err.response.data.st}`, color: 'purple' })
        })
    }
    const detRR = computed(() => {
      let s = dt.detailStok.filter(a => a.adjust !== 0)

      console.log(s)
      let d = s.map(a => {
        a.akunBiaya = a.akunBiaya !== '' ? a.akunBiaya : a.selisih > 0 ? '610100006' : '610200004'
        return a
      })
      return [...d]
    })
    const adjus = () => {
      dt.adj = true
      dt.pr = dt.selected.length ? { ...dt.selected[0] } : { kodeCab: 'MP01', nomorStokOp: 'Adjust', desk: '', jenis: 'Tambah' }
      dt.pr.nomorStokOp = dt.detailStok[0].nomorStokOp
    }
    onMounted(() => {
      getProdukCat()
        .then(res => {
          dt.produkCat = res.data
          dt.kodeCat = dt.produkCat.map(a => a.kodeCat)
        })
      getList()
      cabang()
        .then(({ data }) => {
          const pegang = root.$store.state.auth.user.cabGrup
          dt.cabAll = data.filter(a => pegang.some(s => s === a.kodeCab))
        })
    })
    const toDown = () => {
      let x = {
        judul: `Data Stok Opname ${dt.jh.nomorStokOp} `,
        dt: dtBarang.value,
        hdr: dt.jdld,
        naFile: `StokOpname${dt.jh.nomorStokOp}`
      }
      root.$dwn.toExcel(x)
    }
    const filterFnC = (val, update) => {
      if (val === '') {
        update(() => {
          dt.optionsC = dt.produkCat
        })
        return
      }
      update(() => {
        const needle = val.toLowerCase()
        dt.optionsC = dt.produkCat.filter(v => (v.produkCategory.toLowerCase().indexOf(needle) > -1) || (v.kodeCat.toLowerCase().indexOf(needle) > -1))
      })
    }
    const pilKat = () => {
      dt.filt.kodeCat = dt.allCat ? dt.produkCat.map(a => a.kodeCat) : []
    }
    const dtBarang = computed(() => {
      let ab = dt.detailStok.map(b => {
        b.adjust = root.$dwn.jumlah([b.selisih, -b.adjusted])
        return b
      })
      let dtFilt = dt.allCat ? ab : ab.filter(a => dt.kodeCat.some(x => x === a.kodeCat))
      return dt.allSelisih ? dtFilt.filter(a => a.selisih !== 0) : dtFilt
    })
    const total = computed(() => {
      let x = {}
      x.saldo = dtBarang.value.reduce((a, b) => root.$dwn.jumlah([a, b.saldo]), 0)
      x.adjust = dtBarang.value.reduce((a, b) => root.$dwn.jumlah([a, b.adjusted]), 0)
      x.cek = dtBarang.value.reduce((a, b) => root.$dwn.jumlah([a, b.cek]), 0)
      x.selisih = dtBarang.value.reduce((a, b) => root.$dwn.jumlah([a, b.selisih]), 0)
      return x
    })
    const onReset = () => {
      getList()
      dt.detailStok = []
      dt.adj = false
    }
    watch(() => root.$store.state.auth.setCabang, (val) => {
      dt.filt.kodeCab = val
      dt.pr.kodeCab = val
      getList()
    })
    return { ...toRefs(dt), adjus, updPR, getList, buatStk, detStk, simpan, detSim, hit, filterFn, toDown, pilKat, filterFnC, dtBarang, total, detRR, onReset }
  },
  watch: {
    selected: function (v) {
      if (v.length) {
        this.$emit('dtStok', v)
        this.jh = v.length ? v[0] : {}
        this.detStk(v[0].nomorStokOp)
      }
    }
  }
}
</script>
