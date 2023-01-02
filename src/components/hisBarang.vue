<template>
  <q-table
      class="dataPR"
      :data="dtHis"
      :columns="jdl"
      row-key="nomorBukti"
      :filter="cari"
      dense>
      <template v-slot:top>
        <div class="col-xs-12 col-md-4 q-table__title">History Barang</div>
        <q-space />
        <q-chip color="blue" class="text-white">{{ tgl !== null && tgl.from ? (tgl.from + ' ~ ' + tgl.to) : tgl }}
          <q-popup-proxy ref="qDateProxy" transition-show="scale" transition-hide="scale">
            <q-date v-model="tgl" range @input="(x) => x && (cekHis(),$refs.qDateProxy.hide())" mask="YYYY-MM-DD" lazy-rules :rules="inRul"/>
          </q-popup-proxy>
        </q-chip>
        <q-input dense debounce="300" v-model="cari" placeholder="Search" class="q-ml-md">
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
        <q-select
          v-if="['MAN','purchase', 'acc', 'mitra'].some(a=> a== $store.state.auth.user.userType)"
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
        <q-tr :props="props" :class="(['W', 'B'].includes(props.row.status)) && 'bg-red-12'">
          <q-td
            v-for="col in props.cols"
            :key="col.name"
            :props="props"
          >
          <template v-if="col.name === 'hpp'">
            <template v-if="['MAN','purchase', 'acc', 'mitra'].some(a=> a== $store.state.auth.user.userType)">
              {{ col.value | duit }}
              <q-popup-edit v-if="props.row.jns === 'K' && ['MAN','purchase', 'acc', 'mitra'].some(a=> a== $store.state.auth.user.userType) && !['W', 'B'].includes(props.row.status)" v-model="props.row.hpp" @save="gantiHpp(props.row)">
                <q-input v-model="props.row.hpp" label="Ganti Hpp Penjualan"/>
              </q-popup-edit>
            </template>
          </template>
          <template v-else-if="col.name === 'namaPartner'">
              {{ col.value }}
          </template>
          <template v-else-if="col.name === 'act'">
            <q-btn icon="info" v-if="['MAN','purchase', 'acc'].some(a=> a== $store.state.auth.user.userType) && props.row.status" dense color="brown-12" rounded outline class="q-ml-md" @click="cekLog(props.row, 'nomorBukti')">
              <q-menu auto-close content-class="bg-grey-12" style="width: 550px" >
                <q-list separator style="max-width: 600px" v-if="userLog.length > 0">
                  <q-item active active-class="bg-yellow-2" dense>
                    Aktifitas user...
                  </q-item>
                  <q-separator/>
                  <q-item dense
                    v-for="(i, s) in userLog" :key="s">
                    <q-item-section >
                      <q-item-label overline>{{ i.akun }}</q-item-label>
                      <q-item-label caption>{{ i.deskripsi }}</q-item-label>
                    </q-item-section>
                    <q-item-section side top>
                      <q-item-label caption>{{ i.waktu ? new Date(i.waktu).toLocaleString("id-ID", { dateStyle: 'medium' , timeStyle: 'short'}) : '' }}</q-item-label>
                      <q-item-label><q-icon name="info" color="orange" size="sm"/></q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </template>
          <template v-else-if="col.name === 'harga'">
            <template v-if="['MAN','purchase', 'acc', 'mitra'].some(a=> a== $store.state.auth.user.userType) || props.row.jns === 'K'">
              {{ col.value | nomer }}
            </template>
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
      <template v-slot:bottom-row>
        <q-tr>
          <q-th align="right" colspan="6">Total</q-th>
          <q-th align="right"></q-th>
          <q-th align="right" >
            {{ dtHis.reduce((a, b) => $dwn.jumlah([a, b.masuk]), 0) | duit}}
          </q-th>
          <q-th align="right">{{ dtHis.reduce((a, b) => $dwn.jumlah([a, b.keluar]), 0) | duit}}</q-th>
          <q-th align="right">{{ dtHis.reduce((a, b) => $dwn.jumlah([a, b.masuk, -b.keluar]), 0) | duit}}</q-th>
          <q-th align="right"></q-th>
        </q-tr>
      </template>
    </q-table>
</template>

