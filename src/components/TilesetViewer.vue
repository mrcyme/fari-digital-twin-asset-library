<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <button class="close-button" @click="$emit('close')">&times;</button>
      <div ref="viewerContainer" class="viewer-container"></div>
      <div v-if="loading" class="loading-indicator">Loading Tileset...</div>
      <div v-if="error" class="error-message">{{ error }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';

const props = defineProps({
  tilesetUrl: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(['close']);

const viewerContainer = ref(null);
const loading = ref(true);
const error = ref(null);
let viewer;

onMounted(async () => {
  if (!viewerContainer.value) return;

  try {
    viewer = new Cesium.Viewer(viewerContainer.value, {
      timeline: false,
      animation: false,
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      infoBox: false,
      terrainProvider: new Cesium.EllipsoidTerrainProvider(),
      imageryProvider: new Cesium.OpenStreetMapImageryProvider({
        url: 'https://a.tile.openstreetmap.org/'
      }),
    });

    const tileset = await Cesium.Cesium3DTileset.fromUrl(props.tilesetUrl);
    viewer.scene.primitives.add(tileset);
    
    const style = new Cesium.Cesium3DTileStyle({
      color: {
        conditions: [
          ["${TYPE} === 'ROOFSURFACE'", "color('red')"],
          ["true", "color('white')"],
        ],
      },
    });

    const removeListener = tileset.tileLoad.addEventListener((tile) => {
      const content = tile.content;
      if (content && content.featuresLength > 0) {
        const feature = content.getFeature(0);
        if (feature.hasProperty('TYPE')) {
          tileset.style = style;
          removeListener(); 
        }
      }
    });

    await viewer.zoomTo(tileset);

  } catch (err) {
    console.error('Failed to load tileset:', err);
    error.value = 'Error initializing viewer. The tileset might be invalid or inaccessible.';
  } finally {
    loading.value = false;
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
  background-color: white;
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
  background: rgba(0, 0, 0, 0.4);
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
.loading-indicator, .error-message {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  background-color: rgba(0,0,0,0.8);
  padding: 15px;
  border-radius: 5px;
}
.error-message {
  color: #ffcccc;
}
</style> 