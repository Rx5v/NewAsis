<template>
  <div class="q-pb-md">
    <q-table
      class="dataTrx"
      :data="filt.status === 'Closed' ? dtPR.filter(a=> a.status === 'Closed') : dtPR.filter(a=> a.status !== 'Closed')"
      :columns="jdl"
      row-key="nomorPricing"
      :filter="cari"
      :pagination.sync="hal"
      dense>
      <template v-slot:top>
        <div class="col-2 q-table__title">Data Pricing</div>
        <q-space />
        <q-select
          v-model="filt.status"
          dense
          options-dense
          :options="['Open','Closed']"/>
        <q-input dense debounce="300" v-model="cari" placeholder="Search">
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
        <q-btn
          flat round dense
          icon="add_circle"
          @click="adP = true"
          class="q-ml-md"
          color="accent"
        />
        <q-toggle v-model="filt.allCab" label="Semua Cabang" @input="gantiCab(filt.allCab)"/>
          <q-select
            v-if="['MAN','acc','purchase'].some(a=> a== $store.state.auth.user.userType) && !filt.allCab"
            v-model="filt.kodeCab"
            :options="cabAll"
            :option-label="(item) => item && item.kodeCab + ' ' + item.namaCabang"
            option-value="kodeCab"
            emit-value
            map-options
            multiple
            style="min-width: 250px; max-width: 550px"
            label="Pilih cabang... "
            dense
            @input="getPR"
            lazy-rules>
            <template v-slot:option="scope">
              <q-item
                v-bind="scope.itemProps"
                v-on="scope.itemEvents"
              >
                <q-item-section>
                  <q-item-label v-html="scope.opt.namaCabang" ></q-item-label>
                  {{ scope.opt.kodeCab }}
                </q-item-section>
                <q-item-section side>
                  <q-checkbox v-model="filt.kodeCab" :val="scope.opt.kodeCab" @input="getPR"/>
                </q-item-section>
              </q-item>
            </template>
          </q-select>
      </template>
      <template v-slot:body="props">
        <q-tr :props="props">
          <q-td
            v-for="col in props.cols"
            :key="col.name"
            :props="props">
            <template v-if="col.name === 'nom'">
              <q-icon size="md" color="blue-13" :name="props.expand ? 'expand_less' : 'expand_more'" @click="dtCek(props.row,props.expand),props.expand = !props.expand" />
            </template>
            <template v-else-if="col.name === 'cabLain'">
              <template v-if="['MAN','purchase'].some(a=> a===$store.state.auth.user.userType) && props.row.ac==='Y'">
                <q-select
                  v-model="props.row.cabLain"
                  :options="cabAll"
                  :option-label="(item) => item && item.kodeCab + ' ' + item.namaCabang"
                  option-value="kodeCab"
                  emit-value
                  map-options
                  style="min-width: 250px; max-width: 300px"
                  label="Pilih cabang... "
                  dense
                  @input="updPR(props.row,'Partner')"/>
              </template>
              <template v-else>
                {{ col.value }}
              </template>
            </template>
            <template v-else-if="col.name === 'status'">
              <template v-if="['MAN','purchase','mitra','acc'].some(a=> a===$store.state.auth.user.userType)">
                <q-select
                  v-model="props.row.status"
                  dense
                  options-dense
                  :options="['Open','Disetujui','Deal','Batal']"
                  @input="updPR(props.row,'Status')"/>
              </template>
              <template v-else>
                {{ col.value }}
              </template>
            </template>
            <template v-else-if="col.name === 'note'">
              <q-popup-edit v-model="props.row.note" buttons @save="updPR(props.row,'note')">
                <q-editor
                  v-model="props.row.note"
                  :toolbar="[['bold', 'italic', 'strike', 'underline', 'subscript', 'superscript'],
                  ['unordered', 'ordered']]"
                  @keyup.enter.stop
                />
              </q-popup-edit>
            </template>
            <template v-else-if="col.name === 'act'">
              <q-btn
                v-if="props.row.status === 'Open'"
                flat round dense
                icon="add_circle"
                class="q-ml-md"
                color="teal"
                @click="addetPO(props.row)"
              />
              <q-btn v-if="props.row.status !== 'Closed'" icon-right="print" :color="props.row.status==='Release' ? 'teal' : 'warning'" size="sm" @click="cetak(props.row)"></q-btn>
            </template>
            <template v-else>
              {{ col.value }}
            </template>
          </q-td>
        </q-tr>
        <q-tr v-show="props.expand" :props="props">
          <q-td colspan="100%">
            <template v-if="dtTrxPR.some(a=> a.nomorPricing=== props.row.nomorPricing)">
              <q-markup-table>
                <q-tr>
                  <q-th align="left">No</q-th>
                  <q-th align="left">Kode Produk</q-th>
                  <q-th align="left">Nama Produk</q-th>
                  <q-th>Stok</q-th>
                  <q-th>Qty Request</q-th>
                  <q-th>Kemasan</q-th>
                  <q-th>Qty Terkirim</q-th>
                  <q-th>Harga @</q-th>
                  <q-th>Jumlah Harga</q-th>
                  <q-th v-if="['MAN','purchase', 'acc'].some(a=> a===$store.state.auth.user.userType)">Jumlah HPP</q-th>
                  <q-th v-if="['MAN','purchase', 'acc'].some(a=> a===$store.state.auth.user.userType)">Margin</q-th>
                  <q-th>Keterangan</q-th>
                  <q-th>Setuju</q-th>
                  <q-th>Act</q-th>
                </q-tr>
                <q-tr
                  v-for="(dt,i) in dtTrxPR.filter(a=> a.nomorPricing === props.row.nomorPricing)"
                  :key="dt.iddetTrans">
                  <q-td>{{ i+1 }}</q-td>
                  <q-td>{{ dt.kodeProduk }}</q-td>
                  <q-td>{{ dt.namaBarang }}</q-td>
                  <q-td align="right">{{ dt.stok }} Pcs</q-td>
                  <q-td align="right">{{ dt.jmlKemasan }} {{ dt.kemasan.kemasan || '' }}
                    <q-popup-edit v-model="dt.jmlKemasan" v-if="props.row.status === 'Open'" @save="updetPO(dt)">
                      <q-input v-model="dt.jmlKemasan" type="number" dense autofocus counter @input="(dt.jmlHPP = dt.qty * dt.hpp), adQty(dt)"/>
                    </q-popup-edit>
                  </q-td>
                  <q-td align="right">
                    {{ dt.kemasan.kemasan }}
                    <q-popup-edit v-model="dt.kemasan" v-if="props.row.status === 'Open'" buttons>
                      <q-select v-model="dt.kemasan"
                        :options="dt.konversi"
                        :option-label="val => val.isi + 'Pcs /' + val.kemasan"
                        map-options
                        dense autofocus counter/>
                    </q-popup-edit>
                  </q-td>
                  <q-td align="right">{{ dt.kirim }} {{ dt.kemasan.kemasan }}</q-td>
                  <q-td align="right">
                    <q-chip color="red" outline>{{ dt.hargaJual | duit}}</q-chip>
                    <q-popup-edit v-model="dt.hargaJual" v-if="props.row.status === 'Open'">
                      <q-input v-model="dt.hargaJual" type="number" dense autofocus counter @change="updetPO(dt)"/>
                    </q-popup-edit>
                  </q-td>
                  <q-td align="right">{{ dt.hargaJual * dt.jmlKemasan  | duit }}</q-td>
                  <q-td v-if="['MAN','purchase', 'acc'].some(a=> a===$store.state.auth.user.userType)" align="right">{{ dt.jmlHPP | duit }}</q-td>
                  <q-td v-if="['MAN','purchase', 'acc'].some(a=> a===$store.state.auth.user.userType)" align="right">{{ (dt.hargaJual * dt.jmlKemasan) - dt.jmlHPP  | duit }}</q-td>
                  <q-td align="left">
                    {{ dt.ket }}
                    <q-popup-edit v-model="dt.ket">
                      <q-input v-model="dt.ket" dense autofocus counter @change="updetPO(dt)"/>
                    </q-popup-edit>
                  </q-td>
                  <q-td>
                    <template v-if="['MAN','purchase', 'acc'].some(a=> a===$store.state.auth.user.userType)">
                      <q-checkbox v-model="dt.setuju" false-value="T" true-value="Y" :label="dt.setuju === 'Y' ? 'Ya' : 'Belum'" dense @input="updetPO(dt)"/>
                    </template>
                    <template v-else>
                      {{ dt.setuju === 'Y' ? 'Ya' : 'Belum' }}
                    </template>
                  </q-td>
                  <q-td align="right">
                    <q-btn icon="send" color="teal" @click="ambil(dt,props.row)" flat round dense/>
                    <q-btn
                      flat round dense
                      icon="close"
                      class="q-ml-md" color="red" @click="delPod(dt,props.row)" />
                  </q-td>
                </q-tr>
                <tfoot>
                  <q-tr>
                    <q-th colSpan="4" align="right">Total</q-th>
                    <q-th align="right">{{ dtTrxPR.filter(a=> a.nomorPricing === props.row.nomorPricing).reduce((a, b) => a + b.qty, 0) | nomer }}</q-th>
                    <q-td/>
                    <q-td/>
                    <q-th align="right">{{ dtTrxPR.filter(a=> a.nomorPricing === props.row.nomorPricing).reduce((a, b) => a + (b.qty * b.hargaJual), 0) | nomer }}</q-th>
                    <q-th v-if="['MAN','purchase', 'acc'].some(a=> a===$store.state.auth.user.userType)" align="right">{{ dtTrxPR.filter(a=> a.nomorPricing === props.row.nomorPricing).reduce((a, b) => a + (b.jmlHPP), 0) | nomer }}</q-th>
                    <q-th v-if="['MAN','purchase', 'acc'].some(a=> a===$store.state.auth.user.userType)" align="right">{{ dtTrxPR.filter(a=> a.nomorPricing === props.row.nomorPricing).reduce((a, b) => a + (b.qty * b.hargaJual - b.jmlHPP), 0) | nomer }}</q-th>
                  </q-tr>
                </tfoot>
              </q-markup-table>
            </template>
            <template v-else>
              <span style="font-style: italic; font-color: orange;">Belum ada detail produk {{ props.row.nomorPricing }}</span>
            </template>
          </q-td>
        </q-tr>
      </template>
    </q-table>
     <q-dialog
      v-model="adP"
      full-width
      >
      <q-card>
        <q-card-section>
          <div class="text-h6">Pricing</div>
        </q-card-section>
        <q-card-section>
          <q-form
            @submit="addPRa(pr)"
            @reset="onReset"
            class="q-gutter-md">
            <q-table
              class="detPR"
              :data="detPR"
              :columns="jdld"
              row-key="kodeProduk"
              dense>
              <template v-slot:top>
                <div class="col-4 q-table__title">Detail Penawaran</div>
                <q-input filled v-model="pr.tglRequest" readonly>
                  <template v-slot:append>
                    <q-icon name="event" class="cursor-pointer">
                      <q-popup-proxy ref="qDateProxy" transition-show="scale" transition-hide="scale">
                        <q-date v-model="pr.tglRequest" @input="() => $refs.qDateProxy.hide()" mask="YYYY-MM-DD" />
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
                <q-space/>
                <q-input :value="cust.namaPartner" label="Customer" :hint="`alamat : ${cust.alamat}`" dense lazy-rules :rules="inRul" readonly @click="crp = true"/>
                <q-dialog v-model="crp" persistent>
                  <q-card style="min-width: 350px">
                    <q-card-section>
                      <div class="text-h6">Nama Customer</div>
                    </q-card-section>
                    <q-card-section class="q-pt-none">
                      <cariPartner @dtPartner="partner" :pil="false"/>
                    </q-card-section>
                    <q-card-actions align="right" class="text-primary">
                      <q-btn flat label="Cancel" v-close-popup />
                      <q-btn flat label="Pilih" v-close-popup />
                    </q-card-actions>
                  </q-card>
                </q-dialog>
                <q-chip color="teal">Total Penawaran : {{ totalPesanan.jmlHarga | duit }}</q-chip>
                <q-select
                  v-if="['MAN','purchase','acc'].some(a=> a== $store.state.auth.user.userType)"
                  v-model="pr.cabID"
                  :options="cabAll"
                  :option-label="(item) => item && item.kodeCab + ' ' + item.namaCabang"
                  option-value="kodeCab"
                  emit-value
                  map-options
                  style="min-width: 250px; max-width: 300px"
                  label="Pilih cabang... "
                  dense
                  lazy-rules>
                </q-select>
              </template>
              <template v-slot:body="props">
                <q-tr :props="props">
                  <q-td key="kodeProduk" :props="props">
                    {{ props.row.kodeProduk }}
                  </q-td>
                  <q-td key="namaBarang" :props="props">
                    {{ props.row.namaBarang }}
                  </q-td>
                  <q-td key="stok" :props="props">
                    {{ props.row.saldo }} Pcs
                  </q-td>
                  <q-td key="jmlKemasan" :props="props" align="right">
                    <q-chip color="red" outline>{{ props.row.jmlKemasan }} {{ props.row.kemasan.kemasan }}</q-chip>
                    <q-popup-edit v-model="props.row.jmlKemasan">
                      <q-input v-model="props.row.jmlKemasan" type="number" dense autofocus counter @input="adQty(props.row)"/>
                    </q-popup-edit>
                  </q-td>
                  <q-td key="kemasan" :props="props" align="right" auto-width>
                    <q-select
                      :options="props.row.konversi"
                      v-model="props.row.kemasan"
                      dense
                      map-options
                      :option-label="(val) => val.isi + ' pcs/ ' + val.kemasan"
                      label="Kemasan *"
                      :rules="inRul"
                      @input="adQty(props.row)"
                      class="text-right"
                      style="width: 150px"/>
                  </q-td>
                  <q-td key="hargaJual" :props="props" align="right">
                    <q-chip color="red" outline>{{ props.row.hargaJual | duit}}</q-chip>
                    <q-popup-edit v-model="props.row.hargaJual">
                      <q-input v-model="props.row.hargaJual" type="number" dense autofocus counter/>
                    </q-popup-edit>
                  </q-td>
                  <q-td key="act"  :props="props">
                    <q-icon name="close" color="red" @click="ondel(props.row)" />
                  </q-td>
                </q-tr>
              </template>
            </q-table>
            <div align="right">
              <q-btn label="Simpan" outline type="submit" color="primary" class="shadow-3"/>
              <q-btn label="Reset" outline type="reset" color="warning" flat class="q-ml-sm shadow-3" />
            </div>
          </q-form>
        </q-card-section>
        <produk @dtStok="onpil"/>
      </q-card>
    </q-dialog>
    <q-dialog
      v-model="dPr">
      <q-card>
          <q-table
            v-if="selected.length>0"
            class="detPR"
            :data="detPR"
            :columns="jdld"
            row-key="kodeProduk"
            dense>
            <template v-slot:top>
              Detail <q-chip outline>Nomor Pricing :{{ pr.nomorPricing }}</q-chip>
              <q-input filled v-model="pr.tglRequest" readonly/>
            </template>
            <template v-slot:body="props">
              <q-tr :props="props">
                <q-td key="kodeProduk" :props="props">
                  {{ props.row.kodeProduk }}
                </q-td>
                <q-td key="namaBarang" :props="props">
                  {{ props.row.namaBarang }}
                </q-td>
                <q-td key="qty" :props="props">
                  {{ props.row.qty }}
                  <q-popup-edit v-model="props.row.qty">
                    <q-input v-model="props.row.qty" dense autofocus counter />
                  </q-popup-edit>
                </q-td>
                <q-td key="hargaJual" :props="props">
                  {{ props.row.hargaJual | duit }}
                  <q-popup-edit v-model="props.row.hargaJual">
                    <q-input v-model="props.row.hargaJual" dense autofocus counter  @change="onSave(props.row)"/>
                  </q-popup-edit>
                </q-td>
                <q-td key="act"  :props="props">
                  <template v-if="['MAN','purchase', 'acc'].some(a=> a===$store.state.auth.user.userType)">
                    <q-icon name="send" color="teal" @click="ambil(props.row,pr)" />
                    <q-icon name="close" color="red" @click="ondel(props.row)" />
                  </template>
                  <template v-else-if="pr.cabID === $store.state.auth.user.kodeCab">
                    <q-icon name="close" color="red" @click="ondel(props.row)" />
                  </template>
                  <template v-else>
                    <q-icon name="send" color="teal" @click="ambil(props.row,pr)" />
                  </template>
                </q-td>
              </q-tr>
            </template>
          </q-table>
      </q-card>
    </q-dialog>
    <q-dialog v-model="confirm" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar outline icon="print" color="primary" text-color="white" />
          <span class="q-ml-sm">Menu Cetak : #{{ ctk.nomorPricing }}</span>
          <q-space/>
          <q-icon
            class="absolute-top-right shadow-3"
            size="md"
            name="close"
            color="red"
            v-close-popup/>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn outline label="Penawaran A4" class="shadow-3" color="primary" @click="printA4(ctk)" />
          <!-- <q-btn outline label="Invoice Kertas Ply" color="primary" @click="printW(ctk)" /> -->
        </q-card-actions>
      </q-card>
    </q-dialog>
    <q-dialog
      v-model="crB">
      <cariProduk @dtProduk="tmbDetPO"/>
    </q-dialog>
  </div>