<script>
import { cabang, hisbar, repairHpp, getLog } from '../services/apiList'
import { reactive, computed, toRefs } from '@vue/composition-api'
export default {
  props: {
    pilih: {
      type: Object,
      default: function () {
        return {
          kodeCab: null,
          kodeProduk: ''
        }
      }
    },
    tanggal: {
      type: Object,
      default: () => {
        return {
          from: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 8) + '01',
          to: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10)
        }
      }
    }
  },
  setup (props, { root }) {
    const dt = reactive({
      filt: {
        tgla: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10),
        tglb: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10)
      },
      tgl: props.tanggal,
      cabAll: [],
      dtHis: [],
      cari: '',
      inRul: [v => !!v || 'Isi data'],
      kodeCab: root.$store.state.auth.user.kodeCab,
      userLog: []
    })
    const jdl = computed(() => {
      const b = [
        { name: 'tglKirim', label: 'Tanggal', field: row => row.tglKirim, align: 'right' },
        { name: 'kodeProduk', label: 'Kode Produk', field: row => row.kodeProduk, align: 'left' },
        { name: 'namaBarang', label: 'Nama Produk', field: row => row.namaBarang, align: 'left' },
        { name: 'nomorBukti', label: 'Nomor Bukti', field: row => row.nomorBukti, align: 'left' },
        { name: 'namaPartner', label: 'Nama Partner', field: row => row.namaPartner, align: 'left' },
        { name: 'status', label: 'Status', field: row => row.status, align: 'left' },
        { name: 'harga', label: 'Harga', field: row => row.harga, fmt: 'duit', jml: 'Y', align: 'right' },
        { name: 'masuk', label: 'Masuk', field: row => row.masuk, fmt: 'nomer', jml: 'Y', align: 'right' },
        { name: 'keluar', label: 'Keluar', field: row => row.keluar, fmt: 'nomer', jml: 'Y', align: 'right' },
        { name: 'saldo', label: 'Saldo', field: row => row.saldo, fmt: 'nomer', align: 'right' },
        { name: 'hpp', label: 'hpp', field: row => row.hpp, fmt: 'nomer', align: 'right' },
        { name: 'act', label: 'Act' }
      ]
      // if (['MAN', 'purchase', 'acc', 'mitra'].every(a => a !== root.$store.state.auth.user.userType)) { b.splice(4, 1) }
      return b
    })
    cabang()
      .then(({ data }) => {
        dt.cabAll = data
      })
    const cekHis = (x) => {
      dt.filt.tgla = dt.tgl.from || dt.tgl
      dt.filt.tglb = dt.tgl.to || dt.tgl
      dt.filt = { ...dt.filt, ...x }
      hisbar(dt.filt)
        .then(res => {
          const data = res.data
          for (const i in data) {
            const qty = i < 1 ? data[i].awal : data[i].jns === 'M' ? data[i].qty : -data[i].qty
            data[i].masuk = data[i].jns === 'M' && i > 0 ? data[i].qty : data[i].jns === 'K' ? 0 : data[i].awal
            data[i].keluar = data[i].jns === 'K' ? data[i].qty : 0
            data[i].harga = data[i].jns === 'M' && i > 0 ? data[i].harga : data[i].jns === 'K' && i > 0 ? -data[i].harga : data[i].hpp * data[i].awal
            const sal = i > 0 ? data[(i - 1)].saldo : data[i].awal
            if (data[i].awal) {
              data[i].saldo = data[i].awal
            } else if (['W', 'B'].includes(data[i].status)){
              data[i].saldo = data[(i - 1)].saldo
            } else {
              data[i].saldo = root.$dwn.jumlah([sal, qty])
            }
          }
          dt.dtHis = data
        })
        .catch(err => {
          console.log(err)
        })
    }
    const toDown = () => {
      let jd = ['MAN', 'purchase', 'acc', 'mitra'].some(a => a === root.$store.state.auth.user.userType) ? jdl.value : jdl.value.filter(a => ['harga', 'hpp'].every(s => a.name !== s))
      const x = {
        judul: 'History Barang',
        dt: dt.dtHis,
        hdr: jd,
        naFile: 'hisBar'
      }
      root.$dwn.toExcel(x)
    }
    const gantiHpp = (x) => {
      x.kodeCab = x.asal
      root.$q.dialog({
        title: `Konfirmasi Ubah HPP Penjualan ${x.namaBarang}`,
        options: {
          type: 'radio',
          model: 'konfr',
          // inline: true
          items: [
            { label: 'Ya', value: 'Y', color: 'secondary' },
            { label: 'Batal', value: 'N', color: 'red' }
          ],
          isValid: val => ['Y', 'N'].some(a => a === val)
        },
        ok: {
          push: true
        },
        persistent: false
      }).onOk((data) => {
        if (data === 'Y') {
          repairHpp(x)
            .then(({ data }) => {
              root.$q.notify({ message: data.st, color: 'teal' })
            })
            .catch(err => {
              root.$q.notify({ message: err.response.data.st, color: 'pink' })
            })
        }
      })
    }
    const cekLog = (x, y) => {
      getLog({ ...x, bukti: y })
        .then(({ data }) => {
          dt.userLog = data
        })
        .catch(err => {
          console.log(err)
        })
    }
    return { ...toRefs(dt), jdl, cekHis, toDown, gantiHpp, cekLog }
  }
}
</script>
