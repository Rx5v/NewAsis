<template>
  <div>
    <q-form
      @submit="addJB(pr)"
      @reset="onReset"
      class="q-gutter-md">
      <q-dialog
        v-model="pil"
        width="600px"
        persistent>
        <q-card>
          <q-card-section class="bg-secondary text-white">Cek Barang</q-card-section>
          <q-card-section class="row">
            <q-list dense>
              <q-item dense>
                <q-item-section>
                  <q-item-label>Kode Barang</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-item-label>{{ dtpil.kodeProduk }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item dense>
                <q-item-section>
                  <q-item-label>Nama Barang</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-item-label>{{ dtpil.namaBarang }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item dense>
                <q-item-section>
                  <q-item-label>Stok Barang</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-item-label>{{ dtpil.stok }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item dense>
                  <q-item-section>
                    <q-item-label>Qty Barang</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-item-label>
                      <q-chip outline color="teal" >{{ dtpil.jmlKemasan }} {{ dtpil.kemasan.kemasan || '' }}</q-chip>
                      <q-popup-edit v-model="dtpil.jmlKemasan">
                        <q-input v-model="dtpil.jmlKemasan" @input="onSave(dtpil)" dense autofocus counter/>
                      </q-popup-edit>
                    </q-item-label>
                  </q-item-section>
                </q-item>
                <q-item dense>
                  <q-item-section>
                    <q-item-label>Kemasan Barang</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-item-label>
                      <q-select
                        :options="dtpil.konversi"
                        v-model="dtpil.kemasan"
                        map-options
                        :option-label="(val) => val.isi + ' pcs/ ' + val.kemasan"
                        label="Kemasan *"
                        :rules="inRul"
                        @input="onSave(dtpil)"
                        style="width: 200px"/>
                    </q-item-label>
                  </q-item-section>
                </q-item>
                <q-item v-show="['gudang','produksi'].every(a=> a !== $store.state.auth.user.userType)" dense>
                  <q-item-section>
                    <q-item-label>Harga @ Barang</q-item-label>
                    <!-- <q-select
                      v-model="dtpil.jns"
                      :options="['hargaRetail','hargaGrosir']"
                      @input="hrg(dtpil)"
                      label="Harga"
                      /> -->
                  </q-item-section>
                  <q-item-section side>
                    <q-item-label>
                      <q-chip outline color="teal" >{{ dtpil.hargaKemasan | duit }}</q-chip>
                      <q-popup-edit v-model="dtpil.hargaKemasan" >
                        <q-input v-model="dtpil.hargaKemasan" @input="onSave(dtpil)" dense autofocus counter/>
                      </q-popup-edit>
                    </q-item-label>
                  </q-item-section>
                </q-item>
                <q-item dense>
                  <q-item-section>
                    <q-item-label>Jumlah Harga</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-item-label>
                      {{ dtpil.jmlHarga | duit }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              <!-- <q-item dense>
                  <q-item-section>
                    <q-item-label>Point Member</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-item-label>
                      {{ dtpil.pointMember | duit }} %
                    </q-item-label>
                  </q-item-section>
                </q-item> -->
            </q-list>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn rounded label="Kembali" color="warning" v-close-popup />
            <q-btn rounded label="Pilih" color="primary" v-close-popup @click="onpil(dtpil)"/>
          </q-card-actions>
        </q-card>
      </q-dialog>
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
          <q-toolbar>
            <div class="col-2 q-table__title">{{ jenis.label }} Barang</div>
            <q-space/>
            <q-toggle
              v-model="pilSales"
              color="orange"
              keep-color
              checked-icon="check"
              label="Pilih Sales"
              unchecked-icon="clear"
            />
            <q-select
              v-if="pilSales"
              v-model="pr.salesID"
              use-input
              :options="pilihSales"
              :option-label="(item) => item && item.namaKaryawan +' '+ item.namaCabang"
              option-value="salesID"
              emit-value
              map-options
              style="min-width: 250px; max-width: 300px"
              label="Sales ID"
              @filter="filterFn"
              :rules="inRul"
              dense
              lazy-rules/>
            <!-- <q-toggle
              v-if="jnsTrx==='J'"
              v-model="pr.ac"
              color="orange"
              keep-color
              false-value="N"
              true-value="Y"
              checked-icon="check"
              label="Antar Cabang"
              unchecked-icon="clear"
              @input="ac(pr.ac)"
            /> -->
          </q-toolbar>
          <div class="row q-gutter-sm justify-between" >
            <div class="col-xs-6 col-sm-4 col-md-3">
              <q-input filled v-model="pr.tgl" label="Tanggal" dense lazy-rules :rules="inRul" readonly>
                <template v-slot:append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy v-if="['MAN','acc','mitra'].some(a=> a== $store.state.auth.user.userType)" ref="qDateProxy" transition-show="scale" transition-hide="scale">
                      <q-date v-model="pr.tgl" @input="() => $refs.qDateProxy.hide()" mask="YYYY-MM-DD" lazy-rules :rules="inRul"/>
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>
            <div class="col-xs-6 col-sm-4 col-md-3" v-if="pr.ac==='N'">
              <q-input :value="cust.namaPartner" :label="jenis.partner" :hint="`alamat : ${cust.alamat}`" dense lazy-rules :rules="inRul" readonly @click="crp = true"/>
              <!-- <q-dialog v-model="crp" persistent>
                <q-card style="min-width: 350px">
                  <q-card-section>
                    <div class="text-h6">{{jenis.partner}}</div>
                  </q-card-section>
                  <q-card-section class="q-pt-none">
                    <cariPartner @dtPartner="partner" :pil="jnsTrx ==='J' ? false : true"/>
                  </q-card-section>
                  <q-card-actions align="right" class="text-primary">
                    <q-btn flat label="Cancel" v-close-popup />
                    <q-btn flat label="Pilih" v-close-popup />
                  </q-card-actions>
                </q-card>
              </q-dialog> -->
            </div>
            <div class="col-xs-6 col-sm-4 col-md-3" v-else>
              <q-select
                v-model="pr.cabLain"
                :options="cabLain"
                :option-label="(item) => item && item.kodeCab + ' ' + item.namaCabang"
                option-value="kodeCab"
                emit-value
                map-options
                style="min-width: 250px; max-width: 300px"
                label="Partner"
                :rules="inRul"
                dense
                lazy-rules/>
            </div>
            <div class="col-xs-6 col-sm-4 col-md-3">
              <q-select
                clearable
                dense
                color="purple-12"
                v-model="pr.ppn"
                :options="[{label:'Tanpa Ppn',value:'no'},{label:'Exclude PPN',value:'ex'},{label:'Include',value:'in'}]"
                emit-value
                map-options
                style="min-width: 250px; max-width: 300px"
                label="PPN 10 %"
                :rules="inRul"
                @input="setHPP"
                lazy-rules>
              </q-select>
            </div>
            <div class="col-xs-6 col-sm-4 col-md-3">
              <q-select
                v-model="pr.ct"
                label="Pembayaran"
                color="pink"
                :options="crByr"
                emit-value
                map-options
                dense
                options-dense
                @input="gantiByr(pr.ct)"
                :rules="inRul"
                />
            </div>
            <div class="col-xs-6 col-sm-4 col-md-3">
              <q-select
                v-if="pr.ct==='tempo'"
                v-model="pr.tempo"
                label="Masa Tempo"
                color="pink"
                :options="tempo"
                emit-value
                map-options
                dense
                options-dense
                :rules="inRul"
                />
              <q-select
                v-if="pr.ct !== 'tempo'"
                filled
                v-model="pr.akunBayar"
                use-input
                dense
                options-dense
                input-debounce="0"
                label="Pilih Pembayaran"
                :options="akunCOA"
                :option-label="(item) => item && item.kodeAkun + ' ' + item.namaAkun"
                option-value="kodeAkun"
                map-options
                emit-value
                :rules="inRul"
                style="width: 250px"
              >
                <template v-slot:no-option>
                  <q-item>
                    <q-item-section class="text-grey">
                      No results
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>
            <div class="col-xs-6 col-sm-4 col-md-3">
              <q-select
                v-if="['MAN','purchase'].some(a=> a== $store.state.auth.user.userType)"
                v-model="pr.cabID"
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
            <q-td key="serialNo" style="width: 30%" :props="props">
              <div >{{ props.row.serialNo.split('\n').filter(a => a.length).length }} SN</div>
              <q-popup-edit v-model="props.row.serialNo" buttons>
                <q-input v-model="props.row.serialNo"
                  dense autofocus counter
                  @keyup.enter.stop
                  type="textarea" label="SN"/>
              </q-popup-edit>
              <!-- <q-btn label="SN"/>
              <q-popup-edit v-model="props.row.sn">
                <q-input v-model="props.row.sn" dense autofocus counter  type="textarea"/>
              </q-popup-edit> -->
            </q-td>
            <q-td key="qty" :props="props">
              {{ props.row.qty }}
              <q-popup-edit v-model="props.row.qty">
                <q-input v-model="props.row.qty" dense autofocus counter @input="onSave(props.row)"/>
              </q-popup-edit>
            </q-td>
            <!-- <q-td key="hargaSat" :props="props">
              <q-chip outline v-show="['gudang','produksi'].every(a=> a !== $store.state.auth.user.userType)">
                {{ props.row.hargaSat | duit }}
                <q-popup-edit v-model="props.row.hargaSat">
                  <q-input v-model="props.row.hargaSat" dense autofocus counter  @change="onSave(props.row)"/>
                </q-popup-edit>
              </q-chip>
            </q-td>
            <q-td key="dpp" :props="props">
              <q-chip outline v-show="['gudang','produksi'].every(a=> a !== $store.state.auth.user.userType)">
                {{ props.row.dpp | duit }}
                <q-popup-edit v-model="props.row.dpp">
                  <q-input v-model="props.row.dpp" dense autofocus counter />
                </q-popup-edit>
              </q-chip>
            </q-td>
            <q-td key="ppn" :props="props">
              {{ props.row.ppn | duit }}
              <q-popup-edit v-model="props.row.ppn">
                <q-input v-model="props.row.ppn" dense autofocus counter  @input="onSave(props.row)"/>
              </q-popup-edit>
            </q-td> -->
            <q-td key="act"  :props="props" auto-width>
              <q-icon name="close" color="red" @click="ondel(props.row)" />
            </q-td>
          </q-tr>
        </template>
        <!-- <template v-slot:bottom-row>
          <q-tr>
            <q-td colspan="6" align="right">Jumlah DPP</q-td>
            <q-td align="right"  colspan="2">{{ totalAll.tdpp | duit }}</q-td>
          </q-tr>
          <q-tr>
            <q-td colspan="6" align="right">Jumlah PPN</q-td>
            <q-td align="right"  colspan="2">{{ totalAll.tppn | duit }}</q-td>
          </q-tr>
          <q-tr v-if="jnsTrx==='J'" align="right">
            <q-td colspan="6">
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
                @input="pot.diskon=0"
              />
            </q-td>
            <q-td :class="pr.pot==='N' ? 'text-strike' :'text-right'"  colspan="2"  >
              {{ pot.diskon | duit }}
              <q-popup-edit v-model="pot.diskon" v-if="pr.pot==='Y'">
                <q-input
                  v-model="pot.diskon"
                  type="number"
                  input-class="text-right"
                  label="Potongan"
                  dense
                  autofocus/>
              </q-popup-edit>
            </q-td>
          </q-tr>
          <q-tr>
            <q-td colspan="3">
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
                @input="exp.biaya=0, pr.ongkir = jnsTrx === 'B' ? 'Y' : 'N'"
              />
            </q-td>
            <q-td colspan="2">
              <q-select
                v-if="pr.kurir==='Y'"
                clearable
                dense
                filled
                :rules="inRul"
                color="purple-12"
                v-model="exp.partnerID"
                :options="expedisi"
                option-value="kodePartner"
                option-label="namaPartner"
                emit-value
                map-options
                style="min-width: 250px; max-width: 300px"
                label="Expedisi" />
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
              />
            </q-td>
            <q-td :class="pr.ongkir==='N' ? 'text-strike' :'text-right'"  colspan="2"  >
              {{ exp.biaya | duit }}
              <q-popup-edit v-model="exp.biaya" v-if="pr.kurir==='Y'">
                <q-input
                  v-model="exp.biaya"
                  type="number"
                  input-class="text-right"
                  label="Biaya"
                  dense
                  autofocus
                  @input="setHPP"/>
              </q-popup-edit>
            </q-td>
          </q-tr>
          <q-tr>
            <q-td colspan="6" align="right">Total Bayar</q-td>
            <q-td align="right" colspan="2">{{ pr.ongkir==='Y' ? $dwn.jumlah([totalAll.tharga,exp.biaya]) : totalAll.tharga | duit }}</q-td>
          </q-tr>
        </template> -->
      </q-table>
      <div align="right">
        <q-btn label="Submit" type="submit" color="primary"/>
        <q-btn label="Reset" type="reset" color="primary" flat class="q-ml-sm" />
      </div>
    </q-form>
    <q-dialog v-model="adBar" persistent>
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Rincian Barang</div>
        </q-card-section>
        <q-card-section class="q-pt-2">
          <q-input outlined v-model="ad.namaProduk" label="Nama Produk" />
          <q-input outlined v-model.number="ad.qty" label="Kuantitas" autofocus/>
          <q-input outlined v-model.number="ad.hargaSat" label="@Harga" >{{ad.hargaSat | duit}}</q-input>
          <q-input outlined v-model="ad.diskon" label="Diskon" />
          <q-input outlined v-model="ad.ppn" label="Pajak" />
        </q-card-section>
        <q-card-actions align="right" class="text-primary">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn flat label="Add address" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import { cabang, exPartner, detPR, cekStok, addJB, carikar, accRek } from '../services/apiList'
export default {
  // name: 'PageName',
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
    }
  },
  data () {
    return {
      detTrx: [],
      jdld: [
        { name: 'No', label: 'No', field: row => row.index, align: 'right' },
        { name: 'kodeProduk', label: 'Kode Produk', field: row => row.kodeProduk, align: 'left' },
        { name: 'namaBarang', label: 'Nama Produk', field: row => row.namaBarang, align: 'left' },
        { name: 'serialNo', label: 'serialNo', field: row => row.serialNo, align: 'left', style: 'max-width: 250px' },
        { name: 'qty', label: 'Qty', field: row => row.qty, jml: 'Y', align: 'right' },
        { name: 'act', label: 'Act' }
      ],
      adP: false,
      inRul: [ v => !!v || 'Isi data' ],
      pr: { tgl: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10),
        jnsTrx: 'J',
        ct: 'tempo',
        ac: 'N',
        cabLain: '',
        tempo: '0',
        ongkir: 'N',
        kurir: 'N',
        akunBayar: '110500001',
        ppn: 'no',
        pot: 'N',
        kodePartner: '',
        salesID: this.$store.state.auth.user.eID },
      selected: [],
      cari: '',
      expedisi: [],
      exp: {
        partnerID: null,
        biaya: 0,
        alamatTujuan: ''
      },
      pot: {
        diskon: 0,
        akunDiskon: '510100005'
      },
      pagination: {
        rowsPerPage: 15
      },
      crp: false,
      cust: { namaPartner: '', alamat: '' },
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
      dtpil: { kemasan: { isi: 1, kemasan: 'Pcs' } },
      kodeCab: '',
      dtSales: [],
      pilihSales: [],
      pilSales: false,
      akunCOA: []
    }
  },
  watch: {
    selected: function (v) {
      let e = Object.assign({}, v[0])
      this.$emit('dtBrg', e)
      this.getdetPR(e)
    }

  },
  computed: {
    judulTransaksi () {
      return this.pr.ac === 'Y' ? `Jual beli ${this.$store.state.auth.user.namaCabang} ke ${this.cabAll.find(a => a.kodeCab === this.pr.cabLain).namaCabang}` : null
    },
    cabLain () {
      let x = this.cabAll.filter(a => a.kodeCab !== this.$store.state.auth.user.kodeCab)
      return x
    },
    crByr () {
      // let user = this.$store.getters['auth/user']
      let x = this.pr.ac === 'Y' ? [{ label: 'Tempo', value: 'tempo' }] : [{ label: 'Tempo', value: 'tempo' }, { label: 'Tunai', value: 'tunai' }, { label: 'Sales', value: 'sales' }]
      /* let x = user.userType === 'sales' ? [{ label: 'Kas Sales', value: 'sales' }, { label: 'Tempo', value: 'tempo' }]
        : this.jnsTrx === 'B' ? [{ label: 'Tempo', value: 'tempo' }, { label: 'Kas Besar', value: 'admin' }] : [{ label: 'Kas Sales', value: 'sales' }, { label: 'Kas Besar', value: 'admin' }, { label: 'Tempo', value: 'tempo' }] */
      return x
    },
    jenis () {
      let x = {}
      x.label = this.jnsTrx === 'J' ? 'Penjualan' : 'Pembelian'
      x.value = this.jnsTrx
      x.partner = this.jnsTrx === 'J' ? 'Cust' : 'Ven'
      return x
    },
    totalHarga () {
      return this.detTrx.reduce((a, b) => {
        return this.$dwn.jumlah([a, b.jmlHarga, b.ppn])
      }, 0)
    },
    totalAll () {
      let x = {}
      x.tdpp = this.detTrx.reduce((a, b) => this.$dwn.jumlah([a, b.dpp]), 0)
      x.tppn = this.detTrx.reduce((a, b) => this.$dwn.jumlah([a, b.ppn]), 0)
      x.tharga = this.$dwn.jumlah([x.tdpp, x.tppn, -this.pot.diskon])
      return x
    },
    totalQty () {
      return this.detTrx.reduce((a, b) => {
        return this.$dwn.jumlah([a, b.qty])
      }, 0)
    }
  },
  mounted () {
    exPartner()
      .then(res => {
        this.expedisi = res.data
      })
    cabang()
      .then(({ data }) => {
        this.cabAll = data
      })
    accRek()
      .then(({ data }) => {
        this.akunCOA = data.filter(a => a.JB === 'Y')
      })
    this.cariSales()
  },
  methods: {
    ac (x) {
      this.pr.cabLain = ''
      this.cust = {}
      this.pr.kodePartner = ''
      if (x === 'Y') {
        this.pr.ct = 'tempo'
        this.pr.tempo = '30'
      } else {
        this.pr.ct = 'sales'
        this.pr.tempo = 0
      }
    },
    gantiByr (x) {
      if (x === 'tempo') {
        this.pr.tempo = 14
        this.pr.akunBayar = this.jnsTrx === 'J' ? '110500001' : '210100001'
      } else {
        this.pr.tempo = 0
        this.pr.akunBayar = '110500001'
      }
    },
    cariSales () {
      let kodeCab = this.jnsTrx === 'J' ? this.$store.state.auth.user.kodeCab : this.pr.kodeCab
      carikar(kodeCab)
        .then(({ data }) => {
          this.dtSales = data
        })
    },
    filterFn (val, update) {
      if (val === '') {
        update(() => {
          this.pilihSales = this.dtSales

          // with Quasar v1.7.4+
          // here you have access to "ref" which
          // is the Vue reference of the QSelect
        })
        return
      }

      update(() => {
        const needle = val.toLowerCase()
        this.pilihSales = this.dtSales.filter(v => (v.namaKaryawan.toLowerCase().indexOf(needle) > -1) || (v.namaCabang.toLowerCase().indexOf(needle) > -1))
      })
    },
    addJB (x) {
      x.status = 'W' // (x.ac === 'Y' || this.jnsTrx === 'B') ? 'W' : this.status
      x.jnsTrx = this.jnsTrx
      x.judulTransaksi = this.judulTransaksi
      /*       x.cabID = noreff.cabID ? noreff.cabID : ''
      x.nomorPR = noreff.nomorPR ? noreff.nomorPR : '' */
      const det = this.detTrx.map(a => {
        a.SN = a.serialNo.length ? a.serialNo.split('\n').filter(a => a.length) : []
        return a
      })
      x.total = this.$dwn.jumlah([this.totalAll.tharga, this.exp.biaya])
      if (det.every(a => (a.qty > 0 && a.qty === a.SN.length)) && this.detTrx.length > 0) {
        addJB({ hd: x, det: det, exp: this.exp, pot: this.pot })
          .then(res => {
            this.onReset()
            this.$emit('jubel', 'S')
            this.$q.notify({ message: `${res.data.st}`, color: 'teal' })
          })
          .catch((err) => {
            console.log(err)
            this.$q.notify({ message: `${err.response.data.st}`, color: 'purple' })
          })
      } else {
        this.$q.notify({ message: 'Cek qty dan SN dulu...', color: 'purple' })
      }
    },
    getdetPR (x) {
      detPR(x)
        .then(res => {
          this.detPR = res.data
        })
        .catch((err) => {
          console.log(err)
          this.$q.notify({ message: `${err.response.data.st}`, color: 'purple' })
        })
    },
    onReset () {
      this.pr = {
        tgl: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10),
        jnsTrx: 'J',
        ct: 'tempo',
        ac: 'N',
        cabLain: '',
        tempo: '0',
        ongkir: 'N',
        kurir: 'N',
        akunBayar: '110500001',
        ppn: 'no',
        kodePartner: '',
        salesID: this.$store.state.auth.user.eID,
        pot: 'N'
      }
      this.pot.diskon = 0
      this.detTrx = []
      this.exp = {
        partnerID: null,
        biaya: 0,
        alamatTujuan: ''
      }
    },
    cekStoki (x) {
      let kodeCab
      if (['MAN', 'acc', 'purchase', 'mitra'].some(a => a === this.$store.state.auth.user.userType)) {
        kodeCab = this.pr.ac === 'Y' && this.jnsTrx === 'B' ? this.pr.cabLain : this.pr.cabID
      } else {
        kodeCab = this.$store.state.auth.user.kodeCab
      }
      if (x.kodeProduk) {
        cekStok({ kodeProduk: x.kodeProduk, kodeCab: kodeCab })
          .then(res => {
            x.hargaRetail = x.hargaJual || res.data[0].hargaRetail
            x.hargaGrosir = res.data[0].hargaGrosir
            x.price1 = res.data[0].hargaGrosir <= 0 ? res.data[0].hpp : res.data[0].hargaGrosir <= 0
            x.stok = res.data[0].saldo
            x.hp = res.data[0].hpp
            x.qty = x.qty > 0 ? (x.stok > x.qty ? x.qty : x.stok) : 0
            x.hargaSat = x.hargaRetail > x.price1 ? x.hargaRetail : x.price1
            x.jns = 'hargaRetail'
            x.kemasan = x.kemasan || { isi: 1, kemasan: 'Pcs' }
            x.hargaKemasan = x.hargaKemasan || x.hargaSat * x.kemasan.isi
            x.jmlKemasan = x.qty
            x.serialNo = ''
            this.dtpil = x
            this.kodeCab = kodeCab
            this.pil = true
            // this.onpil(x)
          })
          .catch((err) => {
            console.log(err)
            // this.$q.notify({ message: `Stok kosong`, color: 'purple' })
          })
      }
    },
    hrg (x) {
      x.hargaSat = x.jns === 'hpp' ? x.price1 : x.jns === 'hargaGrosir' ? x.hargaGrosir : x.hargaRetail
    },
    onpil (x) {
      if (x.kodeProduk) {
        let y = Object.assign({}, x)
        y.jns = 'hargaRetail'
        y.price1 = x.price1
        y.qty = x.qty ? x.qty : 0
        y.expedisi = 0
        y.hp = x.hp
        y.hpp = this.$dwn.kali([x.hp * y.qty])
        y.jmlHarga = this.$dwn.kali([y.qty, y.hargaSat])
        y.ppn = this.pr.ppn === 'no' ? 0 : this.$dwn.kali([y.jmlHarga, 0.11])
        y.dpp = this.$dwn.kali([y.qty, y.hargaSat])
        y.serialNo = x.serialNo || ''
        this.ad = y
        //  this.adBar = true
        this.detTrx.push(y)
        this.setHPP()
      }
    },
    onSave (x) {
      if (x.kodeProduk) {
        x.qty = x.kemasan.isi * x.jmlKemasan
        x.hargaSat = x.hargaKemasan / x.kemasan.isi
        if (this.jnsTrx === 'J' || (this.jnsTrx === 'B' && this.pr.ac === 'Y' && this.pr.cabLain === this.kodeCab)) {
          if (x.qty > x.stok) {
            x.qty = x.stok
            x.jmlKemasan = x.qty / x.kemasan.isi
            //          x.hargaSat = x.hargaSat > x.hpp ? x.hargaSat : x.hpp
            this.$q.notify({ message: `stok hanya tersedia ${x.stok}`, color: 'purple' })
          }
          if (x.qty > x.sisa) {
            x.qty = x.sisa
            x.jmlKemasan = 0
            //          x.hargaSat = x.hargaSat > x.hpp ? x.hargaSat : x.hpp
            this.$q.notify({ message: `sisa permintaan hanya ${x.sisa}`, color: 'purple' })
          }
          if (x.hargaSat < x.price1) {
            this.$q.notify({ message: `harga terlalu rendah...`, color: 'purple' })
            x.hargaSat = x.price1
          }
        }

        /* if (this.ppn === 'in') {
          x.ppn = this.$dwn.kali([x.dpp, 1 / 11])
        } else {
          x.ppn = this.$dwn.kali([x.dpp, 0.1])
        } */
        x.jmlHarga = this.$dwn.kali([x.qty, x.hargaSat])
        x.jmlPoint = this.jnsTrx === 'J' && x.pointMember > 0 ? this.$dwn.kali([x.qty, x.hargaSat, x.pointMember]) / 100 : 0
        x.dpp = x.jmlHarga
        if (this.pr.ppn === 'in') {
          x.dpp = Number(x.jmlHarga / 1.11).toFixed(2)
          x.ppn = this.$dwn.jumlah([x.jmlHarga, -x.dpp])
        } else if (this.pr.ppn === 'ex') {
          x.ppn = this.$dwn.kali([x.dpp, 0.11])
        } else {
          x.ppn = 0
        }
        this.setHPP()
      }
    },
    ondel (item) {
      const index = this.detTrx.indexOf(item)
      let cf = confirm(`Hapus ${item.kodeProduk} ?`)
      if (cf) {
        this.detTrx.splice(index, 1)
        /* if (item.iddetPR) {
          api.delPRd(item)
            .then(res => this.$q.notify({ message: 'Data tersimpan', color: 'success' }))
            .catch(err => this.$q.notify({ message: 'Gagal simpan...' }))
        } */
      }
    },
    setHPP () {
      let biaya = this.exp ? this.exp.biaya : 0
      this.detTrx.map(x => {
        x.dpp = this.$dwn.kali([x.qty, x.hargaSat])
        if (this.pr.ppn === 'in') {
          x.dpp = Number(this.$dwn.kali([x.qty, x.hargaSat]) / 1.11).toFixed(2)
          x.ppn = this.$dwn.jumlah([this.$dwn.kali([x.qty, x.hargaSat]), -x.dpp])
        } else if (this.pr.ppn === 'ex') {
          x.ppn = this.$dwn.kali([x.dpp, 0.11])
        } else {
          x.ppn = 0
        }
        x.ongkir = this.pr.ongkir === 'Y' ? (x.dpp / this.totalAll.tdpp) * biaya : 0
        x.jmlHarga = x.dpp
        x.hpp = (this.jnsTrx === 'B' && biaya > 0) ? this.$dwn.jumlah([x.dpp, (x.dpp / this.totalAll.tdpp * biaya)])
          : (this.jnsTrx === 'B' && Number(biaya) === 0) ? x.dpp : x.hp * x.qty
        return x
      })
      /* let onkr = this.detTrx.reduce((a, b) => this.$dwn.jumlah([a, b.ongkir]), 0)
      if (biaya > onkr) {
        this.detTrx[0].ongkir += onkr
      } */
    },
    partner (x) {
      this.cust = x
      this.pr.kodePartner = x.kodePartner
    }
  }
}
</script>
