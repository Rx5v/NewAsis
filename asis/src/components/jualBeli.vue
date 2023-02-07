<template>
  <q-card>
    <!-- {{pr}}  -->
    <q-card-section>
      <div class="text-h5 text-orange-13"><span class="label-head"> Tambah {{ jenis.label }}</span></div>
      <q-chip color="blue-12" outline class="shadow-3 absolute-top-right" clickable @click="stk= true">Data Produk</q-chip>
      <q-separator spaced/>
      <q-form
        @submit="addJB(pr)"
        @reset="onReset"
        class="q-gutter-md">
        <crProduk @dtProduk="cekStoki" ref="crProduk" :kodeCab="pr.cabID" :jnsTrx="jnsTrx"/>
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
                    <q-item-label>Stok Kongsi</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-item-label><q-chip outline color="accent" >{{ kongsi.sisa }}</q-chip></q-item-label>
                  </q-item-section>
                </q-item>
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
                <q-item dense>
                  <q-item-section>
                    <q-item-label>Point Member</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-item-label>
                      {{ dtpil.pointMember | duit }} %
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card-section>
            <q-card-actions align="right">
              <q-btn rounded label="Kembali" color="warning" v-close-popup />
              <q-btn rounded label="Pilih" color="primary" v-close-popup @click="onpil(dtpil)"/>
            </q-card-actions>
          </q-card>
        </q-dialog>
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
        </q-toolbar>
        <q-separator color="teal"/>
        <div class="row justify-left q-gutter-md" >
          <div class="col-xs-6 col-sm-3 col-md-2">
            <q-input filled v-model="pr.tgl" label="Tanggal" dense lazy-rules :rules="inRul" readonly>
              <template v-slot:append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy v-if="['MAN','acc','mitra'].some(a=> a== $store.state.auth.user.userType)" ref="qDateProxy" transition-show="scale" transition-hide="scale">
                    <q-date v-model="pr.tgl" @input="() => $refs.qDateProxy.hide()" mask="YYYY-MM-DD" lazy-rules :rules="inRul"/>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
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
              <q-toggle
              v-if="$store.state.auth.user.ecommerce === 'Y'"
              v-model="pr.ecommerce"
              color="orange"
              keep-color
              checked-icon="check"
              true-value="Y"
              false-value="N"
              label="Toko Online"
              unchecked-icon="clear"
              @input="gantiEcom(pr)"
            />
            <q-select
              v-if="pr.ecommerce === 'Y'"
              v-model="pr.tokoOnline"
              label="Nama Lapak"
              color="pink"
              :options="namaToko"
              emit-value
              map-options
              dense
              options-dense
              :rules="inRul"
              />
            <q-select
              v-if="['MAN','purchase', 'acc'].some(a=> a== $store.state.auth.user.userType)"
              v-model="pr.cabID"
              :options="cabAsi"
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
          <div class="col-xs-6 col-sm-3 col-md-3">
            <template v-if="pr.ac==='N'">
              <q-input :value="cust.namaPartner" :label="jenis.partner" :hint="`alamat : ${cust.alamat}`" dense lazy-rules :rules="inRul" readonly @click="crp = true"/>
              <q-dialog v-model="crp" persistent>
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
              </q-dialog>
            </template>
            <template v-else>
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
            </template>
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
              :options="akunCOA.filter(a => a.pembayaran.includes(pr.ct))"
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
            <q-file outlined v-if="['tempo', 'EDC', 'Bank', 'eMoney'].includes(pr.ct) && pr.ancab !== 'Y'"
              v-model="pr.spkFile"
              max-file-size="2097152"
              label="Upload Bukti"
              hint="Maksimal 2MB"
              :rules="inRul"
              counter>
              <template v-slot:prepend>
                <q-icon name="attach_file" />
              </template>
            </q-file>
          </div>
          <div class="col-xs-6 col-sm-3 col-md-3">
            <q-select
              clearable
              dense
              color="purple-12"
              v-model="pr.ppn"
              :options="[{label:'Tanpa Ppn',value:'no'},{label:'Exclude PPN',value:'ex'},{label:'Include',value:'in'}]"
              emit-value
              map-options
              style="min-width: 250px; max-width: 300px"
              label="PPN 11 %"
              :rules="inRul"
              @input="setHPP"
              lazy-rules>
            </q-select>
            <q-input
              type="textarea"
              v-model="pr.note"
              label="Note"
              dense/>
          </div>
        </div>
        <q-table
          class="dataPR"
          :data="detTrx"
          :columns="jdld"
          row-key="kodeProduk"
          :pagination.sync="pagination"
          dense
          wrap-cells
          separator="cell">
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
                <q-popup-edit v-model="props.row.keterangan" buttons>
                  <q-input v-model="props.row.keterangan"
                    dense autofocus counter
                    @keyup.enter.stop
                    type="textarea" label="Keterangan"/>
                </q-popup-edit>
                <!-- <q-btn label="SN"/>
                <q-popup-edit v-model="props.row.sn">
                  <q-input v-model="props.row.sn" dense autofocus counter  type="textarea"/>
                </q-popup-edit> -->
              </q-td>
              <q-td key="jmlKemasan" :props="props">
                {{ props.row.jmlKemasan }} {{ props.row.kemasan.kemasan || 'error'}}
                <q-popup-edit v-model="props.row.jmlKemasan">
                  <q-input v-model="props.row.jmlKemasan" dense autofocus counter @input="onSave(props.row)"/>
                </q-popup-edit>
              </q-td>
              <q-td key="hargaKemasan" :props="props">
                <q-chip outline v-show="['gudang','produksi'].every(a=> a !== $store.state.auth.user.userType)">
                  {{ props.row.hargaKemasan | duit }}
                  <q-popup-edit v-model="props.row.hargaKemasan">
                    <q-input v-model="props.row.hargaKemasan" dense autofocus counter  @change="onSave(props.row)"/>
                  </q-popup-edit>
                </q-chip>
              </q-td>
              <q-td key="dpp" :props="props">
                <q-chip outline v-show="['gudang','produksi'].every(a=> a !== $store.state.auth.user.userType)">
                  {{ props.row.dpp | duit }}
                  <!-- <q-popup-edit v-model="props.row.dpp">
                    <q-input v-model="props.row.dpp" dense autofocus counter />
                  </q-popup-edit> -->
                </q-chip>
              </q-td>
              <q-td key="ppn" :props="props">
                {{ props.row.ppn | duit }}
                <!-- <q-popup-edit v-model="props.row.ppn">
                  <q-input v-model="props.row.ppn" dense autofocus counter  @input="onSave(props.row)"/>
                </q-popup-edit> -->
              </q-td>
              <q-td key="act"  :props="props" auto-width>
                <q-icon name="close" color="red" @click="ondel(props.row)" />
              </q-td>
            </q-tr>
          </template>
          <template v-slot:bottom-row v-if="['gudang','produksi'].every(a=> a !== $store.state.auth.user.userType)">
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
            <q-tr >
              <q-td colspan="6" align="right">Point Member</q-td>
              <q-td align="right">{{ totalAll.pointMember | duit }}</q-td>
            </q-tr>
          </template>
        </q-table>
        <div align="right">
          <q-btn label="Reset" type="reset" color="warning" outline />
          <q-btn label="Simpan" outline type="submit" color="primary" class="q-ml-sm"/>
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
    </q-card-section>
    <q-dialog
        seamless position="right"
        full-height
        v-model="stk"
        persistent>
        <q-card
          style="max-width: 100vw; max-height: 100vh">
          <q-card-section>
            <div class="text-h6 text-blue-13">Pilih Produk</div>
            <q-btn icon="close" color="red" dense v-close-popup class="absolute-top-right"/>
            <q-separator color="purple-13"/>
          </q-card-section>
          <q-card-section>
            <stok @dtStok="cekStoki"/>
          </q-card-section>
        </q-card>
      </q-dialog>
  </q-card>
