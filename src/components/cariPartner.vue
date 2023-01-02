<template>
  <q-card>
    <q-card-section>
      <q-toggle
        :label="jns.label"
        color="pink"
        v-model="pilih"
        keep-color
        @input="cari=''"
        :disable="bebas"
      />
      <q-btn
        flat round dense
        icon="add_circle"
        color="warning"
        @click="adP = true"
      />
      <q-select
        filled
        v-model="cari"
        use-input
        hide-selected
        fill-input
        input-debounce="0"
        :options="dtCari"
        :option-label="(item) => item && item.namaPartner"
        option-value="kodePartner"
        @filter="filterFn"
        @change="emi(cari)"
        @new-value="baru"
        :hint="`alamat : ${cari ? cari.alamat :''}`"
      >
        <template v-slot:no-option>
          <q-item>
            <q-item-section class="text-grey">
              No results
            </q-item-section>
          </q-item>
        </template>
        <template v-slot:selected-item>
          <q-item>
            <q-item-section class="text-grey">
              {{ selected }}
            </q-item-section>
          </q-item>
        </template>
        <template v-slot:option="scope">
          <q-item
            v-bind="scope.itemProps"
            v-on="scope.itemEvents"
          >
            <q-item-section>
              <q-item-label>{{scope.opt.namaPartner}}</q-item-label>
              <q-item-label caption>{{scope.opt.tlp}}</q-item-label>
              <q-item-label caption>{{scope.opt.alamat}}</q-item-label>
            </q-item-section>
          </q-item>
        </template>
        <template v-slot:append>
          <q-icon
            v-if="cari !== null"
            class="cursor-pointer"
            name="clear"
            @click="cari = null"
          />
        </template>
      </q-select>
    </q-card-section>
    <q-dialog
      v-model="adP"
      >
      <q-card style="width: 700px; max-width: 80vw;">
        <q-card-section>
          <div class="text-h6">Add {{ pilih ? 'Vendor' :'Customer'}}</div>
        </q-card-section>
        <q-form
          @submit="addRkn(p)"
          @reset="onReset"
          class="q-gutter-md">
          <q-card-section>
            <q-select
              v-model="p.jnsPartner"
              :options="[jns]"
              :rules="inRul"
              map-options
              emit-value
              :label="`Jenis ${pil ? 'Vendor' :'Customer'} *`"/>
            <q-input
              filled
              v-model="p.namaPartner"
              :label="`Nama ${pil ? 'Vendor' :'Customer'} *`"
              lazy-rules
              :rules="inRul"
            />
            <q-checkbox
              v-model="p.cust"
              label="Pelanggan"
              false-value="N"
              true-value="Y"
              :rules="inRul"/>
            <q-checkbox
              v-model="p.ven"
              label="Supplier"
              false-value="N"
              true-value="Y"
              :rules="inRul"/>
            <q-input
              filled
              v-model="p.tlp"
              label="Telp *"
              lazy-rules
              :rules="inRul"
            />
            <q-input
              filled
              v-model="p.email"
              label="email"
              lazy-rules
            />
            <q-input
              filled
              v-model="p.alamat"
              label="Alamat *"
              type="textarea"
              lazy-rules
              :rules="inRul"
            />
            <q-input
              filled
              v-model="p.namaPIC"
              label="Nama PIC"
              lazy-rules
            />
            <q-checkbox v-model="cnPic" @input="kopi(p, 'namaPIC')" label="Sama dengan Nama Partner"/>
            <q-input
              filled
              v-model="p.telpPIC"
              label="Telp PIC"
              lazy-rules
              :prefix="(p.telpPIC.substring(0, 2) === '62' || p.telpPIC.substring(0, 1) === '+') ? '' : '62'"
              hint="No HP: 62-856-xxxx-xxxx "
            />
            <q-checkbox v-model="cpPic" @input="kopi(p, 'telpPIC')" label="Sama dengan telp"/>
            <q-select
              filled
              v-if="p.cust === 'Y'"
              v-model="p.catPartner"
              :options="category"
              :rules="inRul"
              label="Kategori Customers"
              emit-value
              option-label="jenisCust"
              option-value="idCustCat"
              map-options/>
          </q-card-section>
          <q-card-actions align="right" class="bg-white text-teal">
            <q-btn label="Batal" v-close-popup color="accent" flat />
            <q-btn label="Reset" type="reset" color="orange" flat class="q-ml-sm" />
            <q-btn v-if="p.kodePartner" label="Update" type="submit" color="primary" flat/>
            <q-btn v-if="!p.kodePartner" label="Submit" type="submit" color="primary" flat/>
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </q-card>
</template>
<script>
import { crPartner, jnsCust, dtPartner, addPartner } from '../services/apiList'
import { reactive, computed, onMounted, toRefs } from '@vue/composition-api'

