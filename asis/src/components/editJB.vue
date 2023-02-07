<template>
  <q-card>
    <q-card-section>
      <div class="text-h5 text-orange-9">Edit Detail Transaksi</div>
      <q-separator/>
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
                    <q-item-label>Harga @Barang</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-item-label>
                      <q-chip outline color="teal" >{{ dtpil.hargaKemasan | duit }}</q-chip>
                      <q-popup-edit v-model="dtpil.hargaKemasan">
                        <q-input v-model="dtpil.hargaKemasan" @change="onSave(dtpil)" dense autofocus counter/>
                      </q-popup-edit>
                    </q-item-label>
                  </q-item-section>
                </q-item>
                <q-item dense>
                  <q-item-section>
                    <q-item-label>Jumlah Harga Barang</q-item-label>
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
        <q-toolbar class="q-pa-md" style="border-bottom: 5px solid #6565C0">
          <div class="col-2 q-table__title">{{ jenis.label }} Barang</div>
          <q-space/>
          <q-chip color="orange">Sales: {{ pr.namaSales }}</q-chip>
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
            @input="gantiSales"
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
        <div class="row justify-between" >
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
              v-model="fileBukti"
              label="Upload/Ubah Bukti"
              max-file-size="2097152"
              hint="Maksimal 2MB"
              counter @input="ubahBukti(pr)">
              <template v-slot:prepend>
                <q-icon name="attach_file" />
              </template>
            </q-file>
            <q-btn label="Cek Bukti" color="cyan-5" @click="getSPK(pr)" v-if="pr.spkFile"/>
          </div>
          <div class="col-xs-6 col-sm-3 col-md-2">
            <template  v-if="pr.ac==='N'">
              <q-input :value="cust.namaPartner" :label="jenis.partner" :hint="`alamat : ${cust.alamat}`" dense lazy-rules :rules="inRul" @click="crp = true" readonly/>
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
          <div class="col-xs-6 col-sm-3 col-md-3">
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
            <div>
              Lampiran Transaksi
              <q-btn icon="add" outline rounded color="orange-13" label="Add Lampiran" @click="addLamp = true" class="text-right q-ml-md"/>
            </div>
            <q-separator color="purple"/>
            <q-list dense
              v-for="(a, i) in lampTrans" :key="i">
              <q-item dense>
                <!-- <q-item-section>
                  <q-item-label no-wrap>{{ i + 1 }}</q-item-label>
                </q-item-section> -->
                <q-item-section class="text-teal">
                  <q-item-label >
                    {{ i + 1}}. {{ a.namaLampiran }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side>

                  <q-btn-group class="">
                    <q-icon name="cloud_download" color="teal-13" size="md" @click="downLamp(a)">
                      <q-tooltip content-class="bg-teal text-bold" content-style="font-size: 14px;">Unduh {{a.namaLampiran}}</q-tooltip>
                    </q-icon>
                    <q-icon name="close" color="orange-13" size="md" @click="delLamp(a)">
                      <q-tooltip content-class="bg-warning text-bold" content-style="font-size: 14px;">Hapus {{a.namaLampiran}}</q-tooltip>
                    </q-icon>
                  </q-btn-group>
                </q-item-section>
              </q-item>
              <q-separator inset />
            </q-list>
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
                {{ props.row.dpp | duit }}
                <!-- <q-popup-edit v-model="props.row.dpp">
                  <q-input v-model="props.row.dpp" dense autofocus counter />
                </q-popup-edit> -->
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
            <q-tr v-if="pr.walkIn !== 'Y' && jnsTrx === 'J'">
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
                  @input="exp.biaya=0"
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
              <q-td align="right" colspan="2">{{ pr.ongkir==='Y' ? $dwn.jumlah([totalAll.tharga,exp.biaya,-pot.diskon]) : totalAll.tharga | duit }}</q-td>
            </q-tr>
            <q-tr >
              <q-td colspan="6" align="right">Point Member</q-td>
              <q-td align="right">{{ totalAll.pointMember | duit }}</q-td>
            </q-tr>
          </template>
        </q-table>
        <div align="right">
          <!-- <q-btn label="Batal" v-if="pr.status === 'W'" color="red" outline @click="terima('B')" class="q-ml-xs">
            <q-tooltip content-class="bg-red" :offset="[10, 10]" anchor="center left">
              Batal
            </q-tooltip>
          </q-btn> -->
          <q-btn label="Simpan" v-if="pr.status === 'W'" type="submit" class="q-ml-xs" color="primary" outline>
            <q-tooltip content-class="bg-cyan" :offset="[10, 10]" anchor="center left">
              Simpan
            </q-tooltip>
          </q-btn>
          <!-- <q-btn label="Terima" v-if="pr.status === 'W'" outline color="teal" @click="terima('T')" class="q-ml-xs">
            <q-tooltip content-class="bg-teal" :offset="[10, 10]" anchor="center left">
              Terima
            </q-tooltip>
          </q-btn> -->
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
      <q-dialog
        v-model="addLamp">
        <q-card style="width: 600px">
          <q-form
            @submit="uploadLamp(bukti)"
            >
            <q-card-section>
              <div class="text-h5 text-orange-9">Lampiran</div>
              <q-separator />
              <q-input v-model="pr.nomorBukti" label="Nomor Transaksi" :rules="inRul" readonly/>
              <q-input v-model="bukti.namaLampiran" label="Nama Dokumen" :rules="inRul"/>
              <q-uploader
                @added="factoryFn"
                style="max-width: 300px"
                @failed="uploadFailed"
                max-file-size="2050000"
                label="Maksimal 2Mb"
                max-files="1"
                hide-upload-btn
              ></q-uploader>
              <!-- <q-file outlined v-model="bukti.file" label="Pilih dokumen" counter :rules="inRul">
                <template v-slot:prepend>
                  <q-icon name="attach_file" />
                </template>
              </q-file> -->
            </q-card-section>
            <q-card-actions>
              <q-space/>
              <q-btn type="submit" color="teal" label="Simpan" class="shadow-5" outline rounded/>
            </q-card-actions>
          </q-form>
        </q-card>
      </q-dialog>
    </q-card-section>
  </q-card>
</template>

<script>
import FileSaver from 'file-saver'
import { cabang, exPartner, detPR, cekStok, editJB, carikar, accRek, editDetJB, konfirm } from '../services/apiList'
import crProduk from '../components/cariProduk'
import cariPartner from '../components/cariPartner'
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
  components: {
    cariPartner,
    crProduk
  },
  data () {
    return {
      detTrx: this.edDet,
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
      adP: false,
      addLamp: false,
      inRul: [ v => !!v || 'Isi data' ],
      pr: this.jh,
      /* { tgl: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10),
        jnsTrx: 'J',
        ct: '',
        ac: 'N',
        cabLain: '',
        tempo: '0',
        ongkir: 'N',
        kurir: 'N',
        akunBayar: '',
        ppn: 'no',
        salesID: this.$store.state.auth.user.eID }, */
      pot: { ...this.potHrg },
      selected: [],
      cari: '',
      expedisi: [],
      exp: {
        ...this.expd
      },
      pagination: {
        rowsPerPage: 0
      },
      crp: false,
      cust: this.pelanggan,
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
      kongsi: { jmlQty: 0, kirim: 0, sisa: 0 },
      fileBukti: null,
      lampTrans: [],
      bukti: { file: null, namaLampiran: '', nomorBukti: '', bukti: null }
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
    cabLain () {
      let x = this.cabAll.filter(a => a.kodeCab !== this.$store.state.auth.user.kodeCab)
      return x
    },
    crByr () {
      // let user = this.$store.getters['auth/user']
      let x = this.pr.ac === 'Y' ? [{ label: 'Tempo', value: 'tempo' }] : [{ label: 'Tempo', value: 'tempo' }, { label: 'Cash', value: 'tunai' }, { label: 'Transfer', value: 'Bank' }, { label: 'EDC', value: 'EDC' }, { label: 'Sales', value: 'sales' }, , { label: 'CRM', value: 'CRM' }]
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
    cabang()
      .then(({ data }) => {
        this.cabAll = data
      })
    accRek()
      .then(({ data }) => {
        this.akunCOA = data.filter(a => a.JB === 'Y')
      })
    this.cariSales()
    this.dataLamp(this.jh)
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
    gantiSales () {
      this.pr.namaSales = this.pilihSales.find(a => a.salesID === this.pr.salesID).namaKaryawan
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
    ubahBukti (x) {
      if (this.fileBukti) {
        this.$q.dialog({
          title: 'Upload Bukti',
          message: `Untuk Nomor Transaksi : ${x.nomorBukti} ?`,
          options: {
            type: 'radio',
            model: 'konfr',
            // inline: true
            items: [
              { label: 'Ya', value: 'Y', color: 'secondary' }
            ],
            isValid: val => ['Y'].some(a => a === val)
          },
          ok: {
            push: true
          },
          cancel: true,
          persistent: false
        }).onOk((data) => {
          const formData = new FormData()
          formData.append('spkFile', this.fileBukti)
          formData.append('hd', JSON.stringify(x))
          this.$axios.post('/uploadBukti', formData, {
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
        }).onCancel(() => {
          this.fileBukti = null
        })
      }
    },
    addJB (x) {
      const det = this.detTrx.map(a => {
        a.jmlPoint = (this.kodeCab === 'AM01' || this.pr.cabID === 'AM01' || this.pr.ac !== 'N' || x.point !== 'Y') ? 0 : a.jmlPoint
        return a
      })
      x.status = 'W' // (x.ac === 'Y' || this.jnsTrx === 'B') ? 'W' : this.status
      x.jnsTrx = this.jnsTrx
      let dataDet
      if (this.jnsTrx === 'J') {
        dataDet = det.map(ss => {
          let a = ss
          a.hpp = ss.hp * ss.qty
          return a
        })
      } else {
        dataDet = det
      }
      // x.kodePartner = this.cust.kodePartner
      /*       x.cabID = noreff.cabID ? noreff.cabID : ''
      x.nomorPR = noreff.nomorPR ? noreff.nomorPR : '' */
      x.total = this.$dwn.jumlah([this.totalAll.tharga, this.exp.biaya])
      if (det.every(a => (a.qty > 0 && a.jmlHarga > 0)) && det.length > 0) {
        editJB({ hd: x, det: dataDet, exp: this.exp, pot: this.pot })
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
        this.$q.notify({ message: 'Cek qty, stok dan harga dulu...', color: 'purple' })
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
        pot: 'N',
        salesID: this.$store.state.auth.user.eID,
        ecommerce: 'N',
        tokoOnline: ''
      }
      this.detTrx = []
      /* this.exp = {
        partnerID: null,
        biaya: 0,
        alamatTujuan: ''
      } */
      this.pot = {
        diskon: 0,
        akunDiskon: '510100005'
      }
    },
    cekStoki (x) {
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
              x.hargaGrosir = res.data[0].hargaGrosir
              x.price1 = res.data[0].hargaGrosir
              x.stok = x.kodeCat === '17' || x.kodeCat === '19' ? 1000 : this.pr.pjKongsi === 'Y' ? this.kongsi.sisa : res.data[0].saldo
              x.hp = res.data[0].hpp
              x.qty = x.qty > 0 ? (x.stok > x.qty ? x.qty : x.stok) : 0
              x.hargaSat = x.hargaRetail > x.price1 ? x.hargaRetail : x.price1
              x.jns = 'hargaRetail'
              x.pointMember = this.jnsTrx === 'J' ? res.data[0].pointMember : 0
              x.keterangan = ''
              // x.konversi = JSON.parse(x.konversi) || []
              x.kemasan = { isi: 1, kemasan: 'Pcs' }
              x.hargaKemasan = x.hargaSat * x.kemasan.isi
              x.jmlPoint = this.cust.point === 'Y' ? (x.pointMember * x.qty * x.hargaSat) / 100 : 0
              this.dtpil = x
              this.dtpil = x
              this.kodeCab = kodeCab
              this.pil = true
              if (res.data[1]) {
                this.kongsi = res.data[1]
              }
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
        y.keterangan = ''
        y.nomorBukti = this.pr.nomorBukti
        y.hpp = this.$dwn.kali([x.hp * y.qty])
        y.jmlHarga = this.$dwn.kali([y.jmlKemasan, y.hargaKemasan])
        // y.ppn = this.pr.ppn === 'in' ? 0 : this.$dwn.kali([y.jmlHarga, 0.11])
        // y.dpp = this.$dwn.kali([y.qty, y.hargaSat])
        y.dpp = y.jmlHarga
        if (this.pr.ppn === 'in') {
          y.dpp = Number(this.$dwn.kali([y.jmlHarga, 100])/111).toFixed(2)
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
          if (x.qty > x.stok && x.jasa !== 'Y') {
            x.qty = x.stok
            x.jmlKemasan = x.qty / x.kemasan.isi
            //          x.hargaSat = x.hargaSat > x.hpp ? x.hargaSat : x.hpp
            this.$q.notify({ message: `stok hanya tersedia ${x.stok} pcs`, color: 'purple' })
          }
          if (x.qty > x.sisa && x.jasa !== 'Y') {
            x.qty = x.sisa
            x.jmlKemasan = x.qty / x.kemasan.isi
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
        x.jmlHarga = this.$dwn.kali([x.jmlKemasan, x.hargaKemasan])
        x.jmlPoint = this.jnsTrx === 'J' && x.pointMember > 0 && this.cust.point === 'Y' ? this.$dwn.kali([x.jmlKemasan, x.hargaKemasan, x.pointMember]) / 100 : 0
        x.dpp = x.jmlHarga
        if (this.pr.ppn === 'in') {
          x.dpp = Number(this.$dwn.kali([x.jmlHarga, 100]) /111).toFixed(2)
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
      if (cf && this.detTrx.length > 1) {
        this.detTrx.splice(index, 1)
        item.act = 'hps'
        if (item.iddetTrans) {
          editDetJB(item)
            .then(res => this.$q.notify({ message: 'Data tersimpan', color: 'teal' }))
            .catch(err => {
              console.log(err)
              this.$q.notify({ message: 'Gagal simpan...', color: 'pink' })
            })
        }
      } else {
        this.$q.notify({ message: 'Detail barang tidak boleh kosong...', color: 'pink', position: 'top' })
      }
    },
    setHPP () {
      let biaya = this.exp ? this.exp.biaya : 0
      this.detTrx.map(x => {
        x.dpp = this.$dwn.kali([x.jmlKemasan, x.hargaKemasan])
        x.jmlHarga = this.$dwn.kali([x.jmlKemasan, x.hargaKemasan])
        console.log('jmlHarga', x.jmlHarga)
        if (this.pr.ppn === 'in') {
          // x.ppn = this.$dwn.kali([x.qty, x.hargaSat, 1 / 11])
          x.dpp = Number(this.$dwn.kali([x.jmlHarga, 100])/111).toFixed(2)
          console.log(x.dpp, x.ppn)
          x.ppn = this.$dwn.jumlah([x.jmlHarga, -x.dpp])
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
      if (x.point === 'N') {
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
    getSPK (x) {
      const mimetype = x.mimetype ? x.mimetype.split('/')[1] : 'pdf'
      this.$axios.get('/SPKFile?',
        {
          params: { key: x.spkFile },
          responseType: 'arraybuffer'
        })
        .then(async (res) => {
          // const oke = await fetch(`data:${x.extensi};base64,${res.data}`)
          FileSaver.saveAs(new Blob([res.data]), `${x.nomorBukti}.${mimetype}`)
        })
    },
    terima (x) {
      if (this.pr.ac === 'Y' && this.pr.asal === this.$store.state.auth.user.kodeCab && x === 'T') {
        this.$q.notify({ message: 'Yang berhak menerima cabang pembeli...', color: 'warning' })
      } else if (['W', 'D'].some(a => a === this.pr.status)) {
        this.$q.dialog({
          title: `Konfirmasi ${x === 'T' ? 'Penerimaan' : 'Batal'}`,
          message: `${x === 'T' ? 'Terima' : 'Batal'} ?`,
          /* cancel: {
              label: 'Batal',
              color: 'negative'
            }, */
          ok: {
            push: true
          },
          persistent: false
        }).onOk(() => {
          this.pr.status = this.pr.ancab === 'Y' && this.pr.asal === this.$store.state.auth.user.kodeCab && x === 'T' ? 'D' : x
          konfirm(this.pr)
            .then(res => {
              this.$q.notify({ message: `${res.data.st}`, color: 'teal' })
            })
            .catch(err => {
              console.log(err)
            })
        }).onCancel(() => {
          /* console.log('cancel')
            this.pr.status = 'B'
            konfirm(this.pr)
              .then(res => {
                this.$q.notify({ message: `${res.data.st}`, color: 'teal' })
                  .catch(err => {
                    console.log(err)
                  })
              }) */
        }).onDismiss(() => {
          // console.log('I am triggered on both OK and Cancel')
        })
      }
    },
    gantiEcom (x) {
      if (x.ecommerce === 'N') {
        x.tokoOnline = ''
      }
    },
    toBase64 (file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        // reader.onloadend = (e) => resolve(imageToDataUri(e, 400, 400))
        reader.readAsDataURL(file)
        reader.onload = () => resolve(reader.result)
        reader.onerror = error => reject(error)
      })
    },
    factoryFn (file) {
      // returning a Promise   
      // console.log(file)   
      return new Promise((resolve, reject) => {
        this.toBase64(file[0]).then(data => {
            // data is base64
            this.bukti.bukti = data
            // console.log(data)
            resolve(data)
            /* setTimeout(() => {
              resolve({
                url: this.$axios.baseURL + '/uploadBuktiTrans',
                method: 'POST',
                headers: [{name:'Content-Type',value:'application/json'}],
                fields: [{name:'bukti',value:data, namaLampiran: this.lampTrans.namaLampiran, nomorBukti: this.lampTrans.nomorBukti}]
              })
            }, 2000) */
          }).catch(() => {
            this.$q.notify({
              color: 'negative',
              message: 'Failed to convert file...'
            })
            console.log('error')
            reject()
          })        
      })
    },
    uploadFailed(req) {
      console.log('failed', req)
    },
    async uploadLamp (x) {
      // console.log(x.file)
      // let file = await this.toBase64(x.file)
      /* 
      const formData = new FormData()
      formData.append('namaLampiran', x.namaLampiran)
      formData.append('nomorBukti', x.nomorBukti)
      formData.append('bukti', x.bukti) */
      x.nomorBukti = this.pr.nomorBukti
      this.$axios.post('/uploadBuktiTrans', { x })
        .then(({ data }) => {
          this.$q.notify({ message: data.st, color: 'teal' })
          this.bukti = { file: null, namaLampiran: '', nomorBukti: '', bukti: null }
          this.addLamp = false
          this.dataLamp(x)
        })
        .catch(err => {
          this.$q.notify({ message: err.response.data.st, type: 'warning' })
        })
    },
    dataLamp (x) {
      this.$axios.get('/buktiTransaksi?', { params: { key: x.nomorBukti }})
        .then(({ data }) => {
          this.lampTrans = data
        })
    },
    downLamp (x) {
      this.$axios.get('/lampiranTransaksi', { params: { key: x }})
        .then(async (res) => {
          // const oke = await fetch(`data:${x.extensi};base64,${res.data}`)
          FileSaver.saveAs(await this.base64toBlob(res.data, 'base64'), x.fileName)
        })
    },
    base64toBlob (base64Data, contentType) {
      contentType = contentType || ''
      var sliceSize = 1024
      var byteCharacters = window.atob(base64Data)
      var bytesLength = byteCharacters.length
      var slicesCount = Math.ceil(bytesLength / sliceSize)
      var byteArrays = new Array(slicesCount)

      for (var sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
        var begin = sliceIndex * sliceSize
        var end = Math.min(begin + sliceSize, bytesLength)

        var bytes = new Array(end - begin)
        for (var offset = begin, i = 0; offset < end; ++i, ++offset) {
          bytes[i] = byteCharacters[offset].charCodeAt(0)
        }
        byteArrays[sliceIndex] = new Uint8Array(bytes)
      }
      return new Blob(byteArrays, { type: contentType })
    },
    delLamp (x) {
      this.$q.dialog({
        title: 'Konfirmasi Hapus',
        message: `Nama Lampiran : ${x.namaLampiran}`,
        options: {
          type: 'radio',
          model: 'hps',
          // inline: true
          items: [
            { label: 'Ya', value: 'All', color: 'secondary' }
          ],
          isValid: val => ['All'].some(a => a === val)
        },
        cancel: {
          label: 'Batal', color: 'orange-13', outline: true, rounded: true
        },
        ok: {
          label: 'Ok', color: 'blue-13', outline: true, rounded: true
        },
        persistent: true
      }).onOk(data => {
        x.hps = data
        this.$axios.post('/delLamp', { x })
          .then(({ data }) => {
            this.$q.notify({ message: data.st, color: 'teal' })
            this.dataLamp(x)
          })
          .catch(err => {
            console.log(err)
            this.$q.notify({ message: err.response.data.st, color: 'warning' })
          })
        // console.log('>>>> OK, received', data)
      }).onCancel(() => {
        // console.log('>>>> Cancel')
      }).onDismiss(() => {
        // console.log('I am triggered on both OK and Cancel')
      })
    }
  }
}
</script>
