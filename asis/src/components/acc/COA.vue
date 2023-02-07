<template>
  <div>
    <q-table
      class="dataTrx"
      :data="alAkun"
      :columns="jdl"
      row-key="kodeAkun"
      :filter="cari"
      selection="single"
      :selected.sync="selected"
      :pagination.sync="halaman"
      dense>
      <template v-slot:top>
        <div class="row justify-between" >
        <div class="col-md-5 q-table__title">Data Akun COA</div>
          <!-- <q-input filled v-model="pr.tgla" label="Tanggal" dense lazy-rules :rules="inRul" readonly>
            <template v-slot:append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy ref="qDateProxy" transition-show="scale" transition-hide="scale">
                  <q-date v-model="pr.tgla" @input="() => $refs.qDateProxy.hide()" mask="YYYY-MM-DD" lazy-rules :rules="inRul"/>
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
          <q-btn
            flat dense
            icon="folder_open"
            @click="nrc"
            class="q-ml-md"
            color="warning"
          /> -->
          <div>
            <q-input dense v-model="cari" placeholder="Search">
              <template v-slot:append>
                <q-icon name="search" />
                <q-btn
                  flat round dense
                  icon="file_download"
                  @click="toDown"
                  class="q-ml-md"
                  color="primary"
                />
                <q-btn
                  flat round dense
                  icon="add_circle"
                  @click="plus"
                  class="q-ml-md"
                  color="accent"
                />
              </template>
            </q-input>
          </div>
        </div>
      </template>
      <template v-slot:body-cell-kasMasuk="props">
        <q-td>
          <q-checkbox v-model="props.row.kasMasuk" dense
            true-value="Y"
            false-value="N"
            @input="upd(props.row,'kasMasuk')"/>
        </q-td>
      </template>
      <template v-slot:body-cell-kasKeluar="props">
        <q-td>
          <q-checkbox v-model="props.row.kasKeluar" dense
            @input="upd(props.row,'kasKeluar')"
            true-value="Y"
            false-value="N"/>
        </q-td>
      </template>
      <template v-slot:body-cell-JU="props">
        <q-td>
          <q-checkbox v-model="props.row.JU" dense
            @input="upd(props.row,'JU')"
            true-value="Y"
            false-value="N"/>
        </q-td>
      </template>
      <template v-slot:body-cell-ADJ="props">
        <q-td>
          <q-checkbox v-model="props.row.ADJ" dense
            @input="upd(props.row,'ADJ')"
            true-value="Y"
            false-value="N"/>
        </q-td>
      </template>
      <template v-slot:body-cell-HP="props">
        <q-td>
          <q-checkbox v-model="props.row.HP" dense
            @input="upd(props.row,'HP')"
            true-value="Y"
            false-value="N"/>
        </q-td>
      </template>
      <template v-slot:body-cell-KB="props">
        <q-td>
          <q-checkbox v-model="props.row.KB" dense
            @input="upd(props.row,'KB')"
            true-value="Y"
            false-value="N"/>
        </q-td>
      </template>
      <template v-slot:body-cell-BP="props">
        <q-td>
          <q-checkbox v-model="props.row.BP" dense
            @input="upd(props.row,'BP')"
            true-value="Y"
            false-value="N"/>
        </q-td>
      </template>
      <template v-slot:body-cell-JB="props">
        <q-td>
          <q-checkbox v-model="props.row.JB" dense
            @input="upd(props.row,'JB')"
            true-value="Y"
            false-value="N"/>
        </q-td>
      </template>
      <!-- <template v-slot:bottom-row>
        <q-tr>
          <q-th colspan="3" align="center">Jumlah Total</q-th>
          <q-th align="right">{{ total.debit | nomer}}</q-th>
          <q-th align="right">{{ total.kredit | nomer}}</q-th>
        </q-tr>
        <q-tr>
          <q-th colspan="2" align="right">Saldo Awal</q-th>
          <q-th align="right">{{ sawal | nomer}}</q-th>
          <q-th colspan="2" align="right">Saldo Akhir</q-th>
          <q-th align="right">{{ total.saldoAkhir | nomer}}</q-th>
        </q-tr>
      </template> -->
    </q-table>
    <q-dialog
      v-model="adP"
      full-width>
      <q-card>
        <q-card-section>
          <div class="text-h6">{{ u.akunID ? 'Edit' : 'Tambah' }} Akun COA</div>
        </q-card-section>
        <q-form
          @submit="coaAkun(u)"
          @reset="onReset"
          class="q-gutter-md">
          <q-card-section>
           <div class="row justify-between">
              <div class="col-12 col-md-5">
                <q-select filled  v-model="u.grupAkun"
                  :options="grupAkun"
                  map-options
                  emit-value
                  label="Grup Akun"
                  lazy-rules
                  options-dense
                  @input="u.midSub='',u.subAkun=''"
                />
                <q-select filled  v-model="u.midSub"
                  :options="midSub.filter(a=> a.kodeGrup == u.grupAkun)"
                  option-label="namaMidSub"
                  option-value="kodemidSub"
                  emit-value
                  map-options
                  label="Kategori Sub Akun"
                  lazy-rules
                  options-dense
                  @input="u.subAkun=''"
                />
                <q-select filled  v-model="u.subAkun"
                  :options="subAkun.filter(a=> a.midSub == u.midSub)"
                  option-label="namaSubAkun"
                  option-value="kodeSubAkun"
                  emit-value
                  map-options
                  label="Sub Akun"
                  options-dense
                  @input="cek(u)"
                />
                <q-select filled v-model="u.jnsAkun" :options="['D','K']" label="Jenis Akun"
                  dense :rules="inRul"/>
                <q-input filled  v-model="u.namaAkun"  label="Nama Akun "  lazy-rules
                  dense :rules="inRul"
                />
                <q-input filled  v-model="u.kodeAkun"  label="Kode Akun "  lazy-rules
                  dense :rules="inRul"
                />
                <q-checkbox v-model="u.allCab"
                  true-value="Y" false-value="N" label="Semua Cabang"
                  :rules="inRul"/>
                <q-select
                  v-if="['MAN','acc'].some(a=> a== $store.state.auth.user.userType) && u.allCab === 'N'"
                  v-model="u.kodeCab"
                  :options="cabAll"
                  :option-label="(item) => item && item.kodeCab + ' ' + item.namaCabang"
                  option-value="kodeCab"
                  emit-value
                  map-options
                  style="min-width: 250px; max-width: 300px"
                  label="Pilih cabang... "
                  :rules="inRul"
                  dense
                  lazy-rules/>
              </div>
              <div class="col-12 col-md-5">
                <div class="text-h6">Tampil di Menu</div>
                <q-checkbox v-model="u.kasMasuk"
                  true-value="Y" false-value="N" label="Kas Masuk"
                  :rules="inRul"/>
                <q-checkbox v-model="u.kasKeluar"
                  true-value="Y" false-value="N" label="Kas Keluar"
                  :rules="inRul"/>
                <q-checkbox v-model="u.JU"
                  true-value="Y" false-value="N" label="Menu Jurnal Umum"
                  :rules="inRul"/>
                <q-checkbox v-model="u.ADJ"
                  true-value="Y" false-value="N" label="Menu Adjustment"
                  :rules="inRul"/>
                <q-checkbox v-model="u.HP"
                  true-value="Y" false-value="N" label="Menu Hutang/Piutang"
                  :rules="inRul"/>
                <q-checkbox v-model="u.KB"
                  true-value="Y" false-value="N" label="Set KB"
                  :rules="inRul"/>
                <q-checkbox v-model="u.BP"
                  true-value="Y" false-value="N" label="Bayar Hutang/ Piutang"
                  :rules="inRul"/>
                <q-checkbox v-model="u.JB"
                  true-value="Y" false-value="N" label="Pembayaran di jual beli"
                  :rules="inRul"/>
                <q-select v-model="u.pembayaran"
                  :options="jnsBayar"
                  option-label="label"
                  option-value="jenisBayar"
                  options-dense
                  multiple
                  emit-value
                  map-options
                  style="width: 250px"
                  label="Jenis Pembayaran"/>
              </div>
           </div>
          </q-card-section>
          <q-card-actions align="right" class="bg-white text-teal">
            <q-btn label="Batal" v-close-popup color="accent" flat />
            <q-btn label="Reset" type="reset" color="orange" flat class="q-ml-sm" />
            <q-btn label="Simpan" type="submit" color="primary" flat/>
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import { accRek, nrcSaldo, subAkun, midSubAkun, cekCoa, inCOA, cabang, jnsPembayaran } from '../../services/apiList'
import { reactive, computed, toRefs, watch, onMounted } from '@vue/composition-api'
export default {
  setup (props, { root }) {
    const dt = reactive({
      cabAll: [],
      dtJurnal: [],
      jdl: [
        { name: 'namaGrupAkun', label: 'Grup Akun', field: row => row.namaGrupAkun, sortable: true, align: 'left' },
        { name: 'namaMidSub', label: 'Kategori Akun', field: row => row.namaMidSub, sortable: true, align: 'left' },
        { name: 'namaSubAkun', label: 'sub Akun', field: row => row.namaSubAkun, sortable: true, align: 'left' },
        { name: 'kodeAkun', label: 'Kode Akun', field: row => row.kodeAkun, sortable: true, align: 'left' },
        { name: 'namaAkun', label: 'Nama Akun', field: row => row.namaAkun, sortable: true, align: 'left' },
        { name: 'jnsAkun', label: 'Jenis Akun', field: row => row.jnsAkun, sortable: true, align: 'left' },
        { name: 'kasMasuk', label: 'Kas Masuk', field: row => row.kasMasuk, sortable: true, align: 'left' },
        { name: 'kasKeluar', label: 'Kas Keluar', field: row => row.kasKeluar, sortable: true, align: 'left' },
        { name: 'JU', label: 'Jurnal Umum', field: row => row.JU, sortable: true, align: 'left' },
        { name: 'ADJ', label: 'Adjustment', field: row => row.ADJ, sortable: true, align: 'left' },
        { name: 'HP', label: 'Hutang/Piutang', field: row => row.HP, sortable: true, align: 'left' },
        { name: 'KB', label: 'KB', field: row => row.KB, sortable: true, align: 'left' },
        { name: 'BP', label: 'Bayar', field: row => row.BP, sortable: true, align: 'left' },
        { name: 'JB', label: 'Jual Beli', field: row => row.JB, sortable: true, align: 'left' },
        { name: 'allCab', label: 'All Cab', field: row => row.allCab, sortable: true, align: 'left' },
        { name: 'kodeCab', label: 'Kode Cab', field: row => row.kodeCab, sortable: true, align: 'left' },
        { name: 'pembayaran', label: 'Jenis Bayar', field: row => row.pembayaran, sortable: true, align: 'left' }
        //        { name: 'sawal', label: 'Saldo Awal', field: row => row.saldo, jml: 'Y', align: 'right' }
      ],
      grupAkun: [
        { label: 'Aktiva', value: 1 },
        { label: 'Pasiva', value: 2 },
        { label: 'Pendapatan', value: 3 },
        { label: 'Biaya atas Pendapatan', value: 4 },
        { label: 'Pengeluaran Operasional', value: 5 },
        { label: 'Pendapatan dan Biaya Luar Usaha', value: 6 }
      ],
      adP: false,
      inRul: [ v => !!v || 'Isi data' ],
      pr: { tgla: '', tglb: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10), kodeCab: '' },
      alAkun: [],
      subAkun: [],
      midSub: [],
      selected: [],
      cari: '',
      options: [],
      sawal: 0,
      u: {
        grupAkun: null,
        midSub: null,
        subAkun: null,
        kodeAkun: '',
        kasMasuk: 'Y',
        kasKeluar: 'Y',
        JU: 'Y',
        HP: 'Y',
        ADJ: 'Y',
        KB: 'N',
        BP: 'N',
        JB: 'N',
        allCab: 'Y',
        kodeCab: '',
        pembayaran: []
      },
      halaman: { rowsPerPage: 10 },
      ok: 1,
      jnsBayar: []
    })
    const total = computed(() => {
      let x = {}
      x.debit = dt.dtJurnal.reduce((a, b) => root.$dwn.jumlah([a, b.debit]), 0)
      x.kredit = dt.dtJurnal.reduce((a, b) => root.$dwn.jumlah([a, b.kredit]), 0)
      x.saldoAkhir = root.$dwn.jumlah([dt.sawal, x.debit, -x.kredit])
      return x
    })
    watch(() => dt.selected, (selected, prevS) => {
      if (selected.length > 0) {
        dt.u = { ...selected[0] }
        dt.adP = true
      }
    })
    const nrc = () => {
      if (dt.pr) {
        dt.pr.jns = true
        nrcSaldo(dt.pr)
          .then(res => {
            let a = res.data
            dt.dtJurnal = a.map((x, y) => {
              let u = x
              u.saldoAkhir = u.jnsAkun === 'D' ? root.$dwn.jumlah([x.saldo, x.debit, -x.kredit]) : root.$dwn.jumlah([x.saldo, -x.debit, x.kredit])
              return u
            })
            console.log(res.data)
          })
          .catch((err) => {
            console.log(err)
          })
      } else {
        root.$q.notify({ message: `Pilih filter dulu....`, color: 'action' })
      }
    }
    const onReset = () => {
      dt.u = { grupAkun: null,
        midSub: null,
        subAkun: null,
        kodeAkun: '',
        kasMasuk: 'Y',
        kasKeluar: 'Y',
        JU: 'Y',
        HP: 'Y',
        ADJ: 'Y',
        KB: 'N',
        BP: 'N',
        JB: 'N',
        allCab: 'Y',
        kodeCab: '',
        pembayaran: [] }
    }
    const toDown = () => {
      let x = {
        judul: `Data Akun COA `,
        dt: dt.alAkun,
        hdr: dt.jdl,
        naFile: `dataCOA`
      }
      root.$dwn.toExcel(x)
    }
    const filterFn = (val, update) => {
      if (val === '') {
        update(() => {
          dt.options = dt.alAkun
        })
        return
      }
      update(() => {
        const needle = val.toLowerCase()
        dt.options = dt.alAkun.filter(v => (v.namaAkun.toLowerCase().indexOf(needle) > -1 || v.kodeAkun.toLowerCase().indexOf(needle) > -1))
      })
    }
    onMounted(() => {
      cabang().then(res => {
        dt.cabAll = res.data
      })
      subAkun()
        .then(({ data }) => {
          dt.subAkun = data
        })
      accRek()
        .then(res => {
          dt.alAkun = res.data
        })
      jnsPembayaran()
        .then(({ data }) => {
          dt.jnsBayar = data
        })
      midSubAkun()
        .then(({ data }) => {
          dt.midSub = data
        })
    })
    const coaAkun = (x) => {
      x.pembayaran = JSON.stringify(x.pembayaran) || '[]'
      inCOA(x)
        .then(res => {
          root.$q.notify({ message: `${res.data.st}`, color: 'teal' })
          accRek()
            .then(res => {
              dt.alAkun = res.data.map(a => {
                a.pembayaran = JSON.parse(a.pembayaran)
                return a
              })
            })
          onReset()
        })
        .catch(err => {
          console.log(err)
          root.$q.notify({ message: `${err.response.data.st}`, color: 'purple' })
        })
    }
    const plus = () => {
      dt.adP = true
      onReset()
    }
    const cek = async (x) => {
      if (x.subAkun && !x.akunID) {
        cekCoa(x)
          .then(({ data }) => {
            x.kodeAkun = data
          })
      }
    }
    const upd = (x, y) => {
      root.$q.dialog({
        title: 'Konfirmasi Update Akun COA',
        message: `Tampil di menu ${y} = ${x[y]} ?`,
        cancel: true,
        persistent: false
      }).onOk(() => {
        coaAkun(x)
      }).onCancel(() => {
        // console.log('>>>> Cancel')
      }).onDismiss(() => {
        // console.log('I am triggered on both OK and Cancel')
      })
    }
    return { ...toRefs(dt), filterFn, nrc, toDown, total, onReset, coaAkun, plus, cek, upd }
  }
}
</script>
