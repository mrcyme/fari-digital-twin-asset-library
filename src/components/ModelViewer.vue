<template>
  <div class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <button @click="closeModal" class="close-button">X</button>
      <div ref="rendererContainer" class="renderer-container"></div>
      <div v-if="loading" class="loading-indicator">Loading model...</div>
      <div v-if="error" class="error-message">{{ error }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const props = defineProps({
  assetUrl: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(['close']);

const rendererContainer = ref(null);
const loading = ref(true);
const error = ref(null);

let scene, camera, renderer, controls, animationFrameId;

const closeModal = () => {
  emit('close');
};

const initThree = () => {
  if (!rendererContainer.value) return;
  loading.value = true;
  error.value = null;

  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xeeeeee);

  // Camera
  const containerRect = rendererContainer.value.getBoundingClientRect();
  camera = new THREE.PerspectiveCamera(75, containerRect.width / containerRect.height, 0.1, 1000);
  camera.position.set(2, 2, 5); // Default camera position

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(containerRect.width, containerRect.height);
  renderer.setPixelRatio(window.devicePixelRatio);
  rendererContainer.value.appendChild(renderer.domElement);

  // Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.screenSpacePanning = false;
  controls.minDistance = 1;
  controls.maxDistance = 50;
  controls.maxPolarAngle = Math.PI / 2;

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(5, 10, 7.5);
  scene.add(directionalLight);

  // Load Model
  loadModel(props.assetUrl);

  // Animation loop
  animate();

  // Handle resize
  window.addEventListener('resize', onWindowResize);
};

const loadModel = (url) => {
  if (!url) {
    error.value = 'No asset URL provided.';
    loading.value = false;
    return;
  }

  // Clear previous model if any
  const previousModel = scene.getObjectByName('loaded_model');
  if (previousModel) {
    scene.remove(previousModel);
    // Dispose geometry and material if necessary for complex models
  }

  const loader = new GLTFLoader();
  loader.load(
    url,
    (gltf) => {
      const model = gltf.scene;
      model.name = 'loaded_model';

      // Correct for Z-up model orientation by rotating around the X-axis
      model.rotation.y = Math.PI/2;


      // Center and scale model (optional, but good for consistency)
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 5 / maxDim; // Scale to fit a 5-unit imaginary box
      model.scale.set(scale, scale, scale);
      model.position.sub(center.multiplyScalar(scale));

      scene.add(model);
      loading.value = false;
      if (controls) controls.target.copy(model.position); // Focus controls on the model
    },
    undefined, // onProgress callback (can be implemented if needed)
    (err) => {
      console.error('Error loading GLB model:', err);
      error.value = `Failed to load model from ${url}. Check console for details.`;
      loading.value = false;
    }
  );
};

const animate = () => {
  animationFrameId = requestAnimationFrame(animate);
  if (controls) controls.update();
  if (renderer) renderer.render(scene, camera);
};

const onWindowResize = () => {
  if (rendererContainer.value && camera && renderer) {
    const containerRect = rendererContainer.value.getBoundingClientRect();
    camera.aspect = containerRect.width / containerRect.height;
    camera.updateProjectionMatrix();
    renderer.setSize(containerRect.width, containerRect.height);
  }
};

watch(() => props.assetUrl, (newUrl) => {
  if (scene) { // Check if threejs scene is initialized
    loadModel(newUrl);
  }
});

onMounted(() => {
  // Delay initThree slightly to ensure DOM element is ready for getBoundingClientRect
  requestAnimationFrame(() => {
      initThree();
  });
});

onUnmounted(() => {
  window.removeEventListener('resize', onWindowResize);
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
  // Dispose Three.js objects to free up resources
  if (renderer) {
    renderer.dispose();
    if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
  }
  if (scene) {
    scene.traverse(object => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
  }
  if (controls) controls.dispose();
});

</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.75);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.3);
  width: 80vw;
  height: 80vh;
  max-width: 1000px;
  max-height: 700px;
  display: flex;
  flex-direction: column;
  position: relative; /* For absolute positioning of close button */
}

.close-button {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1010;
}

.close-button:hover {
  background: #d32f2f;
}

.renderer-container {
  flex-grow: 1;
  width: 100%;
  height: calc(100% - 40px); /* Adjust based on other elements in modal-content */
  overflow: hidden;
  border: 1px solid #ccc;
}

.loading-indicator, .error-message {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 10px 20px;
  background-color: rgba(0,0,0,0.8);
  color: white;
  border-radius: 5px;
  z-index: 1005;
}

.error-message {
  background-color: #f44336;
}
</style> 