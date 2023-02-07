<template>
  <div class="q-pb-md">
    <q-table
      class="dataPR"
      :data="dtPR"
      :columns="jdl"
      row-key="idPR"
      :filter="cari"
      :pagination.sync="hal"
      dense>
      <template v-slot:top>
        <div class="col-2 q-table__title">Data PR</div>
        <q-space />
        <q-input dense debounce="300" v-model="cari" placeholder="Search">
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
        <q-btn
          v-if="['MAN','purchase'].every(a=> a != $store.state.auth.user.userType)"
          flat round dense
          icon="add_circle"
          @click="adP = true"
          class="q-ml-md"
          color="accent"
        />
        <q-select
          v-if="['MAN','purchase'].some(a=> a== $store.state.auth.user.userType)"
          v-model="filt.kodeCab"
          :options="cabAll"
          :option-label="(item) => item && item.kodeCab + ' ' + item.namaCabang"
          option-value="kodeCab"
          emit-value
          map-options
          multiple
          style="min-width: 250px; max-width: 300px"
          label="Pilih cabang... "
          dense
          @input="getPR"
          lazy-rules>
          <template v-slot:option="scope">
            <q-item
              v-bind="scope.itemProps"
              v-on="scope.itemEvents"
              dense
            >
              <q-item-section>
                <q-item-label v-html="scope.opt.kodeCab+' '+scope.opt.namaCabang" ></q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-checkbox dense v-model="filt.kodeCab" :val="scope.opt.kodeCab" @input="getPR"/>
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
              <q-btn size="sm" color="warning" :icon="props.expand ? 'remove' : 'add'" @click="dtCek(props.row,props.expand),props.expand = !props.expand" />
            </template>
            <template v-else-if="col.name === 'ac'">
              <q-select
                v-model="props.row.ac"
                :options="['Y','N']"
                style="max-width: 300px"
                label="antar cabang..."
                dense
                @input="updPR(props.row,'Antar Cabang')"/>
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
            <template v-else-if="col.name === 'statusPR'">
              <template v-if="['MAN','purchase'].some(a=> a===$store.state.auth.user.userType)">
                <q-select
                  v-model="props.row.statusPR"
                  dense
                  options-dense
                  :options="['Release','Sebagian','Closed']"
                  @input="updPR(props.row,'Status')"/>
              </template>
              <template v-else>
                {{ col.value }}
              </template>
            </template>
            <!-- <template v-else-if="col.name === 'act'">
              <q-btn v-if="props.row.statusPR !== 'Closed'" icon-right="send" :color="props.row.statusPR==='Release' ? 'teal' : 'warning'" size="sm" @click="getdetPR(props.row)"></q-btn>
            </template> -->
            <template v-else>
              {{ col.value }}
            </template>
          </q-td>
        </q-tr>
        <q-tr v-show="props.expand" :props="props">
          <q-td colspan="100%">
            <template v-if="dtTrxPR.some(a=> a.nomorPR=== props.row.nomorPR)">
              <q-markup-table>
                <q-tr>
                  <q-th align="left">No</q-th>
                  <q-th align="left">Kode Produk</q-th>
                  <q-th align="left">Nama Produk</q-th>
                  <q-th>Qty Request</q-th>
                  <q-th>Terkirim</q-th>
                  <q-th>Act</q-th>
                </q-tr>
                <q-tr
                  v-for="(dt,i) in dtTrxPR.filter(a=> a.nomorPR === props.row.nomorPR)"
                  :key="dt.iddetTrans">
                  <q-td>{{ i+1 }}</q-td>
                  <q-td>{{ dt.kodeProduk }}</q-td>
                  <q-td>{{ dt.namaBarang }}</q-td>
                  <q-td align="right">{{ dt.qty }}</q-td>
                  <q-td align="right">{{ dt.kirim }}</q-td>
                  <q-td>
                    <q-icon name="send" color="teal" @click="ambil(dt,props.row)" />
                  </q-td>
                </q-tr>
              </q-markup-table>
            </template>
            <template v-else>
              <span style="font-style: italic; font-color: orange;">Belum ada pembelian untuk nomor PR {{ props.row.nomorPR }}</span>
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
          <div class="text-h6">Permintaan Pembelian Barang</div>
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
                <div class="col-4 q-table__title">Detail PR</div>
                <q-input filled v-model="pr.tglRequest" readonly>
                  <template v-slot:append>
                    <q-icon name="event" class="cursor-pointer">
                      <q-popup-proxy ref="qDateProxy" transition-show="scale" transition-hide="scale" v-if="['MAN','purchase'].some(a=> a== $store.state.auth.user.userType)">
                        <q-date v-model="pr.tglRequest" @input="() => $refs.qDateProxy.hide()" mask="YYYY-MM-DD" />
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
                <q-space/>
                <q-toggle
                  v-model="pr.ac"
                  color="teal"
                  keep-color
                  false-value="N"
                  true-value="Y"
                  @input="pr.cabLain=''"
                  checked-icon="check"
                  label="Antar Cabang"
                  unchecked-icon="clear"
                />
                <q-select
                  v-if="pr.ac==='Y'"
                  v-model="pr.cabLain"
                  :options="cabAll"
                  :option-label="(item) => item && item.kodeCab + ' ' + item.namaCabang"
                  option-value="kodeCab"
                  emit-value
                  map-options
                  style="min-width: 250px; max-width: 300px"
                  label="Partner"
                  class="q-ml-md"
                  dense
                  lazy-rules/>
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
                      <q-input v-model="props.row.newQty" dense autofocus counter @input="adQty(props.row)"/>
                    </q-popup-edit>
                  </q-td>
                  <q-td key="act"  :props="props">
                    <q-icon name="send" color="teal" @click="ambil(props.row)" />
                    <q-icon name="close" color="red" @click="ondel(props.row)" />
                  </q-td>
                </q-tr>
              </template>
            </q-table>
            <div align="right">
              <q-btn label="Submit" type="submit" color="primary"/>
              <q-btn label="Reset" type="reset" color="primary" flat class="q-ml-sm" />
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
              Detail <q-chip outline>Nomor PR :{{ pr.nomorPR }}</q-chip>
              <q-input filled v-model="pr.tglRequest" readonly/>
                <!-- <template v-slot:append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy v-if="['MAN','purchase'].some(a=> a===$store.state.auth.user.userType)" ref="qDateProxy" transition-show="scale" transition-hide="scale">
                      <q-date v-model="pr.tglRequest" @input="() => $refs.qDateProxy.hide()" mask="YYYY-MM-DD" />
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input> -->
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
                <q-td key="hargaSat" :props="props">
                  {{ props.row.hargaSat | duit }}
                  <q-popup-edit v-model="props.row.hargaSat">
                    <q-input v-model="props.row.hargaSat" dense autofocus counter  @change="onSave(props.row)"/>
                  </q-popup-edit>
                </q-td>
                <q-td key="act"  :props="props">
                  <template v-if="['MAN','purchase'].some(a=> a===$store.state.auth.user.userType)">
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
  </div>