export default {
  props: {
    pil: {
      type: Boolean,
      default: true
    },
    bebas: {
      type: Boolean,
      default: true
    }
  },
  setup (props, { root }) {
    const dt = reactive({
      cari: '',
      dtCari: [],
      pilih: props.pil,
      dtSearch: [],
      adP: false,
      inRul: [ v => !!v || 'Isi data' ],
      p: {
        namaPartner: '',
        idPartner: null,
        alamat: '',
        jnsPartner: 'Cust',
        catPartner: '',
        namaPIC: '',
        telpPIC: '',
        email: '',
        cust: props.pil ? 'N' : 'Y',
        ven: props.pil ? 'Y' : 'N'
      },
      category: [],
      selected: [],
      jnsP: [],
      cpPic: false,
      cnPic: false
    })
    const jns = computed(() => {
      return dt.pilih ? { label: 'Vendor', value: 'ven' } : { label: 'Customers', value: 'cust' }
    })
    const filtPartner = computed(() => {
      return dt.dtPartner.filter(x => x.jnsPartner === dt.p.jnsPartner)
    })
    onMounted(() => {
      getPartner()
      jnsCust()
        .then(res => {
          dt.category = res.data
        })
    })
    /* watch(() => dt.cari, (v) => {
      if (v) root.$emit('dtPartner', v)
    }) */
    const baru = (x) => {
      dt.adP = true
      onReset()
      dt.p.namaPartner = x
    }
    const getPartner = () => {
      dtPartner()
        .then(res => {
          dt.dtPartner = res.data
        })
        .catch((err) => {
          console.log(err)
        })
    }
    const addRkn = (x) => {
      x.telpPIC = x.telpPIC.replace(/^(\+628|628|08|8|6208)/, '628')
      /* if (x.telpPIC.substring(0, 2) !== '62' && x.telpPIC.substring(0, 1) !== '+') {
        x.telpPIC = '62' + x.telpPIC
      } */
      addPartner(x)
        .then(res => {
          getPartner()
          dt.cari = x.namaPartner
          dt.adP = false
          root.$q.notify({ message: `${res.data.st}`, color: 'teal' })
          onReset()
        })
        .catch((err) => {
          root.$q.notify({ message: `${err.response.data.st}`, color: 'purple' })
        })
    }
    const onReset = () => {
      dt.p = {
        namaPartner: '',
        idPartner: null,
        alamat: '',
        jnsPartner: 'Cust',
        catPartner: '',
        namaPIC: '',
        telpPIC: '',
        email: '',
        cust: 'Y',
        ven: 'N'
      }
    }
    const filterFn = async (val, update, abort) => {
      if (val.length < 2) {
        abort()
        return
      } else {
        let { data } = await crPartner(val, jns.value.value)
        dt.dtSearch = data
      }
      update(async () => {
        const needle = val.toLowerCase()
        dt.dtCari = dt.dtSearch.filter(v => (v.namaPartner.toLowerCase().indexOf(needle) > -1 || v.tlp.indexOf(needle) > -1))
      })
    }
    const kopi = (x, y) => {
      if (x) {
        switch (y) {
          case 'namaPIC':
            x[y] = x.namaPartner
            break
          default:
            x[y] = x.tlp.replace(/^0/, '')
        }
      }
    }
    return { ...toRefs(dt), jns, filtPartner, baru, getPartner, addRkn, onReset, filterFn, kopi }
  },
  watch: {
    cari: function (v) {
      if (v) this.$emit('dtPartner', { ...v })
    },
    pil: function (v) {
      if (v) {
        this.jnsP = [{ label: 'Vendor', value: 'Ven' }]
      } else {
        this.jnsP = [{ label: 'Customer', value: 'Cust' }]
      }
    }
  }
}
</script>
