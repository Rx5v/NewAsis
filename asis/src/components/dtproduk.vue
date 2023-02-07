<template>
  <div>
    <q-table
      class="dataTrx"
      :data="dtProduk"
      :columns="jdl"
      row-key="kodeProduk"
      selection="single"
      :selected.sync="selected"
      :filter="cari"
      :pagination.sync="halaman"
      dense>
      <template v-slot:top>
        <div class="col-2 q-table__title">Data Produk</div>
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
        <div class="q-gutter-sm">
          <q-toggle v-model="allCat" label="All Kategori" color="orange" @input="pilKat"/>
        </div>
        <q-space/>
        <q-input dense debounce="300" v-model="cari" placeholder="Search" class="q-ml-sm">
          <template v-slot:append>
            <q-icon name="search" />
            <q-btn
              flat round dense
              icon="file_download"
              @click="toDown()"
              class="q-ml-md"
              color="primary"
            />
          </template>
        </q-input>
        <q-btn
          v-if="['MAN','purchase','mitra', 'acc'].some(a=> a== $store.state.auth.user.userType)"
          flat round dense
          icon="add_circle"
          @click="adP = true"
          class="q-ml-md"
        />
        <!-- <q-select
          v-if="['MAN','purchase','acc'].some(a=> a== $store.state.auth.user.userType)"
          v-model="kodeCab"
          :options="$store.state.auth.user.userType ==='MAN' ? cabAll : cabAsi"
          :option-label="(item) => item && item.kodeCab + ' ' + item.namaCabang"
          option-value="kodeCab"
          emit-value
          map-options
          style="min-width: 250px; max-width: 300px"
          label="Pilih cabang... "
          :rules="inRul"
          dense
          @input="getProduk()"
          lazy-rules/> -->
      </template>
      <template
        v-slot:body-cell-hpp="props">
        <td align="right">
          <template v-if="['MAN','purchase','mitra', 'acc'].some(a=> a== $store.state.auth.user.userType)">
            {{ props.row.hpp | duit }}
          </template>
        </td>
      </template>
      <template v-slot:body-cell-hargaGrosir="props">
        <td align="right">
          <template v-if="['MAN','purchase','mitra', 'acc'].some(a=> a== $store.state.auth.user.userType)">
            <q-input
              v-model="props.row.hargaGrosir"
              type="number"
              input-class="text-right"
              label="Harga Grosir @"
              dense
              @change="setHrg(props.row,'hargaGrosir')"/>
          </template>
          <template v-else>
            {{ props.row.hargaGrosir | duit }}
          </template>
        </td>
      </template>
      <template v-slot:body-cell-hargaRetail="props">
        <td align="right">
           <template v-if="['MAN','purchase','mitra', 'acc'].some(a=> a== $store.state.auth.user.userType)">
             <q-input
              v-model="props.row.hargaRetail"
              type="number"
              input-class="text-right"
              label="Harga Retail @"
              dense
              @change="setHrg(props.row,'hargaRetail')"/>
           </template>
           <template v-else>
            {{ props.row.hargaRetail | duit }}
           </template>
          <!-- <q-popup-edit v-model="props.row.hargaRetail" v-if="['MAN','purchase'].some(a=> a== $store.state.auth.user.userType)">
            <q-input
              v-model="props.row.hargaRetail"
              type="number"
              input-class="text-right"
              label="Harga Retail @"
              dense
              autofocus
              @change="setHrg(props.row,'hargaRetail')"/>
          </q-popup-edit> -->
        </td>
      </template>
      <template v-slot:body-cell-pointMember="props">
        <td align="right">
           <template v-if="['MAN','purchase','mitra', 'acc'].some(a=> a== $store.state.auth.user.userType)">
             <q-input
              v-model="props.row.pointMember"
              type="number"
              input-class="text-right"
              label="Point Member"
              dense
              @change="addProduk(props.row)"/>
           </template>
           <template v-else>
            {{ props.row.pointMember | duit }}
           </template>
        </td>
      </template>
      <template v-slot:body-cell-cashBack="props">
        <td align="right">
           <template v-if="['MAN','purchase','mitra', 'acc'].some(a=> a== $store.state.auth.user.userType)">
             <q-input
              v-model="props.row.cashBack"
              type="number"
              input-class="text-right"
              label="Cash Back"
              dense
              @change="addProduk(props.row)"/>
           </template>
           <template v-else>
            {{ props.row.cashBack | duit }}
           </template>
        </td>
      </template>
      <template v-slot:body-cell-aktif="props">
        <td auto-width align="right">
          <q-toggle
            v-model="props.row.aktif"
            false-value="N"
            true-value="Y"
            label="Aktif"
            @input="addProduk(props.row)"/>
        </td>
      </template>
    </q-table>
     <q-dialog
      v-model="adP"
      >
      <q-card style="width: 800px; max-width: 80vw;" class="shadow-4">
        <q-card-section>
          <div class="text-h6 text-cyan-6">Add Produk</div>
        </q-card-section>
        <q-separator color="cyan-8"/>
        <q-card-section>
          <q-form
            @submit="addProduk(p)"
            @reset="onReset"
            class="q-gutter-sm">
            <div class="row justify-between">
              <div class="col-12 col-md-5">
                <q-input
                  filled
                  v-model="p.sku"
                  label="SKU *"
                  lazy-rules
                  :rules="inRul"
                />
                <q-input
                  filled
                  v-model="p.namaProduk"
                  label="Nama Produk *"
                  lazy-rules
                  :rules="inRul"
                />
                <q-select
                  filled
                  use-input
                  v-model="p.kodeMerk"
                  label="Merk *"
                  :options="optionsMerk"
                  option-label="namaMerk"
                  option-value="kodeMerk"
                  options-dense
                  @filter="filterMerk"
                  class="q-mt-sm"
                  emit-value  map-options
                  lazy-rules
                  :rules="inRul"
                />
                <q-select
                  use-input
                  filled
                  v-model="p.kodeCat"
                  options-dense
                  :options="options"
                  :option-label="(item) => item && item.kodeCat + ' ' + item.produkCategory"
                  option-value="kodeCat"
                  @filter="filterFn"
                  class="q-mt-sm"
                  label="Kategori" emit-value  map-options/>
                <q-input
                  filled
                  v-model="p.satuan"
                  label="Satuan *"
                  lazy-rules
                  class="q-mt-sm"
                  :rules="inRul"
                />
                <q-list bordered dense>
                  <q-item-label header class="text-teal-9">Konversi Kemasan</q-item-label>
                  <q-separator />
                  <q-item
                  v-for="(a, i) in p.konversi" :key="i">
                    <q-item-section avatar>
                      <q-avatar color="primary" text-color="white">
                        {{ a.isi }}
                        <q-popup-edit v-model="a.isi" content-class="bg-accent text-white">
                          <q-input dark color="white" v-model="a.isi" dense autofocus counter type="number">
                            <template v-slot:append>
                              <q-icon name="edit" />
                            </template>
                          </q-input>
                        </q-popup-edit>
                      </q-avatar>
                    </q-item-section>
                    <q-item-section>
                      <q-item-label class="text-teal-5">{{ a.kemasan }}
                        <q-popup-edit v-model="a.kemasan" content-class="bg-accent text-white">
                          <q-input dark color="white" v-model="a.kemasan" dense autofocus counter>
                            <template v-slot:append>
                              <q-icon name="edit" />
                            </template>
                          </q-input>
                        </q-popup-edit>
                      </q-item-label>
                      <q-item-label caption lines="1">Isi {{ a.isi }} {{ p.satuan }} / {{ a.kemasan }}</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-icon name="close" color="red" @click="p.konversi.splice(i, 1)"/>
                    </q-item-section>
                  </q-item>
                  <q-btn label="tambah" icon="add_circle" outline color="teal-5" @click="p.konversi.push({ isi: 1, kemasan: 'Box'})"/>
                </q-list>
                <q-img
                  v-if="p.kodeProduk"
                  :src="`../statics/${p.kodeProduk}.png`"/>
              </div>
              <div class="col-12 col-md-5">
                <!-- <q-input
                  filled
                  v-model="p.hargaGrosir"
                  type="number"
                  label="Harga Grosir *"
                  lazy-rules
                  :rules="inRul"
                />
                <q-input
                  filled
                  v-model="p.hargaRetail"
                  type="number"
                  label="Harga Retail *"
                  lazy-rules
                  :rules="inRul"
                /> -->
                <q-input
                  v-if="['MAN','purchase', 'acc'].some(a=> a== $store.state.auth.user.userType)"
                  v-model="p.pointMember"
                  type="number"
                  input-class="text-right"
                  label="Point Member"
                  dense/>
                <q-input
                  v-if="['MAN','purchase', 'acc'].some(a=> a== $store.state.auth.user.userType)"
                  v-model="p.cashBack"
                  type="number"
                  input-class="text-right"
                  label="Cash Back"
                  dense/>
                <!-- <q-select
                  v-if="['MAN','purchase', 'acc'].some(a=> a== $store.state.auth.user.userType)"
                  v-model="p.kodeCab"
                  :options="cabAll"
                  :option-label="(item) => item && item.kodeCab + ' ' + item.namaCabang"
                  option-value="kodeCab"
                  options-dense
                  emit-value
                  map-options
                  style="min-width: 250px; max-width: 300px"
                  label="Pilih cabang... "
                  :rules="inRul"
                  dense
                  lazy-rules/> -->
                <q-select
                  v-model="p.shareToGrup"
                  :options="grupComp"
                  option-label="value"
                  option-value="text"
                  options-dense
                  emit-value
                  multiple
                  style="min-width: 250px; max-width: 300px"
                  label="Share ke Grup "
                  :rules="inRul"
                  dense
                  lazy-rules/>
                <q-select
                  v-if="p.kodeCat === '17'"
                  v-model="p.jnsDevice"
                  :options="jnsDevice"
                  :option-label="(item) => item && item.namaJenis"
                  option-value="kodeJenis"
                  options-dense
                  emit-value
                  map-options
                  style="min-width: 250px; max-width: 300px"
                  label="Jenis Device... "
                  :rules="inRul"
                  dense
                  lazy-rules/>
                <q-toggle
                  v-model="p.aktif"
                  true-value="Y"
                  false-value="N"
                  :rules="inRul"
                  label="Aktif"/>
                <q-toggle
                  v-model="p.publish"
                  true-value="Y"
                  false-value="N"
                  :rules="inRul"
                  label="Publish ke Website"/>
                <q-input
                  filled
                  v-model="p.dimensi"
                  label="Dimensi (p,l,t) cm"
                  lazy-rules
                  class="q-mt-sm"
                  :rules="inRul"
                />
                <q-input
                  filled
                  v-model="p.berat"
                  label="Berat (dalam KG) *"
                  lazy-rules
                  class="q-mt-sm"
                  :rules="inRul"
                />
                <q-form
                  v-if="p.idProduk"
                  @submit="potoBarang(pt)"
                  >
                  <q-card-section>
                    <div class="text-h6 text-orange-9">Upload photo produk</div>
                    <q-separator />
                    <q-input :value="p.kodeProduk" label="Kode Produk" readonly/>
                    <q-file outlined v-model="pt.file" label="Pilih photo" counter accept=".jpg, image/*">
                      <template v-slot:prepend>
                        <q-icon name="attach_file" />
                      </template>
                    </q-file>
                  </q-card-section>
                  <q-card-actions>
                    <q-space/>
                    <q-btn type="submit" color="teal" label="Upload" class="shadow-5" outline rounded/>
                  </q-card-actions>
                </q-form>
              </div>
            </div>
            <span class="text-overline text-orange"><u>Deskripsi Produk</u></span>
                <q-editor
                  v-model="p.deskripsi"
                  :dense="$q.screen.lt.md"
                  :rules="inRul"
                  :toolbar="[
                    [
                      {
                        label: $q.lang.editor.align,
                        icon: $q.iconSet.editor.align,
                        fixedLabel: true,
                        list: 'only-icons',
                        options: ['left', 'center', 'right', 'justify']
                      },
                      {
                        label: $q.lang.editor.align,
                        icon: $q.iconSet.editor.align,
                        fixedLabel: true,
                        options: ['left', 'center', 'right', 'justify']
                      }
                    ],
                    ['bold', 'italic', 'strike', 'underline', 'subscript', 'superscript'],
                    ['token', 'hr', 'link', 'custom_btn'],
                    ['print', 'fullscreen'],
                    [
                      {
                        label: $q.lang.editor.formatting,
                        icon: $q.iconSet.editor.formatting,
                        list: 'no-icons',
                        options: [
                          'p',
                          'h1',
                          'h2',
                          'h3',
                          'h4',
                          'h5',
                          'h6',
                          'code'
                        ]
                      },
                      {
                        label: $q.lang.editor.fontSize,
                        icon: $q.iconSet.editor.fontSize,
                        fixedLabel: true,
                        fixedIcon: true,
                        list: 'no-icons',
                        options: [
                          'size-1',
                          'size-2',
                          'size-3',
                          'size-4',
                          'size-5',
                          'size-6',
                          'size-7'
                        ]
                      },
                      {
                        label: $q.lang.editor.defaultFont,
                        icon: $q.iconSet.editor.font,
                        fixedIcon: true,
                        list: 'no-icons',
                        options: [
                          'default_font',
                          'arial',
                          'arial_black',
                          'comic_sans',
                          'courier_new',
                          'impact',
                          'lucida_grande',
                          'times_new_roman',
                          'verdana'
                        ]
                      },
                      'removeFormat'
                    ],
                    ['quote', 'unordered', 'ordered', 'outdent', 'indent'],
                    ['viewsource']
                  ]"
                  :fonts="{
                    arial: 'Arial',
                    arial_black: 'Arial Black',
                    comic_sans: 'Comic Sans MS',
                    courier_new: 'Courier New',
                    impact: 'Impact',
                    lucida_grande: 'Lucida Grande',
                    times_new_roman: 'Times New Roman',
                    verdana: 'Verdana'
                  }"
                />
            <div class="text-right">
              <q-btn label="Reset" type="reset" color="warning" class="q-ml-sm shadow-4" outline rounded/>
              <q-btn label="Simpan" type="submit" color="primary" class="q-ml-sm shadow-4" outline rounded/>
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import { reactive, toRefs, watch } from '@vue/composition-api'
import { getProdukCat, getMerk, dtProduk, addProduk, uphrg, dtCab, getJnsService } from '../services/apiList'
export default {
  // name: 'PageName',
  setup (props, { root }) {
    const dt = reactive({
      dtBarang: [],
      jdl: [
        { name: 'kodeProduk', label: 'Kode', field: row => row.kodeProduk, sortable: true, align: 'left' },
        { name: 'produkCategory', label: 'Kategori', field: row => row.produkCategory, sortable: true, align: 'left' },
        { name: 'namaMerk', label: 'Nama Merk', field: row => row.namaMerk, sortable: true, align: 'left' },
        { name: 'namaProduk', label: 'Nama Produk', field: row => row.namaProduk, sortable: true, align: 'left' },
        { name: 'sku', label: 'SKU', field: row => row.sku, sortable: true, align: 'left' },
        { name: 'shareToGrup', label: 'Share to', field: row => row.shareToGrup, sortable: true, align: 'left' },
        /* { name: 'deskripsi', label: 'Deskripsi', field: row => row.deskripsi, sortable: true, align: 'left' }, */
        { name: 'hpp', label: 'HPP', sortable: true, field: row => row.hpp, jml: 'Y', align: 'right' },
        { name: 'hargaGrosir', label: 'Harga Grosir', sortable: true, field: row => row.hargaGrosir, jml: 'Y', align: 'right' },
        { name: 'hargaRetail', label: 'Harga Retail', sortable: true, field: row => row.hargaRetail, jml: 'Y', align: 'right' },
        /* { name: 'pointMember', label: 'Point Member', sortable: true, field: row => row.pointMember, jml: 'Y', align: 'right' },
        { name: 'cashBack', label: 'Cash Back', sortable: true, field: row => row.cashBack, jml: 'Y', align: 'right' }, */

        { name: 'publish', label: 'Publish', field: row => row.publish, sortable: true, align: 'right' },
        { name: 'aktif', label: 'Aktif', field: row => row.aktif, sortable: true, align: 'right' }
      ],
      adP: false,
      allCat: true,
      inRul: [ v => !!v || 'Isi data' ],
      p: { product_name: '', catID: '', product_description: '', pointMember: 0, cashBack: 0, satuan: 'Pcs', aktif: 'Y', jnsDevice: '', konversi: [ { isi: 1, kemasan: 'Pcs' } ], shareToGrup: [], publish: 'N', dimensi: '', berat: 1 },
      produkCat: [],
      options: [],
      merk: [],
      optionsMerk: [],
      optionsKat: [],
      selected: [],
      cari: '',
      cabAll: [],
      filt: { kodeCat: [] },
      kodeCab: root.$store.state.auth.setCabang,
      milik: ['ASI', 'MITRA'],
      halaman: { rowsPerPage: 10 },
      pt: { file: null, kodeProduk: '' },
      jnsDevice: [],
      grupComp: [
        { text: 'ASI', value: 'ASI' },
        { text: 'AMZ', value: 'AMAZINK' },
        { text: 'PTX', value: 'PRINTEX' },
        { text: 'PTF', value: 'PRINTFACTORY' }
      ],
      compCode: root.$store.state.auth.user.compCode
    })
    const getProduk = () => {
      dt.dtBarang = []
      dtProduk({ kodeCab: dt.kodeCab, compCode: dt.compCode })
        .then(res => {
          dt.dtBarang = res.data/* .map(s => {
            s.shareToGrup = s.shareToGrup ? JSON.parse(s.shareToGrup) : ''
            return s
          }) */
        })
        .catch((err) => {
          console.log(err)
        })
    }
    watch(() => root.$store.state.auth.setCabang, (val) => {
      dt.kodeCab = val
      if (dt.cabAll.length) {
        dt.compCode = dt.cabAll.find(a => a.kodeCab === val).compCode
      }
      getProduk()
    })
    return { ...toRefs(dt), getProduk }
  },
  computed: {
    dtProduk () {
      return this.dtBarang.filter(a => this.filt.kodeCat.some(s => a.kodeCat === s))
    },
    cabAsi () {
      const pegang = this.$store.state.auth.user.cabGrup
      return this.cabAll.filter(a => pegang.some(s => s === a.kodeCab))
    }
  },
  watch: {
    selected: function (v) {
      if (v.length > 0) {
        this.adP = true
        this.p = v[0]
      }
    }
  },
  mounted () {
    dtCab()
      .then(({ data }) => {
        const pegang = this.$store.state.auth.user.cabGrup
        this.cabAll = data.filter(a => pegang.some(s => s === a.kodeCab))
      })
    this.getProduk()
    getJnsService()
      .then(({ data }) => {
        this.jnsDevice = data
      })
    getProdukCat()
      .then(res => {
        this.produkCat = res.data
        this.filt.kodeCat = this.produkCat.map(a => a.kodeCat)
      })
    getMerk()
      .then(res => { this.merk = res.data })
  },
  methods: {
    pilKat () {
      this.filt.kodeCat = this.allCat ? this.produkCat.map(a => a.kodeCat) : []
    },
    setHrg (x, y) {
      x.jns = y
      x.kodeCab = this.kodeCab
      if (x.hargaGrosir >= x.hpp || x.hargaRetail >= x.hpp || ['MAN', 'purchase', 'mitra', 'acc'].some(a => a === this.$store.state.auth.user.userType)) {
        uphrg(x)
          .then(res => {
            this.$q.notify({ message: `${res.data.st}`, color: 'teal' })
          })
          .catch((err) => {
            console.log(err)
            this.$q.notify({ message: `${err.response.data.st}`, color: 'purple' })
          })
      } else {
        this.$q.notify({ message: `harga lebih rendah dari ${x.hpp}`, color: 'purple' })
      }
    },
    addProduk (x) {
      if (x.kodeCab === '') {
        x.kodeCab = ['MAN', 'acc', 'purchase'].some(a => a === this.$store.state.auth.user.userType) ? this.kodeCab : this.$store.state.auth.user.kodeCab
      }
      x.konversi = JSON.stringify(x.konversi)
      x.shareToGrup = JSON.stringify(x.shareToGrup)
      addProduk(x)
        .then(res => {
          this.$q.notify({ message: `${res.data.st}`, color: 'teal' })
          this.onReset()
          this.getProduk()
        })
        .catch((err) => {
          console.log(err)
          this.$q.notify({ message: `${err.response.data.st}`, color: 'purple' })
        })
    },
    onReset () {
      this.p = { pointMember: 0, cashBack: 0, satuan: 'Pcs', aktif: 'Y', jnsDevice: '', konversi: [ { isi: 1, kemasan: 'Pcs' } ], shareToGrup: [this.$store.state.auth.user.compCode], publish: 'N', dimensi: '', berat: 1 }
    },
    filterFn (val, update) {
      if (val === '') {
        update(() => {
          this.options = this.produkCat
        })
        return
      }

      update(() => {
        const needle = val.toLowerCase()
        this.options = this.produkCat.filter(v => (v.produkCategory.toLowerCase().indexOf(needle) > -1))
      })
    },
    filterMerk (val, update) {
      if (val === '') {
        update(() => {
          this.optionsMerk = this.merk
        })
        return
      }

      update(() => {
        const needle = val.toLowerCase()
        this.optionsMerk = this.merk.filter(v => (v.namaMerk.toLowerCase().indexOf(needle) > -1))
      })
    },
    filterKat (val, update) {
      if (val === '') {
        update(() => {
          this.optionsKat = this.merk
        })
        return
      }

      update(() => {
        const needle = val.toLowerCase()
        this.optionsKat = this.merk.filter(v => (v.namaMerk.toLowerCase().indexOf(needle) > -1))
      })
    },
    toDown () {
      let x = {
        judul: `Data Produk ${this.kodeCab} `,
        dt: this.dtProduk,
        hdr: this.jdl,
        naFile: `dataProduk${this.kodeCab}`
      }
      this.$dwn.toExcel(x)
    },
    potoBarang (x) {
      x.kodeProduk = this.p.kodeProduk
      this.uploadAsli(x)
    },
    uploadAsli (x) {
      const formData = new FormData()
      formData.append('Produk', x.file)
      formData.append('kodeProduk', x.kodeProduk)
      this.$axios.post('/photoProduk', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
        .then(({ data }) => {
          this.$q.notify({ message: data.st, color: 'teal' })
          this.pt = { file: null, kodeProduk: '' }
        // dataLegal()
        })
        .catch(err => {
          this.$q.notify({ message: err.response.data.st, type: 'warning' })
        })
    }

  }
}
</script>
