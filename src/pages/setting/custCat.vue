<template>
  <q-page padding>
    <div class="row justify-center">
    <q-card>
      <q-card-section>
        <q-list>
          <q-item>
            <q-item-section>
              <q-item-label class="text-h6 text-blue-13">Data Kategori Pelanggan</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-item-label><q-btn
                round dense
                icon="add_circle"
                color="teal-13"
                @click="adP = true"
                class="q-ml-md"
              /></q-item-label>
            </q-item-section>
          </q-item>
          <q-separator spaced/>
          <q-item
            v-for="(a, i) in dtCustCat"
            :key="i">
            <q-item-section avatar>
              <q-avatar color="primary" text-color="white">
                {{ i + 1 }}
              </q-avatar>
            </q-item-section>

            <q-item-section>
              <q-item-label>{{ a.jenisCust }}</q-item-label>
            </q-item-section>
            <q-item-section>
              <q-item-label><q-checkbox v-model="a.point" false-value="N" true-value="Y" label="Point" @input="addJns(a)"/></q-item-label>
            </q-item-section>

            <q-item-section side>
              <q-icon @click="delKat(a)" name="close" color="red" />
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
    </q-card>
    <q-dialog
      v-model="adP">
      <q-card>
        <q-card-actions>
          <q-input v-model="custCat.jenisCust" label="Jenis Pelanggan" :rules="inRul"/>
          <q-toggle v-model="custCat.point" input-class="text-right" false-value="N"
              true-value="Y" label="Point Member"/>
          <q-space/>
          <q-btn
            outline
            label="Simpan"
            class="q-ml-md shadow-3 text-blue"
            v-close-popup
            @click="addJns(custCat)"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
    </div>
  </q-page>
</template>

<script>
import { onMounted, reactive, toRefs } from '@vue/composition-api'
import { addJenisCust, delJenisCust, jnsCust } from '../../services/apiList'
export default {
  // name: 'PageName',
  setup (props, { root }) {
    const dt = reactive({
      dtCustCat: [],
      custCat: {
        jenisCust: '',
        point: 'N'
      },
      adP: false,
      inRul: [v => !!v || 'Isi data']
    })
    onMounted(() => {
      jns()
    })
    const jns = () => {
      jnsCust()
        .then(({ data }) => {
          dt.dtCustCat = data
        })
    }
    const addJns = (x) => {
      addJenisCust(x)
        .then(({ data }) => {
          root.$q.notify({ message: data.st, color: 'teal-13' })
          jns()
        })
        .catch(err => {
          root.$q.notify({ message: err.response.data.st, color: 'red' })
        })
    }
    const delKat = (x) => {
      root.$q.dialog({
        title: 'Hapus Kategori Pelanggan',
        message: `Hapus <span class="text-orange">${x.jenisCust}</span>?`,
        cancel: true,
        html: true,
        persistent: false
      }).onOk(() => {
        if (x.idCusCat) {
          delJenisCust(x)
            .then(res => {
              root.$q.notify({ message: `${res.data.st}`, color: 'teal' })
              jns()
            })
            .catch((err) => {
              root.$q.notify({ message: `${err.response.data.st}`, color: 'purple' })
            })
        }
      }).onCancel(() => {
        // console.log('>>>> Cancel')
      }).onDismiss(() => {
        // console.log('I am triggered on both OK and Cancel')
      })
    }
    return {
      ...toRefs(dt),
      jns,
      addJns,
      delKat
    }
  }
}
</script>
