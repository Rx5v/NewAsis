<template>
  <div>
    <q-table
      class="dataTrx"
      :data="dtAdjustment"
      :columns="jdl"
      row-key="nomorBukti"
      selection="single"
      :selected.sync="selected"
      :filter="cari"
      :pagination.sync="halaman"
      dense>
      <template v-slot:top>
        <div class="col-2 q-table__title">Data Adjustment</div>
        <q-space/>
        <q-input dense debounce="300" v-model="cari" placeholder="Search" class="q-ml-sm">
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
        <q-btn
          flat round dense
          icon="add_circle"
          @click="buatAdj"
          class="q-ml-md"
          color="accent"
        />
        <q-select
          v-if="['MAN','purchase','acc'].some(a=> a== $store.state.auth.user.userType)"
          v-model="filt.kodeCab"
          :options="$store.state.auth.user.userType ==='MAN' ? cabAll : cabAsi"
          :option-label="(item) => item && item.kodeCab + ' ' + item.namaCabang"
          option-value="kodeCab"
          emit-value
          map-options
          multiple
          style="min-width: 250px; max-width: 300px"
          label="Pilih cabang... "
          dense
          @input="getList"
          lazy-rules/>
      </template>
      <template v-slot:body-cell-act="props">
        <q-td>
          <q-btn icon="fas fa-edit" color="red-13" dense outline class="q-ml-xs" v-if="['MAN','purchase', 'mitra', 'acc', 'admin'].some(a=> a== $store.state.auth.user.userType) && props.row.status !== 'W' && props.row.status !== 'B' && props.row.nomorStokOp === 'Adjust'"
            @click="buka(props.row)">
            <q-tooltip content-class="bg-orange-13" :offset="[10, 10]" anchor="center left">
              Buka transaksi
            </q-tooltip>
          </q-btn>
        </q-td>
      </template>
      <template v-slot:body-cell-tgl="props">
        {{ props.row.tgl }}
        <q-icon v-if="['MAN','purchase', 'mitra', 'acc'].some(a=> a== $store.state.auth.user.userType)" name="edit" class="q-ml-xs" color="red" @click="ubahTgl(props.row)" />
      </template>
    </q-table>
    <q-dialog
      v-model="det"
      full-width>
      <q-card>
        <q-card-section>
          <q-table
            class="detPR"
            :data="detAjust"
            :columns="jdlr"
            row-key="iddetTrans"
            dense>
            <template v-slot:top>
              <div class="col-2 q-table__title">Data Adjustment</div>
              <q-chip color="cyan">{{jh.nomorBukti}}</q-chip>
              <q-chip color="cyan">{{jh.tgl}}</q-chip>
              <q-btn label="Konfirm" @click="konfir()" v-if="selected[0].status === 'W'" color="primary"/>
              <q-space/>
              <q-btn
                flat round dense
                icon="file_download"
                @click="toDown"
                class="q-ml-md"
                color="primary"
              />
            </template>
            <template v-slot:body-cell-No="props">
              <q-td align="right">{{ detAjust.indexOf(props.row) + 1 }}</q-td>
            </template>
          </q-table>
        </q-card-section>
      </q-card>
    </q-dialog>
    <q-dialog
      v-model="ubT">
      <q-card
        style="width: 400px">
        <q-form
          ref="form"
          @submit="ubahTrx(ubahT, 'Trx')">
          <q-card-section>
            <div class="text-h5 text-orange-9">Ubah Tanggal Transaksi</div>
            <q-separator/>
            <q-chip outline color="teal">Nomor Bukti :  {{ ubahT.nomorBukti }} </q-chip>
            <q-input v-model="ubahT.tgl" label="Tanggal Awal *" :rules="rules.required" readonly/>
            <q-input filled v-model="ubahT.tglBaru" label="Ubah Tanggal" dense lazy-rules :rules="rules.required" readonly>
              <template v-slot:append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy ref="qDateProxye" transition-show="scale" transition-hide="scale">
                    <q-date v-model="ubahT.tglBaru" @input="() => $refs.qDateProxye.hide()" mask="YYYY-MM-DD" lazy-rules :rules="rules.required"/>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </q-card-section>
          <q-card-actions>
            <q-space/>
            <q-btn label="Batal" type="reset" outline rounded color="warning" v-close-popup/>
            <q-btn label="Simpan" type="submit" outline rounded color="teal" v-close-popup/>
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </div>
</template>
<script>
import { reactive, toRefs, computed, watch } from '@vue/composition-api'
import { dtCab, getListAdjs, getdetAdjust, konfirm, perbaiki, editTglTrx } from '../services/apiList'
export default {
  setup (props, { emit, root }) {
    const dt = reactive({
      jdl: [
        { name: 'kodeCab', label: 'kodeCab', field: row => row.cabID, align: 'left' },
        { name: 'nomorBukti', label: 'nomorBukti', field: row => row.nomorBukti, align: 'left' },
        { name: 'tgl', label: 'tgl', field: row => row.tgl, align: 'left' },
        { name: 'nomorStokOp', label: 'nomorStokOp', field: row => row.nomorStokOp, align: 'left' },
        { name: 'nomorJurnal', label: 'nomorJurnal', field: row => row.nomorJurnal, align: 'left' },
        { name: 'status', label: 'status', sortable: true, field: row => row.status, align: 'right' },
        { name: 'act', label: 'act', align: 'right' }
      ],
      dtAdjustment: [],
      jdlr: [
        { name: 'No', label: 'No' },
        { name: 'kodeProduk', label: 'Kode Produk', field: row => row.kodeProduk, align: 'left' },
        { name: 'namaBarang', label: 'Nama Bahan', field: row => row.namaBarang, align: 'left' },
        { name: 'qty', label: 'qty', field: row => row.qty, format: (val) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(val) },
        { name: 'jmlHarga', label: 'jmlHarga', field: row => row.jmlHarga, format: (val) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(val) },
        { name: 'keterangan', label: 'keterangan', field: row => row.keterangan, align: 'right' }
      ],
      detAjust: [],
      filt: { tgl: '', kodeCab: [root.$store.state.auth.setCabang] },
      cabAll: [],
      cari: '',
      jh: {},
      selected: [],
      det: false,
      halaman: { rowsPerPage: 10 },
      ubT: false,
      ubahT: {
        nomorBukti: ''
      },
      rules: {
        required: [value => !!value || 'Harus diisi..'],
        min: [v => (v && v.length >= 4) || 'Min 4 characters'],
        cek: [(v) => v === dt.u.password || 'Password tidak sama...']
      }
    })
    dtCab()
      .then(({ data }) => {
        const pegang = root.$store.state.auth.user.cabGrup
        dt.cabAll = data.filter(a => pegang.some(s => s === a.kodeCab))
      })
    const getList = () => {
      dt.dtAdjustment = []
      getListAdjs(dt.filt)
        .then(({ data }) => {
          dt.dtAdjustment = data
        })
        .catch(err => {
          console.log(err)
        })
    }
    const detAj = () => {
      if (dt.selected.length) {
        getdetAdjust(dt.selected[0].nomorBukti)
          .then(({ data }) => {
            dt.detAjust = data
          })
          .catch(err => {
            console.log(err)
          })
      }
    }
    const buatAdj = () => {
      emit('buatAdj', 'Y')
    }
    getList()
    const konfir = () => {
      let x = dt.selected[0]
      root.$q.dialog({
        title: 'Konfirmasi Approval Transaksi',
        message: 'Pilihan :',
        options: {
          type: 'radio',
          model: 'status',
          // inline: true
          items: [
            { label: 'Terima', value: 'T', color: 'secondary' },
            { label: 'Batal', value: 'B', color: 'red' }
          ]
        },
        cancel: true,
        persistent: true
      }).onOk(data => {
        x.status = data
        if (data !== 'status') {
          konfirm(x)
            .then(res => {
              root.$q.notify({ message: res.data.st, color: 'teal' })
              getList()
            })
            .catch(err => {
              console.log(err)
              root.$q.notify({ message: err.response.data.st, color: 'purple' })
            })
        }
        // console.log('>>>> OK, received', data)
      }).onCancel(() => {
        // console.log('>>>> Cancel')
      }).onDismiss(() => {
        // console.log('I am triggered on both OK and Cancel')
      })
    }
    const cabAsi = computed(() => {
      return dt.cabAll
    })
    const toDown = () => {
      let x = {
        judul: `Data Adjust ${dt.selected[0]} `,
        dt: dt.detAjust,
        hdr: dt.jdlr,
        naFile: `Adjustment`
      }
      root.$dwn.toExcel(x)
    }
    const buka = (x) => {
      const st = (x.ancab === 'Y' && x.status === 'T') ? 'D' : 'W'
      const z = { ...x }
      root.$q.dialog({
        title: `Buka transaksi nomor : ${x.nomorBukti}`,
        message: '',
        options: {
          type: 'radio',
          model: 'konfr',
          // inline: true
          items: [
            { label: 'Ya', value: 'Y', color: 'secondary' },
            { label: 'Tidak', value: 'B', color: 'red' }
          ],
          isValid: val => ['Y', 'B'].some(a => a === val)
        },
        ok: {
          push: true
        },
        persistent: false
      }).onOk((data) => {
        z.status = st
        if (data === 'Y') {
          perbaiki(z)
            .then(res => {
              root.$q.notify({ message: `${res.data.st}`, color: 'teal' })
              getList()
            })
            .catch(err => {
              console.log(err)
              root.$q.notify({ message: `${err.response.data.st}`, color: 'orange' })
            })
        }
      })
    }
    watch(() => root.$store.state.auth.setCabang, (val) => {
      dt.filt.kodeCab = [val]
      getList()
    })
    const ubahTgl = (x) => {
      dt.ubahT = { ...x }
      dt.ubT = true
    }
    const ubahTrx = (x, y) => {
      x.jnsEdit = 'Trx'
      editTglTrx(x)
        .then(res => {
          root.$q.notify({ message: `${res.data.st}`, color: 'teal' })
          getList()
        })
        .catch(err => {
          console.log(err)
          root.$q.notify({ message: `${err.response.data.st}`, type: 'warning' })
        })
    }
    return { ...toRefs(dt), cabAsi, getList, detAj, buatAdj, konfir, toDown, buka, ubahTgl, ubahTrx }
  },
  watch: {
    selected: function (v) {
      if (v.length) {
        this.jh = v.length ? v[0] : {}
        this.det = true
        this.detAj()
      }
    }
  }
}
</script>
