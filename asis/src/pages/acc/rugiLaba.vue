<template>
  <q-page padding><div class="row justify-between fit">
      <div :class="banding.length > 1 ? 'col-5' : 'col-grow'" v-for="a in banding" :key="a">
        <div class="text-right">
          <q-btn-group rounded class="text-right">
            <q-btn @click="addBan()" icon="add" color="teal" rounded dense outline>
              <q-tooltip class="bg-teal" :offset="[10, 10]">
                Add View
              </q-tooltip>
            </q-btn>
            <q-btn @click="hpsBan(a)" icon="close" color="orange" rounded dense outline>
              <q-tooltip class="bg-red" :offset="[10, 10]">
                Close View
              </q-tooltip>
            </q-btn>
          </q-btn-group>
        </div>
        <rugilaba/>
      </div>
    </div>
  </q-page>
</template>

<script>
import { reactive, toRefs } from '@vue/composition-api'
import rugilaba from '../../components/acc/rugilaba'
export default {
  // name: 'PageName',
  components: {
    rugilaba
  },
  setup(props, { root }) {
    const dt = reactive({
      banding: [Date.now()]
    })
    const addBan = () => {
      dt.banding.push(Date.now())
    }
    const hpsBan = (x) => {
      if (dt.banding.length > 1){
        let idx = dt.banding.indexOf(x)
        dt.banding.splice(idx, 1)
      }
    }
    return { ...toRefs(dt), addBan, hpsBan}
  }
}
</script>