</template>

<script>
import { dtPricing, detPO, addPricing, upPricing, editPriceDet, getBankCab, dtCab, detPricing, delpricedet } from '../services/apiList'
import { reactive, toRefs, computed, watch } from '@vue/composition-api'
import produk from '../components/stok'
import cariPartner from '../components/cariPartner'
import cariProduk from './cariProduk'
export default {
  components: {
    produk,
    cariPartner,
    cariProduk
  },
  setup (props, { root, emit }) {
    const dt = reactive({
      crB: false,
      detP: { nomorPricing: '' },
      dtPR: [],
      jdl: [
        { name: 'nom', label: 'check', align: 'left' },
        { name: 'nomorPricing', label: 'Nomor Pricing', field: row => row.nomorPricing, align: 'left' },
        { name: 'tglRequest', label: 'Tanggal Request', field: row => row.tglRequest, align: 'left' },
        { name: 'kodePartner', label: 'Kode Partner', field: row => row.kodePartner, align: 'left' },
        { name: 'namaPartner', label: 'Nama Partner', field: row => row.namaPartner, align: 'left' },
        { name: 'totalHarga', label: 'Total Harga', field: row => row.totalHarga, jml: 'Y', format: val => new Intl.NumberFormat('en-ID', { style: 'currency', currency: 'IDR' }).format(val), align: 'right' },
        { name: 'status', label: 'Status', field: row => row.status, align: 'left' },
        { name: 'note', label: 'Note', field: row => row.note },
        { name: 'act', label: 'Act' }
      ],
      detPR: [],
      jdld: [
        { name: 'kodeProduk', label: 'Kode Produk', field: row => row.kodeProduk, align: 'left' },
        { name: 'namaBarang', label: 'Nama Produk', field: row => row.namaBarang, align: 'left' },
        { name: 'stok', label: 'Stok', field: row => row.stok, jml: 'Y', align: 'right' },
        { name: 'jmlKemasan', label: 'Qty Request', field: row => row.jmlKemasan, jml: 'Y', align: 'right' },
        { name: 'kemasan', label: 'Kemasan', field: row => row.kemasan, jml: 'Y', align: 'right' },
        { name: 'hargaJual', label: 'harga @', field: row => row.hargaJual, jml: 'Y', align: 'right' },
        { name: 'act', label: 'Act' }
      ],
      dtTrxPR: [],
      adP: false,
      dPr: false,
      inRul: [ v => !!v || 'Isi data' ],
      pr: {
        tglRequest: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10),
        ac: 'N',
        cabLain: '',
        kodePartner: '',
        namaCabang: '',
        alamatCabang: '',
        cabID: '' },
      category: [
        { label: 'Printer', value: '1' },
        { label: 'Tinta', value: '2' },
        { label: 'Laptop', value: '3' },
        { label: 'Komputer', value: '4' }
      ],
      selected: [],
      cari: '',
      crp: false,
      filt: { kodeCab: [], status: 'Open', allCab: true },
      cabAll: [],
      hal: { rowsPerPage: 10 },
      cust: { namaPartner: '', alamat: '' },
      ctk: {},
      confirm: false
    })
    dtCab().then(({ data }) => {
      const pegang = root.$store.state.auth.user.cabGrup
      dt.cabAll = data.filter(a => pegang.some(s => s === a.kodeCab))
      dt.filt.kodeCab = dt.cabAll.map(a => a.kodeCab)
      getPR()
    })
    const addetPO = (x) => {
      dt.crB = true
      dt.detP.nomorPricing = x.nomorPricing
    }
    const tmbDetPO = (x) => {
      if (x.kodeProduk) {
        x.nomorPricing = dt.detP.nomorPricing
        x.kirim = 0
        x.qty = 0
        if (x.hpp <= 0) {
          x.hpp = x.hargaGrosir > 0 ? x.hargaGrosir : x.hargaRetail
        }
        x.hargaJual = x.hargaRetail
        x.iddetPricing = null
        x.setuju = 'T'
        x.ket = ''
        let a = dt.dtTrxPR.find(s => s.kodeProduk === x.kodeProduk && s.nomorPricing === x.nomorPricing)
        if (a) {
          root.$q.notify({ message: `${x.namaBarang} ini sudah ada di PO: ${x.nomorPricing}`, color: 'orange' })
        } else {
          dt.dtTrxPR.push(x)
        }
      }
    }
    const updPR = (x, y) => {
      console.log('ook')
      root.$q.dialog({
        title: `Update Pricing`,
        message: `Update ${y} ?`,
        cancel: true,
        persistent: false
      }).onOk(() => {
        upPricing(x)
          .then(({ data }) => {
            root.$q.notify({ message: `${data.st}`, color: 'teal' })
          })
          .catch((err) => {
            root.$q.notify({ message: `${err.response.data.st}`, color: 'purple' })
          })
      }).onCancel(() => {
        // console.log('>>>> Cancel')
      }).onDismiss(() => {
        // console.log('I am triggered on both OK and Cancel')
      })
    }
    const dtCek = (x, y) => {
      dt.dtTrxPR.forEach((a, b, c) => {
        if (a.nomorPricing === x.nomorPricing.toString()) {
          c.splice(b, 1)
        }
      })
      if (!y) {
        detPricing({ nomorPricing: x.nomorPricing, cabID: x.cabID })
          .then(res => {
            dt.dtTrxPR.push(...res.data.map(a => {
              a.konversi = JSON.parse(a.konversi) || []
              a.kemasan = JSON.parse(a.kemasan) || []
              return a
            }))
          })
          .catch(err => {
            console.log(err)
          })
      }
    }
    const getPR = () => {
      dt.dtPR = []
      if (dt.filt.kodeCab.length) {
        dtPricing(dt.filt)
          .then(({ data }) => {
            dt.dtPR = data
          })
          .catch((err) => {
            console.log(err)
          })
      }
    }
    const adQty = (x) => {
      x.qty = x.jmlKemasan * x.kemasan.isi
    }
    const onReset = () => {
      dt.pr = { tglRequest: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10) }
      dt.detPR = []
      dt.cust = { namaPartner: '', alamat: '' }
    }
    const addPRa = (x) => {
      if (dt.detPR.every(a => a.qty > 0)) {
        addPricing({ hd: x, det: dt.detPR })
          .then(res => {
            onReset()
            getPR()
            root.$q.notify({ message: `${res.data.st}`, color: 'teal' })
          })
          .catch((err) => {
            console.log(err)
            root.$q.notify({ message: `${err.response.data.st}`, color: 'purple' })
          })
      } else {
        root.$q.notify({ message: `isi detail dan qty dulu...`, color: 'purple' })
      }
    }
    const getdetPR = (x) => {
      dt.dPr = true
      dt.pr = x
      dt.selected = [x]
      detPO(x)
        .then(res => {
          dt.detPR = res.data
          let e = Object.assign({}, x)
          emit('dtBrg', e)
        })
        .catch((err) => {
          console.log(err)
          root.$q.notify({ message: `${err.response.data.st}`, color: 'purple' })
        })
    }
    const onpil = (x) => {
      let ada = dt.detPR.map(a => a.kodeProduk)
      let ax = x.filter(a => ada.every(s => s !== a.kodeProduk))
      if (ax.length) {
        let sx = { ...ax[0] }
        sx.hargaJual = sx.hargaRetail
        if (sx.hpp <= 0) {
          sx.hpp = sx.hargaGrosir > 0 ? sx.hargaGrosir : 0
        }
        sx.kemasan = { isi: 1, kemasan: 'Pcs' }
        dt.detPR.push(sx)
      }
    }
    const ambil = (x, y) => {
      emit('ambil', x, y)
      root.$q.notify({ message: `${x.namaBarang} terpilih...`, color: 'teal' })
    }
    const ondel = (item) => {
      const index = dt.detPR.indexOf(item)
      let cf = confirm(`Hapus ${item.kodeProduk} ?`)
      if (cf) {
        dt.detPR.splice(index, 1)
        /* if (item.iddetPR) {
          api.delPRd(item)
            .then(res => this.$q.notify({ message: 'Data tersimpan', color: 'success' }))
            .catch(err => this.$q.notify({ message: 'Gagal simpan...' }))
        } */
      }
    }
    const delPod = (x) => {
      root.$q.dialog({
        title: `Hapus Detail Penawaran`,
        message: `Hapus <span class="text-orange">${x.namaBarang}</span> dari Penawaran:<span class="text-orange"> ${x.nomorPricing} </span>?`,
        cancel: true,
        html: true,
        persistent: false
      }).onOk(() => {
        if (x.iddetPricing) {
          delpricedet(x)
            .then(res => {
              root.$q.notify({ message: `${res.data.st}`, color: 'teal' })
            })
            .catch((err) => {
              root.$q.notify({ message: `${err.response.data.st}`, color: 'purple' })
            })
        }
        let idx = dt.dtTrxPR.indexOf(x)
        dt.dtTrxPR.splice(idx, 1)
      }).onCancel(() => {
        // console.log('>>>> Cancel')
      }).onDismiss(() => {
        // console.log('I am triggered on both OK and Cancel')
      })
    }
    const partner = (x) => {
      dt.cust = x
      dt.pr.kodePartner = x.kodePartner
    }
    const totalPesanan = computed(() => {
      let x = {
        jmlHarga: dt.detPR.reduce((a, b) => root.$dwn.jumlah([a, b.qty * b.hargaJual]), 0)
      }
      return x
    })
    const cetak = (x) => {
      dt.ctk = x
      dt.confirm = true
    }
    const gantiCab = (x) => {
      dt.filt.kodeCab = x ? dt.cabAll.map(a => a.kodeCab) : []
      getPR()
    }
    watch(() => root.$store.state.auth.setCabang, (val) => {
      dt.filt.kodeCab = [val]
      getPR()
    })
    const printA4 = async (x) => {
      // let { data } = await getBankCab(x.cabID)
      /* let bankCabanga = data.map(s => {
        let ss = `<li>${s.namaBank}: ${s.rekening} a.n ${s.atasNama}</li>`
        return ss
      }) */
      // let bankCabang = await bankCabanga.toString().replace(/,/g, '')
      let detail = await detPricing(x)
      // let cab = dt.cabAll.find(cb => cb.kodeCab === x.cabID)
      // let diskon = x.diskon || 0
      let tHarga = detail.data.reduce((a, b) => root.$dwn.jumlah([a, b.hargaJual * b.qty]), 0)
      let wd = window.open('', 'Penawaran', 'resize = 1')
      let html = `<html>
        <title>Cetak Penawaran</title>
        <style>
        #tss{
          font-size: 14px;

        }
        #tss tr td{
          font-size: 14px;
        }
        .bdr_btm{
          border-bottom: 1px solid #000;
          font-size: 14px;
        }

        .bdr_top{
          border-top: 1px solid #000;
          font-size: 14px;
        }
        #table_product th {
          padding: 8px;
          text-align: left;
          border-bottom: 1px solid #000;
        }
        #table_product td {
          padding: 8px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        p {
          text-indent: 30px;
          text-align: justify;
          text-justify: inter-word;
        }

        @media print{
          #man {
            visibility:hidden;
          }
          thead.report-header {
            display: table-header-group;
          }
          .pisah {
            page-break-after: always;
          }
          table.report.container {
            page-break-after: always;
            break-before: always;
          }
        }
        </style>
        <body style="font-size: 14px">

          <table width='100%' id="tss" class="report-container" >
            <tr>
              <td width='20%' valign="top">
                      <img src="/statics/app-logo.jpeg" alt="" style="float: left; padding: 10px;width: 90px;">
                      <h3>PT ASTON SISTEM INDONESIA</h3>
                      Jl Imam Bonjol 28 Salatiga, 50714
                      <br>
                      +62 298326431
                      <br>
                      www.astonprinter.com
              </td>
            </tr>
            <tr>
              <td colspan="4" class="">
                <table width='100%' class="bdr_top">
                  <tr>
                    <td colspan="4" align="right">
                      <h4>
                        Salatiga, ${new Date(x.tglRequest).toLocaleString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </h4>
                    </td>
                  </tr>
                  <tr>
                    <td width="15%">Nomor</td><td>: ${x.nomorPricing}</td>
                  </tr>
                  <tr>
                    <td>Perihal</td><td>: Permohonan Kerjasama</td>
                  </tr>
                  <tr>
                    <td colspan="4">
                      <br>
                      Kepada
                      <br>
                      Yth. <b>${x.namaPIC || ''}
                      <br>${x.namaPartner}</b>
                      <br> di tempat
                      <br>
                      <br>
                      <p>PT. Aston Sistem Indonesia yang beralamatkan di Jl Imam Bonjol 28 Salatiga bermaksud memperkenalkan profil perusahaan sebagai dasar pertimbangan untuk menjadi Mitra kerjasama dengan lembaga yang Bapak/ Ibu pimpin.</p>
                      <p>PT. Aston Sistem Indonesia memiliki fokus bisnis sebagai berikut:</p>
                      <ol>
                       <li>Distributor bahan pakai toner dan tinta printer dengan merek AMAZiNK.</li>
                       <li>Managed print services pada lingkup terbatas.</li>
                       <li>Alat tulis kantor (ATK).</li>
                      </ol>
                      <p>PT. Aston Sistem Indonesia hadir sejak tahun 2007 untuk memberikan solusi dalam memilih printer dan konsumable yang tepat sesuai dengan kebutuhan konsumen dan memberikan layanan terbaik sehingga dapat meningkatkan efisiensi, efektivitas, dan produktifitas kerja dari penggunanya, dengan dukungan layanan purna jual yang optimal dan bergaransi penuh serta SDM yang profesional di bidangnya. </p>
                      <p>Hal-hal yang dapat dijadikan pertimbangan permohonan kerjasama terkait dengan kualitas produk dan layanan yang kami tawarkan antara lain:</p>
                      <ol>
                       <li>Produk tinta dan toner dengan merek Amazink memiliki kualitas yang setara dengan produk original serta garansi 100% (untuk printer).</li>
                       <li>Pelayanan purna jual yang optimal antara lain :</li>
                        <ol type="a">
                          <li>Pelaksanaan maintenance printer secara rutin 1 bulan sekali non-biaya.</li>
                          <li>Gratis Service Printer.</li>
                          <li>Pemberian report bulanan tentang kondisi printer kepada user.</li>
                        </ol>
                       <li>Merek Amazink terdaftar resmi pada Dirjen HAKI dengan nomer: IDM000287001.</li>
                       <li>Kelengkapan dokumen perusahaan serta perpajakan.</li>
                       <li>Memiliki pengalaman luas bekerjasama dengan berbagai institusi pemerintah maupun swasta.</li>
                      </ol>
                      <p>Demikian profil PT. Aston Sistem Indonesia ini kami sampaikan, atas perhatian dan kerjasamanya kami ucapkan terima kasih.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr style="page-break-before: always;">
              <td >
              <div></div>
                <p style="page-break-before: always;">Menindak lanjuti hasil pembicaraan sebelumnya, bersama ini kami sampaikan harga :</p>
              </td>
            </tr>
            <tr>
              <td rowspan="" colspan="4" class="">
                <table width='100%' id="table_product">
                <thead class="">
                  <tr>
                    <th>Nama Barang</th>
                    <th>Deskripsi Barang</th>
                    <th>Merk</th>
                    <th width='10%' style="text-align:right">QTY</th>
                    <th width='10%' style="text-align:right">Harga</th>
                    <th width='10%' style="text-align:right">Jumlah</th>
                  </tr>
                  </thead>
                  <tbody class="bdr_top">`
      let dtDet = ''
      detail.data.forEach((det, i) => {
        const gmbr = det.device === 'Y' && `<img src="../statics/${det.kodeProduk}.png" style="float: left; padding: 5px;width: 100px;">`
        dtDet += `<tr>
          <td>
            ${(i + 1).toString().padStart(3, ' ')}. ${det.namaProduk}
            ${gmbr || ''}
          </td>
          <td>${det.namaProduk}</td>
          <td>${det.namaMerk}</td>
          <td style="text-align:right">${new Intl.NumberFormat('en').format(Number(det.qty).toFixed(2))} ${JSON.parse(det.kemasan).kemasan || ''}</td>
          <td style="text-align:right">${new Intl.NumberFormat('en').format(Number(det.hargaJual).toFixed(2))}</td>
          <td style="text-align:right">${new Intl.NumberFormat('en').format(Number(det.hargaJual * det.qty).toFixed(2))}</td>
        </tr>`
      })
      let ttp = `</tbody>
                </table>
              </td>
            </tr>
            <tr>
              <td colspan="4">
                <table width='100%' >
                  <tr>
                    <td width='60%' valign="top">
                    </td>
                    <td align="right" valign="top">
                      <table width="100%" >
                        <td width='50%' align='right'><b>Total</b></td>
                        <td width='50%' align='right'><b>${new Intl.NumberFormat('en').format(Number(tHarga).toFixed(2))}</b></td>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td colspan="4">
                <div>Ketentuan :
                  <br>
                  ${x.note || ''}
                  <p>Demikian surat penawaran ini kami sampaikan, dan bila ada informasi lain yang mungkin masih dibutuhkan, silahkan menghubungi Representative kami :
                  
                  <p style="text-align:'center'"><table>
                    <tr>
                      <td>PIC</td><td>: ${x.namaSales || ''}</td>
                    </tr>
                    <tr>
                      <td>Mobile-Phone</td><td>: ${x.telp || ''}</td>
                    </tr>
                    <tr>
                      <td>E-Mail</td><td>: ${x.email || ''}</td>
                    </tr>
                  </table></p>

                  <br>Atas perhatian dan kerjasamanya kami ucapkan terimakasih.
                  </p>
                </div>
              </td>
            </tr>
            <tr>
              <td colspan="4" align='center'>
                <table width='90%' align='center'>
                  <tr>
                    <td >
                  </td>
                  <td width='33.3%' align='center'>
                  </td>
                  <td width='33.3%' align='center'>
                    Hormat Kami,<br/>
                    <b>PT Aston Sistem Indonesia</b>
                    <img src="../statics/photo/slammmmmet.png" style="width: 150px;"/>
                    <br/>
                    <b><u>Slamet Nuryanto</u></b>
                    <br/>
                    Manager Marketing
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        </body>
        </html>`
      html += dtDet + ttp
      if (typeof cordova !== 'undefined') {
        cordova.plugins.printer.print(html)
      } else {
        wd.document.open()
        wd.document.write(html)
        wd.document.close()
      }
    }
    const printW = async (x) => {
      let { data } = await getBankCab(x.cabID)
      let bankCabanga = data.map(s => {
        let ss = `<li>${s.namaBank}: ${s.rekening} a.n ${s.atasNama}</li>`
        return ss
      })
      let bankCabang = await bankCabanga.toString().replace(/,/g, '')
      let detail = await detPO(x)
      let cab = dt.cabAll.find(cb => cb.kodeCab === x.cabID)
      let tHarga = detail.data.reduce((a, b) => root.$dwn.jumlah([a, b.hargaJual * b.qty]), 0)
      let wd = window.open('', 'transPrint', 'resize = 1')
      let html = `<html><head>`
      let dtPrint = `
        <title>Transaksi Penjualan ${x.nomorPricing}</title>
          <style>
              #tss{
                  font-size: 12px;
                  font-family:Courier New;
              }
              #tss tr td{
                  font-size: 12px;
                  font-family:Courier New;
              }
              .bdr_btm{
                  border-bottom: 1px dashed #000;
                  font-size: 12px;
                  font-family:Courier New;
              }
              @media print{
                  #man {
                      visibility:hidden;
                  }
                  thead.report-header {
                    display: table-header-group;
                  }
                  table.report.container {
                    page-break-after: always;
                  }
              }
          </style>
          <body style="font-size: 11px">
          <table width='100%' id="tss" class="report-container" >
            <thead class="report-header"> 
              <tr>
                <td colspan="3" width='60%' class="bdr_btm" valign="top">
                    <table width="100%">
                        <tr>
                            <td>
                                <b>${cab.namaCabang.toUpperCase()}</b>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <b>${cab.alamatCabang}</b>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <b>${cab.telp}</b>
                            </td>
                        </tr>
                    </table>
                </td>
                <td class="bdr_btm" align='right'>
                    <table width="100%" >
                        <tr>
                            <td colspan="4">
                                <b>NOTA PESANAN</b>
                            </td>
                        </tr>
                        <tr>
                            <td width="35%">ID Pesanan</td>
                            <td>: ${x.nomorPricing}</td>
                        </tr>
                        <tr>
                            <td>Tanggal </td>
                            <td>: ${x.tglRequest}</td>
                        </tr>
                        <tr>
                            <td>Pembayaran </td>
                            <td>: Tempo</td>
                        </tr>
                    </table>
                </td>
            </tr>
            <tr>
                <td colspan="4" class="bdr_btm">
                    <table width='100%'>
                        <tr>
                            <td width='15%'>Nama Pelanggan</td>
                            <td width='35%'>: ${x.namaPartner}</td>
                            <td width='15%'></td>
                            <td></td>
                        </tr>
                        <tr>
                            <td>Alamat</td>
                            <td rowspan="2" valign="top">: ${x.alamat || ''}</td>
                            <td valign="top"></td>
                            <td rowspan="2" valign="top"></td>
                        </tr>
                        <tr>
                            <td>&nbsp;</td>
                            <td></td>
                        </tr>
                        <tr>
                            <td>No Telp</td>
                            <td>: ${x.tlp || ''}</td>
                            <td valign="top"></td>
                            <td></td>
                        </tr>
                    </table>
                </td>
              </tr>
            </thead>
              <tr>
                <td colspan="4" class="bdr_btm">
                    <table width='100%'>
                      <thead class="report-header">
                        <tr>
                            <td width='3%' class="bdr_btm">No</td>
                            <td class="bdr_btm">Deskripsi Barang</td>
                            <td width='10%' class="bdr_btm">Serial Number</td>
                            <td width='10%' class="bdr_btm" align='right'>QTY</td>
                            <td width='10%' class="bdr_btm" align='right'>Harga</td>
                            <td width='10%' class="bdr_btm" align='right'>Jumlah</td>
                        </tr>
                        </thead>`
      let dtDet = ''
      detail.data.forEach((det, i) => {
        dtDet += `<tr>
            <td>${i + 1}</td>
            <td>${det.namaBarang}</td>
            <td>${det.keterangan || ''}</td>
            <td align='right'>${new Intl.NumberFormat('en').format(Number(det.qty).toFixed(2))} ${det.kemasan.kemasan}</td>
            <td align='right'>${new Intl.NumberFormat('en').format(Number(det.hargaJual).toFixed(2))}</td>
            <td align='right'>${new Intl.NumberFormat('en').format(Number(det.hargaJual * det.qty).toFixed(2))}</td>
        </tr>`
      })
      let ttp = `</table>
                </td>
            </tr>
            <tr>
                <td colspan="4">
                    <table width='100%' >
                        <tr>
                            <td style='border : 1px dotted #000000; padding:10px' width='60%'>
                              Pembayaran dapat dilakukan melalui:
                              <ul>
                                ${bankCabang}
                              </ul>
                            </td>
                            <td align="right" valign="top">
                                <table width="100%" >
                                    <td width='40%' align='right'><b>Total</b></td>
                                    <td width='60%' align='right'><b>${new Intl.NumberFormat('en').format(Number(tHarga).toFixed(2))}</b></td>
                                        <tr>
                                            <td align='right'><b>Uang Muka</b></td>
                                            <td align='right'><b>0</b></td>
                                        </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
            <tr>
                <td colspan="4" align='center'>
                    <table width='90%' align='center'>
                        <tr>
                            <td width='33.3%' align='center'>
                                Diterima Oleh<br/>
                                <br/><br/><br/><br/>
                                ${x.namaPartner}
                            </td>
                            <td width='33.3%' align='center'>
                            </td>
                            <td width='33.3%' align='center'>
                                Di Buat Oleh<br/>
                                <br/><br/><br/><br/>
                                ${root.$store.state.auth.user.nama}
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>`
      html += dtPrint + dtDet + ttp + '</body></html>'
      if (typeof cordova !== 'undefined') {
        cordova.plugins.printer.print(html)
      } else {
        wd.document.open()
        wd.document.write(html)
        wd.document.close()
      }
    }
    const updetPO = (x) => {
      x.jmlHPP = x.hpp * x.qty
      editPriceDet(x)
        .then(({ data }) => {
          if (data.id > 0) {
            x.iddetPricing = data.id
          }
          root.$q.notify({ message: `${data.st}`, color: 'teal' })
        })
        .catch((err) => {
          root.$q.notify({ message: `${err.response.data.st}`, color: 'purple' })
        })
    }
    return { ...toRefs(dt),
      tmbDetPO,
      cetak,
      printA4,
      updetPO,
      updPR,
      dtCek,
      adQty,
      addPRa,
      onpil,
      ambil,
      ondel,
      getdetPR,
      onReset,
      getPR,
      partner,
      printW,
      totalPesanan,
      delPod,
      addetPO,
      gantiCab
    }
  }
}
</script>
