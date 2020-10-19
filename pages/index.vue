<template>
  <v-app>
    <dataset
      @selectData="geometry = $event"
      @translate="translateGeometry = $event"
    />
    <v-main>
      <v-container fluid fill-height>
        <v-flex align-self-start shrink
          ><viewer :geometry="geometry" :translate-geometry="translateGeometry"
        /></v-flex>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import Dataset from '@/components/Dataset.vue'
import Viewer from '@/components/Viewer.vue'

export default {
  components: { Dataset, Viewer },
  data: () => ({
    geometry: undefined,
    translateGeometry: undefined,
  }),
}
</script>
