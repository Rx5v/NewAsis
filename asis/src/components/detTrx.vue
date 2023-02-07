<template>
  <q-card>
    <q-card-section>
      <div class="text-h5 text-orange-9">Detail Transaksi</div>
      <q-separator/>
    </q-card-section>
    <q-card-section>
      <q-table
        class="dataPR"
        :data="detTrx"
        :columns="jdld"
        row-key="kodeProduk"
        :pagination.sync="pagination"
        dense
        wrap-cells
        separator="cell">
        <template v-slot:top>
          <div class="row q-col-gutter-sm q-py-sm justify-between" >
            <div class="col-xs-6 col-sm-4">
              <q-input filled :value="pr.tglKirim" label="Tanggal" dense lazy-rules readonly>
              </q-input>
              <q-input filled
                :value="pr.ct"
                label="Pembayaran"
                color="pink"
                readonly/>
              <q-input filled
                v-if="pr.ct==='tempo'"
                :value="pr.tempo"
                label="Masa Tempo"
                color="pink"
                readonly
                />
              <q-input filled
                v-if="pr.ct !== 'tempo'"
                :value="pr.akunBayar"
                readonly
                style="width: 250px"
              />
            </div>
            <div class="col-xs-6 col-sm-4">
              <template  v-if="pr.ac==='N'">
                <q-input :value="pr.namaPartner" label="Partner" :hint="`Telp : ${pr.telpPIC}`" dense lazy-rules readonly/>
              </template>
              <template v-else>
              <q-input filled
                v-model="pr.cabLain"
                readonly
                style="min-width: 250px; max-width: 300px"
                label="Partner"
                dense
                lazy-rules/>
              </template>
            </div>
            <div class="col-xs-6 col-sm-4">
              <q-input filled
                color="purple-12"
                v-model="pr.ppn"
                style="min-width: 250px; max-width: 300px"
                label="PPN 10 %"
                readonly/>
              <q-input
                type="textarea"
                v-model="pr.note"
                label="Note"
                dense
                readonly/>
            </div>
          </div>
        </template>
        <template v-slot:body="props">
          <q-tr :props="props">
            <q-td>
              {{ detTrx.indexOf(props.row) +1 }}
            </q-td>
            <q-td key="kodeProduk" :props="props">
              {{ props.row.kodeProduk }}
            </q-td>
            <q-td key="namaBarang" :props="props">
              {{ props.row.namaBarang }}
            </q-td>
            <q-td key="keterangan" :props="props">
              <div >{{ props.row.keterangan }}</div>
            </q-td>
            <q-td key="jmlKemasan" :props="props">
              {{ props.row.jmlKemasan }} {{ props.row.kemasan.kemasan || 'error'}}
            </q-td>
            <q-td key="hargaKemasan" :props="props">
              <q-chip outline v-show="['gudang','produksi'].every(a=> a !== $store.state.auth.user.userType)">
                {{ props.row.hargaKemasan | duit }}
              </q-chip>
            </q-td>
            <q-td key="dpp" :props="props">
              {{ props.row.dpp | duit }}
            </q-td>
            <q-td key="ppn" :props="props">
              {{ props.row.ppn | duit }}
            </q-td>
          </q-tr>
        </template>
        <template v-slot:bottom-row>
          <q-tr>
            <q-td colspan="6" align="right">Jumlah DPP</q-td>
            <q-td align="right"  colspan="2">{{ totalAll.tdpp | duit }}</q-td>
          </q-tr>
          <q-tr>
            <q-td colspan="6" align="right">Jumlah PPN</q-td>
            <q-td align="right"  colspan="2">{{ totalAll.tppn | duit }}</q-td>
          </q-tr>
          <q-tr>
            <q-td colspan="6" align="right">
              Potongan Harga
              <q-toggle
                v-model="pr.pot"
                color="orange"
                keep-color
                false-value="N"
                true-value="Y"
                checked-icon="check"
                label="Diskon"
                unchecked-icon="clear"
                disable
              />
            </q-td>
            <q-td :class="pr.pot==='N' ? 'text-strike' :'text-right'"  colspan="2"  >
              {{ pot.diskon | duit }}
            </q-td>
          </q-tr>
          <q-tr v-if="jnsTrx === 'J'">
            <q-td colspan="6" align="right">Customer Datang
              <q-toggle
                v-model="pr.walkIn"
                color="orange"
                keep-color
                false-value="N"
                true-value="Y"
                checked-icon="check"
                label="Walk In"
                unchecked-icon="clear"
                disable
              />
            </q-td>
          </q-tr>
          <q-tr v-if="pr.walkIn !== 'Y'">
            <q-td colspan="3" align="right">
              Biaya Kirim
              <q-toggle
                v-model="pr.kurir"
                color="orange"
                keep-color
                false-value="N"
                true-value="Y"
                checked-icon="check"
                label="Jasa Expedisi"
                unchecked-icon="clear"
                disable
              />
            </q-td>
            <q-td colspan="2">
              <q-select
                v-if="pr.kurir==='Y'"
                clearable
                dense
                filled
                color="purple-12"
                v-model="exp.partnerID"
                :options="expedisi"
                option-value="kodePartner"
                option-label="namaPartner"
                emit-value
                map-options
                style="min-width: 250px; max-width: 300px"
                label="Expedisi"
                disable/>
            </q-td>
            <q-td auto-width>
              <q-toggle
                v-if="pr.kurir==='Y'"
                v-model="pr.ongkir"
                color="orange"
                keep-color
                false-value="N"
                true-value="Y"
                checked-icon="check"
                label="Plus Ongkir"
                unchecked-icon="clear"
                disable
              />
            </q-td>
            <q-td :class="pr.ongkir==='N' ? 'text-strike' :'text-right'"  colspan="2"  >
              {{ exp.biaya | duit }}
            </q-td>
          </q-tr>
          <q-tr>
            <q-td colspan="6" align="right">Total Bayar</q-td>
            <q-td align="right" colspan="2">{{ pr.ongkir==='Y' ? $dwn.jumlah([totalAll.tharga,exp.biaya,-pot.diskon]) : totalAll.tharga | duit }}</q-td>
          </q-tr>
          <q-tr >
            <q-td colspan="6" align="right">Point Member</q-td>
            <q-td align="right">{{ totalAll.pointMember | duit }}</q-td>
          </q-tr>
        </template>
      </q-table>
    </q-card-section>
  </q-card>
