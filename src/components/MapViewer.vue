<template>
  <div class="modal-overlay" @click.self="closeViewer">
    <div class="modal-content">
      <button class="close-button" @click="closeViewer">&times;</button>
      <div ref="cesiumContainer" class="viewer-container"></div>
      <div v-if="legendUrl" class="legend-container">
        <img :src="legendUrl" alt="Map Legend" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';

const props = defineProps({
  mapLayer: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['close']);

const cesiumContainer = ref(null);
let viewer;

const legendUrl = computed(() => {
  const layerInfo = props.mapLayer;
  if (layerInfo && layerInfo.url && layerInfo.layer) {
    const baseUrl = layerInfo.url.split('?')[0];
    console.log(`${baseUrl}?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetLegendGraphic&FORMAT=image/png&LAYER=${layerInfo.layer}`)
    return `${baseUrl}?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetLegendGraphic&FORMAT=image/png&LAYER=${layerInfo.layer}`;
  }
  return '';
});

const closeViewer = () => {
  emit('close');
};

onMounted(() => {
  if (cesiumContainer.value) {
    viewer = new Cesium.Viewer(cesiumContainer.value, {
      imageryProvider: new Cesium.OpenStreetMapImageryProvider({
        url: 'https://tile.openstreetmap.org/'
      }),
      sceneMode: Cesium.SceneMode.SCENE2D,
      baseLayerPicker: false,
      timeline: false,
      animation: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
    });

    if (props.mapLayer && props.mapLayer.url && props.mapLayer.layer) {
      viewer.imageryLayers.addImageryProvider(
        new Cesium.WebMapServiceImageryProvider({
          url: props.mapLayer.url,
          layers: props.mapLayer.layer,
          parameters: {
            service: 'WMS',
            transparent: true,
            format: 'image/png'
          },
        })
      );
    }

    viewer.camera.setView({
      destination: Cesium.Rectangle.fromDegrees(4.25, 50.75, 4.45, 50.95)
    });
  }
});

onBeforeUnmount(() => {
  if (viewer) {
    viewer.destroy();
  }
});

</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.modal-content {
  position: relative;
  background-color: #000;
  padding: 0;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  width: 90vw;
  height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.viewer-container {
  width: 100%;
  height: 100%;
  position: relative;
}
.close-button {
  position: absolute;
  top: 15px;
  right: 15px;
  font-size: 20px;
  font-weight: bold;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  z-index: 1010;
  color: #fff;
  width: 32px;
  height: 32px;
  line-height: 32px;
  text-align: center;
}
.legend-container {
  position: absolute;
  bottom: 20px;
  right: 20px;
  background-color: rgba(255, 255, 255, 0.8);
  padding: 10px;
  border-radius: 5px;
  z-index: 1005;
}
.legend-container img {
  max-width: 200px;
  max-height: 300px;
  display: block;
}
</style> 