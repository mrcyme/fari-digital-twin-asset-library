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
import { Vector3, MathUtils, DirectionalLight, AmbientLight } from 'three';
import { MapControls } from 'three/examples/jsm/controls/MapControls.js';
import Instance from '@giro3d/giro3d/core/Instance.js';
import Tiles3D from '@giro3d/giro3d/entities/Tiles3D.js';

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
let instance;

const placeCameraOnTop = (volume, instance) => {
    if (!instance) return;

    const center = volume.getCenter(new Vector3());
    const size = volume.getSize(new Vector3());

    const camera = instance.camera.camera3D;
    const top = volume.max.z;
    const fov = camera.fov;
    const aspect = camera.aspect;

    const hFov = MathUtils.degToRad(fov) / 2;
    const altitude = (Math.max(size.x / aspect, size.y) / Math.tan(hFov)) * 0.5;

    camera.position.set(center.x, center.y - 1, altitude + top);
    camera.lookAt(center);

    const controls = new MapControls(camera, instance.domElement);
    controls.target.copy(center);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;

    instance.view.setControls(controls);
    instance.notifyChange(camera);
}

onMounted(async () => {
  if (!viewerContainer.value) return;

  Instance.registerCRS(
    "EPSG:2154",
    "+proj=lcc +lat_0=46.5 +lon_0=3 +lat_1=49 +lat_2=44 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs",
  );

  try {
    instance = new Instance({
      target: viewerContainer.value,
      crs: "EPSG:2154",
      backgroundColor: 0xcccccc,
    });

    const sun = new DirectionalLight("#ffffff", 1.4);
    sun.position.set(1, 0, 1).normalize();
    instance.scene.add(sun);

    const ambientLight = new AmbientLight(0xffffff, 1);
    instance.scene.add(ambientLight);

    const tileset = new Tiles3D({
        url: props.tilesetUrl,
        id: 'tileset'
    });
    
    await instance.add(tileset);
    
    tileset.source.whenReady.then(() => {
        const volume = tileset.getBoundingBox();
        placeCameraOnTop(volume, instance);
    });

    instance.notifyChange();

  } catch (err) {
    console.error('Failed to load tileset:', err);
    error.value = 'Error initializing viewer. The tileset might be invalid or inaccessible.';
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