<template>
  <q-card class="bg-white full-width shadow-3">
    <q-card-section class="bg-teal-13">
      <canvas :id="chartId.id"  width="400" height="400"></canvas>
    </q-card-section>
  </q-card>
</template>

<script>
import Chart from 'chart.js/auto'
import { onMounted, reactive, toRefs } from '@vue/composition-api'
export default {
  props: {
    chartId: {
      type: Object,
      default: function () {
        return {
          id: 'radar',
          judul: 'Radar Chart'
        }
      }
    },
    type: {
      type: String,
      default: 'radar'
    },
    labels: {
      type: Array,
      default: function () {
        return []
      }
    },
    datasets: {
      type: Array,
      default: function () {
        return []
      }
    },
    dataChart: {
      type: Object,
      default: function () {
        return {
          labels: [],
          datasets: []
        }
      }
    }
  },
  setup (props, { root }) {
    const dt = reactive({
      dtChart: {
        labels: props.labels,
        datasets: props.datasets
      },
      idChart: props.chartId
    })
    const createChart = () => {
      const ctx = document.getElementById(dt.idChart.id)
      const myChart = new Chart(ctx, {
        type: props.type,
        data: {
          labels: props.labels,
          datasets: props.datasets
        },
        options: {
          title: {
            display: true,
            text: dt.idChart.judul
          }
        }
      })
      return myChart
    }
    onMounted(() => {
      // createChart()
    })
    return {
      createChart,
      ...toRefs(dt)
    }
  },
  watch: {
    datasets: function () {
      this.createChart()
    }
  }
}
</script>