</template>

<script>
import { exPartner, detPR, cekStok, carikar, accRek, dtCab } from '../services/apiList'
import crProduk from './cariProduk'
import cariPartner from './cariPartner'
import stok from './stokSatu'
import { reactive, toRefs, watch } from '@vue/composition-api'
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
  components: {
    cariPartner,
    crProduk,
    stok
  },
  setup (props, { root, emit }) {
    const dt = reactive({
      stk: false,
      detTrx: [],
      jdld: [
        { name: 'No', label: 'No', field: row => row.index, align: 'right' },
        { name: 'kodeProduk', label: 'Kode Produk', field: row => row.kodeProduk, align: 'left' },
        { name: 'namaBarang', label: 'Nama Produk', field: row => row.namaBarang, align: 'left' },
        { name: 'keterangan', label: 'Keterangan', field: row => row.keterangan, align: 'left', style: 'max-width: 250px' },
        { name: 'jmlKemasan', label: 'Qty', field: row => row.jmlKemasan, jml: 'Y', align: 'right' },
        { name: 'hargaKemasan', label: 'harga @', field: row => row.hargaKemasan, align: 'right' },
        // { name: 'hpp', label: 'hpp', field: row => row.hpp, align: 'right' },
        { name: 'dpp', label: 'DPP', field: row => row.dpp, jml: 'Y', align: 'right' },
        { name: 'ppn', label: 'PPN', field: row => row.ppn, jml: 'Y', align: 'right' },
        { name: 'act', label: 'Act' }
      ],
      adP: false,
      inRul: [ v => !!v || 'Isi data' ],
      pr: { tgl: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10),
        jnsTrx: 'J',
        ct: 'tunai',
        ac: 'N',
        cabLain: '',
        tempo: '0',
        ongkir: 'N',
        kurir: 'N',
        akunBayar: '',
        ppn: 'no',
        pot: 'N',
        salesID: root.$store.state.auth.user.eID,
        walkIn: 'Y',
        spkFile: null,
        ecommerce: 'N',
        tokoOnline: '',
        cabID: root.$store.state.auth.setCabang
      },
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
      cust: { namaPartner: '', alamat: '', spk: 'N' },
      imageSrc: '',
      cabAll: [],
      tempo: [
        { label: ' 7 Hari', value: '7' },
        { label: '14 hari', value: '14' },
        { label: '30 hari', value: '30' }
      ],
      namaToko: [
        { label: 'Tokopedia', value: 'Tokopedia' },
        { label: 'Bukalapak', value: 'Bukalapak' },
        { label: 'Lazada', value: 'Lazada' },
        { label: 'Blibli', value: 'Blibli' },
        { label: 'Lainnya', value: 'Lainnya' }
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
      kongsi: { jmlQty: 0, kirim: 0, sisa: 0 },
      cabAsi: [],
      cabPilih: { spk: 'N' }
    })
    watch(() => root.$store.state.auth.setCabang, (val) => {
      dt.pr.cabID = val
    })
    watch(() => dt.pr, (val) => {
      dt.cabPilih = dt.cabAll.find(a => a.kodeCab === val.cabID)
    }, { deep: true })
    return { ...toRefs(dt) }
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
      return this.pr.ac === 'Y' ? `Jual beli ${this.cabAll.find(a => a.kodeCab === this.pr.cabID).namaCabang} ke ${this.cabAll.find(a => a.kodeCab === this.pr.cabLain).namaCabang}` : null
    },
    cabLain () {
      let x = ['MAN', 'purchase', 'acc'].some(a => a === this.$store.state.auth.user.userType) ? this.cabAll : this.cabAll.filter(a => a.kodeCab !== this.$store.state.auth.user.kodeCab)
      return x
    },
    crByr () {
      // let user = this.$store.getters['auth/user']
      let x = this.pr.ac === 'Y' ? [{ label: 'Tempo', value: 'tempo' }] : [{ label: 'Tempo', value: 'tempo' }, { label: 'Cash', value: 'tunai' }, { label: 'Transfer', value: 'Bank' }, { label: 'EDC', value: 'EDC' }, { label: 'Sales', value: 'sales' }, { label: 'CRM', value: 'CRM' }]
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
      x.pointMember = this.detTrx.reduce((a, b) => this.$dwn.jumlah([a, b.jmlPoint]), 0)
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
    dtCab()
      .then(({ data }) => {
        const pegang = this.$store.state.auth.user.cabGrup
        this.cabAll = data
        this.cabAsi = data.filter(a => pegang.some(s => s === a.kodeCab))
      })
    accRek()
      .then(({ data }) => {
        this.akunCOA = data.filter(a => a.JB === 'Y')
        console.log(this.akunCOA.filter(a => !a.pembayaran))
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
        this.pr.akunBayar = ''
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
      const det = this.detTrx.map(a => {
        a.jmlPoint = (this.kodeCab === 'AM01' || this.pr.cabID === 'AM01' || this.pr.ac !== 'N') ? 0 : a.jmlPoint
        return a
      })
      x.status = 'W' // (x.ac === 'Y' || this.jnsTrx === 'B') ? 'W' : this.status
      x.jnsTrx = this.jnsTrx
      x.judulTransaksi = this.judulTransaksi || x.keterangan
      x.kodePartner = this.cust.kodePartner
      /*       x.cabID = noreff.cabID ? noreff.cabID : ''
      x.nomorPR = noreff.nomorPR ? noreff.nomorPR : '' */
      x.total = this.$dwn.jumlah([this.totalAll.tharga, this.exp.biaya])
      if (det.every(a => (a.qty > 0 && a.jmlHarga > 0)) && det.length > 0) {
        const formData = new FormData()
        formData.append('spkFile', x.spkFile)
        formData.append('hd', JSON.stringify(x))
        formData.append('det', JSON.stringify(det))
        formData.append('exp', JSON.stringify(this.exp))
        formData.append('pot', JSON.stringify(this.pot))
        // addJB({ hd: x, det: det, exp: this.exp, pot: this.pot })
        this.$axios.post('/jualbeli', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
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
        this.$q.notify({ message: 'isi data qty dan harga dulu...', color: 'purple' })
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
        ct: '',
        ac: 'N',
        cabLain: '',
        tempo: '0',
        ongkir: 'N',
        kurir: 'N',
        akunBayar: '',
        ppn: 'no',
        salesID: this.$store.state.auth.user.eID,
        pot: 'N',
        walkIn: 'Y',
        spkFile: null,
        ecommerce: 'N',
        tokoOnline: ''
      }
      this.pot.diskon = 0
      this.detTrx = []
      this.exp = {
        partnerID: null,
        biaya: 0,
        alamatTujuan: ''
      }
    },
    cekStoki (s) {
      let x = { ...s }
      x.qty = x.qty || 1
      x.jmlKemasan = x.jmlKemasan || 1
      let kodeCab
      if (['MAN', 'acc', 'purchase'].some(a => a === this.$store.state.auth.user.userType)) {
        kodeCab = this.pr.ac === 'Y' && this.jnsTrx === 'B' ? this.pr.cabLain : this.pr.cabID
      } else {
        kodeCab = this.$store.state.auth.user.kodeCab
      }
      if (x.kodeProduk) {
        if (this.detTrx.find(a => a.kodeProduk === x.kodeProduk)) {
          this.$q.notify({ message: `Barang ${x.kodeProduk} sudah ada di list... `, color: 'red-13' })
        } else {
          cekStok({ kodeProduk: x.kodeProduk, kodeCab: kodeCab, kodePartner: this.pr.kodePartner })
            .then(res => {
              if (res.data[1]) {
                this.kongsi = res.data[1]
                this.pr.pjKongsi = 'Y'
              } else {
                this.pr.pjKongsi = null
              }
              x.hargaRetail = x.hargaJual || res.data[0].hargaRetail
              x.hargaGrosir = res.data[0].hargaGrosir || 0
              x.price1 = res.data[0].hargaGrosir || 0
              x.kongsi = res.data[0].kongsi || 0
              x.stok = res.data[0].jasa === 'Y' || x.jasa === 'Y' ? 1000 : this.pr.pjKongsi === 'Y' ? this.kongsi.sisa : res.data[0].saldo
              x.hp = res.data[0].hpp || 0
              x.qty = x.qty > 0 ? (x.stok > x.qty ? x.qty : x.stok) : 0
              x.hargaSat = x.hargaRetail > x.price1 ? x.hargaRetail : x.price1
              x.jns = 'hargaRetail'
              x.pointMember = this.jnsTrx === 'J' ? res.data[0].pointMember : 0
              // x.konversi = JSON.parse(x.konversi) || []
              x.kemasan = x.kemasan || { isi: 1, kemasan: 'Pcs' }
              x.hargaKemasan = x.hargaKemasan || x.hargaSat * x.kemasan.isi
              x.jmlPoint = this.cust.point === 'Y' ? (x.pointMember * x.qty * x.hargaSat) / 100 : 0
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
        y.jmlHarga = this.$dwn.kali([y.jmlKemasan, y.hargaKemasan])
        y.dpp = y.jmlHarga
        if (this.pr.ppn === 'in') {
          y.dpp = Number(this.$dwn.kali([y.jmlHarga, 100 ]) / 111).toFixed(2)
          y.ppn = this.$dwn.jumlah([y.jmlHarga, -y.dpp])
        } else if (this.pr.ppn === 'ex') {
          y.ppn = this.$dwn.kali([y.dpp, 0.11])
        } else {
          y.ppn = 0
        }
        this.ad = y
        //  this.adBar = true
        this.detTrx.push(y)
        this.$refs.crProduk.cari = ''
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
            this.$q.notify({ message: `stok hanya tersedia ${x.stok} pcs`, color: 'purple' })
          }
          if (x.qty > x.sisa) {
            x.qty = x.sisa
            x.jmlKemasan = 0
            //          x.hargaSat = x.hargaSat > x.hpp ? x.hargaSat : x.hpp
            this.$q.notify({ message: `sisa permintaan hanya ${x.sisa} pcs`, color: 'purple' })
          }
          if (x.hargaSat < x.price1) {
            this.$q.notify({ message: `harga terlalu rendah...`, color: 'purple' })
            x.hargaSat = x.price1
            x.hargaKemasan = x.price1
          }
        }

        /* if (this.ppn === 'in') {
          x.ppn = this.$dwn.kali([x.dpp, 1 / 11])
        } else {
          x.ppn = this.$dwn.kali([x.dpp, 0.1])
        } */
        x.jmlHarga = this.$dwn.kali([x.hargaKemasan, x.jmlKemasan])
        x.jmlPoint = this.jnsTrx === 'J' && x.pointMember > 0 && this.cust.point === 'Y' ? this.$dwn.kali([x.jmlKemasan, x.hargaKemasan, x.pointMember]) / 100 : 0
        x.dpp = x.jmlHarga
        if (this.pr.ppn === 'in') {
          // x.ppn = this.$dwn.kali([x.jmlHarga, 1 / 11])
          x.dpp = Number(this.$dwn.kali([x.jmlHarga, 100]) / 111).toFixed(2)
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
        x.dpp = this.$dwn.kali([x.jmlKemasan, x.hargaKemasan])
        if (this.pr.ppn === 'in') {
          // x.ppn = this.$dwn.kali([x.qty, x.hargaSat, 1 / 11])
          x.dpp = Number(this.$dwn.kali([x.jmlKemasan, x.hargaKemasan, 100]) / 111).toFixed(2)
          x.ppn = this.$dwn.jumlah([this.$dwn.kali([x.jmlKemasan, x.hargaKemasan]), -x.dpp])
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
      if (x.point !== 'Y') {
        this.detTrx.map(a => {
          a.jmlPoint = 0
          return a
        })
      } else {
        this.detTrx.map(a => {
          a.jmlPoint = (a.jmlHarga * a.pointMember) / 100
          return a
        })
      }
    },
    gantiEcom (x) {
      if (x.ecommerce === 'N') {
        x.tokoOnline = ''
      }
    }
  }
}
</script>
<style scoped>

</style>
