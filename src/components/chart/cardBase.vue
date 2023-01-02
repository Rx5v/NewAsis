
<template>
  <q-card class="shadow-3 fit" style="min-width: 250px; overflow: auto;">
    <q-card-section :style="`border-bottom: 5px solid ${bgColor}`">
      <slot></slot>
    </q-card-section>
  </q-card>
</template>

<script>
export default {
  name: 'cardBase',
  props: {
    bgColor: {
      // default: '#2B2D3E'
      default: 'teal'
    }
  }
}
</script>