</template>
<script>
import { computed, reactive, toRefs } from '@vue/composition-api'
export default {
  props: {
    jnsTrx: {
      type: String,
      default: 'J',
      validator: function (x) {
        return ['J', 'B', 'RJ', 'RB'].indexOf(x) !== -1
      }
    },
    status: {
      type: String,
      default: 'W'
    },
    edDet: {
      type: Array,
      default: function () {
        return []
      }
    },
    jh: {
      type: Object,
      default: function () {
        return {}
      }
    },
    potHrg: {
      type: Object,
      default: function () {
        return {}
      }
    },
    pelanggan: {
      type: Object,
      default: function () {
        return { namaPartner: '', alamat: '' }
      }
    },
    expd: {
      type: Object,
      default: function () {
        return {}
      }
    }
  },
  setup (props, { root }) {
    const dt = reactive({
      detTrx: props.edDet,
      jdld: [
        { name: 'No', label: 'No', field: row => row.index, align: 'right' },
        { name: 'kodeProduk', label: 'Kode Produk', field: row => row.kodeProduk, align: 'left' },
        { name: 'namaBarang', label: 'Nama Produk', field: row => row.namaBarang, align: 'left' },
        { name: 'keterangan', label: 'Keterangan', field: row => row.keterangan, align: 'left', style: 'max-width: 250px' },
        { name: 'jmlKemasan', label: 'Qty', field: row => row.jmlKemasan, jml: 'Y', align: 'right' },
        { name: 'hargaKemasan', label: 'harga @', field: row => row.hargaKemasan, align: 'right' },
        { name: 'dpp', label: 'DPP', field: row => row.dpp, jml: 'Y', align: 'right' },
        { name: 'ppn', label: 'PPN', field: row => row.ppn, jml: 'Y', align: 'right' },
        { name: 'act', label: 'Act' }
      ],
      pr: props.jh,
      pot: { ...props.potHrg },
      selected: [],
      cari: '',
      expedisi: [],
      exp: {
        ...props.expd
      },
      pagination: {
        rowsPerPage: 0
      },
      cust: props.pelanggan,
      imageSrc: '',
      cabAll: [],
      tempo: [
        { label: ' 7 Hari', value: '7' },
        { label: '14 hari', value: '14' },
        { label: '30 hari', value: '30' },
        { label: '60 Hari', value: '60' },
        { label: '90 hari', value: '90' }
      ],
      adBar: false,
      ad: {},
      pil: false,
      dtpil: { kemasan: { isi: 1, kemasan: 'Pcs' }, hargaKemasan: 0 },
      kodeCab: '',
      dtSales: [],
      pilihSales: [],
      pilSales: false,
      akunCOA: [],
      kongsi: { jmlQty: 0, kirim: 0, sisa: 0 }
    })
    const cabLain = computed(() => {
      let x = dt.cabAll.filter(a => a.kodeCab !== root.$store.state.auth.user.kodeCab)
      return x
    })
    const crByr = computed(() => {
      let x = dt.pr.ac === 'Y' ? [{ label: 'Tempo', value: 'tempo' }] : [{ label: 'Tempo', value: 'tempo' }, { label: 'Tunai', value: 'tunai' }, { label: 'Sales', value: 'sales' }]
      return x
    })
    const jenis = computed(() => {
      let x = {}
      x.label = props.jnsTrx === 'J' ? 'Penjualan' : 'Pembelian'
      x.value = props.jnsTrx
      x.partner = props.jnsTrx === 'J' ? 'Cust' : 'Ven'
      return x
    })
    const totalHarga = computed(() => {
      return dt.detTrx.reduce((a, b) => {
        return root.$dwn.jumlah([a, b.jmlHarga, b.ppn])
      }, 0)
    })
    const totalAll = computed(() => {
      const diskon = dt.pot.diskon ? dt.pot.diskon : 0
      let x = {}
      x.tdpp = dt.detTrx.reduce((a, b) => root.$dwn.jumlah([a, b.dpp]), 0)
      x.tppn = dt.detTrx.reduce((a, b) => root.$dwn.jumlah([a, b.ppn]), 0)
      x.tharga = root.$dwn.jumlah([x.tdpp, x.tppn, -diskon])
      x.pointMember = dt.detTrx.reduce((a, b) => root.$dwn.jumlah([a, b.jmlPoint]), 0)
      return x
    })
    const totalQty = computed(() => {
      return dt.detTrx.reduce((a, b) => {
        return root.$dwn.jumlah([a, b.qty])
      }, 0)
    })
    return { ...toRefs(dt), cabLain, jenis, totalHarga, totalAll, totalQty, crByr }
  }
}
</script>