</template>

<script>
import { dtPR, detPR, addPR, rekPR, upPR, cabang } from '../services/apiList'
import { reactive, toRefs } from '@vue/composition-api'
import produk from '../components/stok'
export default {
  components: {
    produk
  },
  setup (props, { root, emit }) {
    const dt = reactive({
      dtPR: [],
      jdl: [
        { name: 'nom', label: 'check', align: 'left' },
        { name: 'kodeCab', label: 'Kode Cab', field: row => row.kodeCab, align: 'left' },
        { name: 'namaCabang', label: 'Nama Cabang', field: row => row.namaCabang, align: 'left' },
        { name: 'nomorPR', label: 'Nomor PR', field: row => row.nomorPR, align: 'left' },
        { name: 'tglRequest', label: 'Tanggal Request', field: row => row.tglRequest, align: 'left' },
        { name: 'ac', label: 'Antar Cabang', field: row => row.ac, align: 'left' },
        { name: 'cabLain', label: 'Partner', field: row => row.cabLain, align: 'left' },
        { name: 'statusPR', label: 'Status', field: row => row.statusPR, align: 'left' },
        { name: 'act', label: 'Act' }
      ],
      detPR: [],
      jdld: [
        { name: 'kodeProduk', label: 'Kode Produk', field: row => row.kodeProduk, align: 'left' },
        { name: 'namaBarang', label: 'Nama Produk', field: row => row.namaBarang, align: 'left' },
        { name: 'qty', label: 'Qty Request', field: row => row.qty, jml: 'Y', align: 'right' },
        { name: 'hargaSat', label: 'harga @', field: row => row.hargaSat, jml: 'Y', align: 'right' },
        { name: 'act', label: 'Act' }
      ],
      dtTrxPR: [],
      adP: false,
      dPr: false,
      inRul: [ v => !!v || 'Isi data' ],
      pr: { tglRequest: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10), ac: 'N', cabLain: '' },
      category: [
        { label: 'Printer', value: '1' },
        { label: 'Tinta', value: '2' },
        { label: 'Laptop', value: '3' },
        { label: 'Komputer', value: '4' }
      ],
      selected: [],
      cari: '',
      filt: { kodeCab: [] },
      cabAll: [],
      hal: { rowsPerPage: 10 }
    })
    cabang().then(res => {
      dt.cabAll = res.data
    })
    const updPR = (x, y) => {
      root.$q.dialog({
        title: `Update PR`,
        message: `Update ${y} ?`,
        cancel: true,
        persistent: false
      }).onOk(() => {
        upPR(x)
          .then(res => {
            root.$q.notify({ message: `${res.data.st}`, color: 'teal' })
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
      if (!y) {
        dt.dtTrxPR.forEach((a, b, c) => {
          if (a.nomorPR === x.nomorPR.toString()) {
            c.splice(b)
          }
        })
        rekPR(x)
          .then(res => {
            dt.dtTrxPR.push(...res.data)
          })
          .catch(err => {
            console.log(err)
          })
      }
    }
    const getPR = () => {
      dtPR(dt.filt)
        .then(res => {
          dt.dtPR = res.data
        })
        .catch((err) => {
          console.log(err)
        })
    }
    const adQty = (x) => {
      x.qty = x.newQty
    }
    const onReset = () => {
      dt.pr = { tglRequest: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10) }
      dt.detPR = []
    }
    const addPRa = (x) => {
      if (dt.detPR.every(a => a.qty > 0)) {
        addPR({ hd: x, det: dt.detPR })
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
      detPR(x)
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
      let ax = [...x]
      dt.detPR = ax
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
    getPR()
    return { ...toRefs(dt), updPR, dtCek, adQty, addPRa, onpil, ambil, ondel, getdetPR, onReset, getPR }
  }/* ,
  data () {
    return {
      dtPR: [],
      jdl: [
        { name: 'nom', label: 'check', align: 'left' },
        { name: 'kodeCab', label: 'Kode Cab', field: row => row.kodeCab, align: 'left' },
        { name: 'namaCabang', label: 'Nama Cabang', field: row => row.namaCabang, align: 'left' },
        { name: 'nomorPR', label: 'Nomor PR', field: row => row.nomorPR, align: 'left' },
        { name: 'tglRequest', label: 'Tanggal Request', field: row => row.tglRequest, align: 'left' },
        { name: 'cabLain', label: 'Partner', field: row => row.cabLain, align: 'left' },
        { name: 'statusPR', label: 'Status', field: row => row.statusPR, align: 'left' },
        { name: 'act', label: 'Act' }
      ],
      detPR: [],
      jdld: [
        { name: 'kodeProduk', label: 'Kode Produk', field: row => row.kodeProduk, align: 'left' },
        { name: 'namaBarang', label: 'Nama Produk', field: row => row.namaBarang, align: 'left' },
        { name: 'qty', label: 'Qty Request', field: row => row.qty, jml: 'Y', align: 'right' },
        { name: 'hargaSat', label: 'harga @', field: row => row.hargaSat, jml: 'Y', align: 'right' },
        { name: 'act', label: 'Act' }
      ],
      dtTrxPR: [],
      adP: false,
      inRul: [ v => !!v || 'Isi data' ],
      pr: { tglRequest: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10), ac: 'N' },
      category: [
        { label: 'Printer', value: '1' },
        { label: 'Tinta', value: '2' },
        { label: 'Laptop', value: '3' },
        { label: 'Komputer', value: '4' }
      ],
      selected: [],
      cari: '',
      cabAll: []
    }
  },
  mounted () {
    this.getPR()
    cabang()
      .then(res => {
        this.cabAll = res.data
      })
  },
  methods: {
    updPR (x, y) {
      this.$q.dialog({
        title: `Update PR`,
        message: `Update ${y} ?`,
        cancel: true,
        persistent: false
      }).onOk(() => {
        upPR(x)
          .then(res => {
            this.$q.notify({ message: `${res.data.st}`, color: 'teal' })
          })
          .catch((err) => {
            this.$q.notify({ message: `${err.response.data.st}`, color: 'purple' })
          })
      }).onCancel(() => {
        // console.log('>>>> Cancel')
      }).onDismiss(() => {
        // console.log('I am triggered on both OK and Cancel')
      })
    },
    dtCek (x, y) {
      console.log(y)
      if (!y) {
        this.dtTrxPR.forEach((a, b, c) => {
          if (a.nomorPR === x.nomorPR.toString()) {
            c.splice(b)
          }
        })
        cekPR(x)
          .then(res => {
            this.dtTrxPR.push(...res.data)
            console.log(this.dtTrxPR)
          })
          .catch(err => {
            console.log(err)
          })
      }
    },
    getPR () {
      dtPR()
        .then(res => {
          this.dtPR = res.data
        })
        .catch((err) => {
          console.log(err)
        })
    },
    adQty (x) {
      x.qty = x.newQty
    },
    addPRa (x) {
      if (this.detPR.every(a => a.qty > 0)) {
        addPR({ hd: x, det: this.detPR })
          .then(res => {
            this.onReset()
            this.getPR()
            this.$q.notify({ message: `${res.data.st}`, color: 'teal' })
          })
          .catch((err) => {
            console.log(err)
            this.$q.notify({ message: `${err.response.data.st}`, color: 'purple' })
          })
      } else {
        this.$q.notify({ message: `isi detail dan qty dulu...`, color: 'purple' })
      }
    },
    getdetPR (x) {
      this.pr = x
      this.selected = [x]
      detPR(x)
        .then(res => {
          this.detPR = res.data
          let e = Object.assign({}, x)
          this.$emit('dtBrg', e)
        })
        .catch((err) => {
          console.log(err)
          this.$q.notify({ message: `${err.response.data.st}`, color: 'purple' })
        })
    },
    onReset () {
      this.pr = { tglRequest: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10) }
      this.detPR = []
    },
    onpil (x) {
      let ax = [...x]
      this.detPR = ax
    },
    ambil (x, y) {
      this.$emit('ambil', x, y)
      this.$q.notify({ message: `${x.namaBarang} terpilih...`, color: 'teal' })
    },
    ondel (item) {
      const index = this.detPR.indexOf(item)
      let cf = confirm(`Hapus ${item.kodeProduk} ?`)
      if (cf) {
        this.detPR.splice(index, 1)
        /* if (item.iddetPR) {
          api.delPRd(item)
            .then(res => this.$q.notify({ message: 'Data tersimpan', color: 'success' }))
            .catch(err => this.$q.notify({ message: 'Gagal simpan...' }))
        }
      }
    }
  } */
}
</script>
