<template>
  <div class="modal-overlay" @click.self="closeViewer">
    <div class="modal-content">
      <button class="close-button" @click="closeViewer">&times;</button>
      <div ref="viewerContainer" class="viewer-container"></div>
      <div v-if="loading" class="loading-indicator">Loading Point Cloud...</div>
      <div v-if="error" class="error-message">{{ error }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { Vector3, MathUtils } from 'three';
import { MapControls } from 'three/examples/jsm/controls/MapControls.js';
import Instance from '@giro3d/giro3d/core/Instance.js';
import PointCloud from '@giro3d/giro3d/entities/PointCloud.js';
import COPCSource from '@giro3d/giro3d/sources/COPCSource.js';
import { setLazPerfPath } from '@giro3d/giro3d/sources/las/config.js';

const props = defineProps({
  pointCloudUrl: {
    type: String,
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

const placeCameraOnTop = (volume, instance) => {
    if (!instance) return;

    const center = volume.getCenter(new Vector3());
    const size = volume.getSize(new Vector3());

    const camera = instance.view.camera;
    const top = volume.max.z;
    const fov = camera.fov;
    const aspect = camera.aspect;

    const hFov = MathUtils.degToRad(fov) / 2;
    const altitude = (Math.max(size.x / aspect, size.y) / Math.tan(hFov)) * 0.5;

    camera.position.set(center.x, center.y - 1, altitude + top);
    camera.lookAt(center);

    console.log('Camera position set to:', camera.position);
    console.log('Camera looking at (center):', center);

    const controls = new MapControls(camera, instance.domElement);
    controls.target.copy(center);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;

    instance.view.setControls(controls);
    instance.notifyChange(camera);
}

onMounted(async () => {
  if (!viewerContainer.value) return;

  // This path is crucial. The user must place the laz-perf WASM files
  // in the `public/assets/wasm` directory of their Vue project.
  setLazPerfPath(`${window.location.origin}/assets/wasm`);

  // A CRS must be registered for point clouds without CRS information.
  Instance.registerCRS(
    "unknown",
    "+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext +no_defs +type=crs",
  );

  try {
    const source = new COPCSource({ url: props.pointCloudUrl });
    await source.initialize();

    const metadata = await source.getMetadata();
    let crs = "unknown";
    if (metadata.crs) {
      crs = metadata.crs.srid ?? metadata.crs.name;
      console.log('crs', crs);
    }
    
    instance = new Instance({
      target: viewerContainer.value,
      crs: crs,
      backgroundColor: 0x333333,
    });

    instance.renderingOptions.enableEDL = true;
    
    const entity = new PointCloud({ source });
    await instance.add(entity);
    console.log('Point cloud entity created:', entity);

    const volume = entity.getBoundingBox();
    console.log('Point cloud bounding box (volume):', volume);
    placeCameraOnTop(volume, instance);

    instance.notifyChange();

  } catch (err) {
    console.error('Failed to load point cloud:', err);
    error.value = 'Error initializing viewer. The COPC file might be invalid or inaccessible.';
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