<template>
  <card-base>
    <apexchart :type="type" height="350px" :options="chartOptions" :series="series"/>
  </card-base>
</template>

<script>
import { onMounted, reactive, toRefs } from '@vue/composition-api'
import CardBase from './cardBase'
export default {
  name: 'ApexRadar',
  components: {
    CardBase
  },
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
      default: 'donut'
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
    title: {
      type: Object,
      default: function () {
        return {
          text: 'Report',
          align: 'left'
        }
      }
    }
  },
  setup (props, { root }) {
    const dt = reactive({
      series: props.datasets,
      chartOptions: {
        labels: props.labels,
        title: props.title,
        yaxis: {
          show: true
        },
        dataLabels: {
          enabled: true
        },
        tooltip: {
          y: {
            formatter: function (value, { series, seriesIndex, dataPointIndex, w }) {
              return value.toLocaleString()
            }
          }
        },
        legend: {
          position: 'bottom'
        }
      }
    })
    const createChart = () => {
      dt.series = props.datasets
      if (!process.env.SERVER) {
        window.dispatchEvent(new Event('resize'))
      }
    }
    onMounted(() => {
      createChart()
    })
    return { ...toRefs(dt), createChart }
  },
  watch: {
    datasets: function () {
      this.createChart()
    }
  }
}
</script>
