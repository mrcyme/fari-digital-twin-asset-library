<template>
  <div class="modal-overlay" @click.self="closeViewer">
    <div class="modal-content">
      <button class="close-button" @click="closeViewer">&times;</button>
      <div ref="viewerContainer" class="viewer-container"></div>
      <div v-if="loading" class="loading-indicator">Initializing Map Viewer...</div>
      <div v-if="error" class="error-message">{{ error }}</div>
    </div>
  </div>
</template>

<script setup>
import { OSM } from "ol/source";
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { MapControls } from 'three/examples/jsm/controls/MapControls.js';
import Instance from '@giro3d/giro3d/core/Instance.js';
import Map from '@giro3d/giro3d/entities/Map.js';
import ColorLayer from '@giro3d/giro3d/core/layer/ColorLayer.js';
import Extent from '@giro3d/giro3d/core/geographic/Extent.js';
import TiledImageSource from '@giro3d/giro3d/sources/TiledImageSource.js';
import WmsSource from '@giro3d/giro3d/sources/WmsSource.js';
import XYZ from 'ol/source/XYZ.js';

const props = defineProps({
  mapLayer: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['close']);

const viewerContainer = ref(null);
const loading = ref(true);
const error = ref(null);
let instance;

const closeViewer = () => {
  emit('close');
};

onMounted(async () => {
  if (!viewerContainer.value) return;

  try {
    console.log('Initializing map viewer with layer:', props.mapLayer);
    
    // Use EPSG:3857 (Web Mercator) for the map instance
    
    // Create a more focused extent for Brussels area
    instance = new Instance({
      target: viewerContainer.value,
      crs: "EPSG:3857",
    });

    const extent = new Extent('EPSG:4326',{ 
      west: 4.25,
      south: 50.75,
      north: 50.95,
      east: 4.45,
    }
    ).as(instance.referenceCrs);
    
    const map = new Map({ extent });
    instance.add(map);

    map.addLayer(
      new ColorLayer({
        name: "OSM",
        source: new TiledImageSource({ source: new OSM() }),
      }),
    );

    // Add the user-defined WMS layer on top
    const wmsSource = new WmsSource({
        url: props.mapLayer.url,
        layer: props.mapLayer.layer, // Changed to match the map CRS
        imageFormat: 'image/png',
        transparent: true,
        projection: 'EPSG:4326',
    });


    const colorLayer = new ColorLayer({
        name: props.mapLayer.layer,
        source: wmsSource,
        opacity: 0.8,
    });


    console.log('Adding layer to map:', colorLayer);
    map.addLayer(colorLayer);

    const controls = new MapControls(instance.view.camera, instance.domElement);
    controls.enableDamping = true;
    instance.view.setControls(controls);


    console.log('Notifying change and updating view');
    instance.notifyChange();
    instance.view.update();

  } catch (err) {
    console.error('Failed to initialize map viewer:', err);
    error.value = 'Error initializing map viewer. Please check layer details.';
  } finally {
    loading.value = false;
  }
});

onBeforeUnmount(() => {
  if (instance) {
    instance.dispose();
  }
});

</script>

<style scoped>
/* Reusing styles from PointCloudViewer */
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