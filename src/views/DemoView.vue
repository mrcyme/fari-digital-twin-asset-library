<template>
  <div class="cesium-wrapper">
    <div class="cesium-container" ref="cesiumContainer"></div>
    <div class="sidebar">
      <h3>Layers</h3>
      <div class="layer-control">
        <input type="checkbox" id="baseLayer" v-model="showBaseLayer" @change="toggleBaseLayer" />
        <label for="baseLayer">Base Map Layer</label>
      </div>
      <div v-for="ts in tilesets" :key="ts.id" class="layer-control">
        <input type="checkbox" :id="ts.id" v-model="ts.show" @change="toggleTilesetVisibility(ts)" />
        <label :for="ts.id">{{ ts.name }}</label>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import * as Cesium from 'cesium';

const cesiumContainer = ref(null);
const showBaseLayer = ref(true);
let viewer;
let baseLayer;

const tilesets = ref([
  {
    id: 'buildings',
    name: 'Building Tileset',
    url: 'https://digitaltwin.s3.gra.io.cloud.ovh.net/tileset_manager/2025-06-18_20-47-13/tileset.json',
    show: true,
    instance: null,
    style: new Cesium.Cesium3DTileStyle({
      color: {
        conditions: [
          ["${TYPE} === 'ROOFSURFACE'", "color('red')"],
          ["true", "color('white')"],
        ],
      },
    }),
  },
  {
    id: 'trees',
    name: 'Tree Tileset',
    url: 'https://digitaltwin.s3.gra.io.cloud.ovh.net/tileset_manager/2025-06-20_09-32-51/tiles/tileset.json',
    show: true,
    instance: null,
    style: null,
  },
  {
    id: 'evchargers',
    name: 'EV Charger Tileset',
    url: 'https://digitaltwin.s3.gra.io.cloud.ovh.net/tileset_manager/2025-06-19_14-19-30/tiles/tileset.json',
    show: true,
    instance: null,
    style: null,
  },
  {
    id: 'lampposts',
    name: 'Lamppost Tileset',
    url: 'https://digitaltwin.s3.gra.io.cloud.ovh.net/tileset_manager/2025-06-20_09-25-48/tiles/tileset.json',
    show: true,
    instance: null,
    style: null,
  },
]);

onMounted(async () => {
  if (cesiumContainer.value) {
    viewer = new Cesium.Viewer(cesiumContainer.value, {
      terrain: Cesium.Terrain.fromWorldTerrain(),
      animation: false,
      baseLayerPicker: false,
      fullscreenButton: true,
      geocoder: true,
      homeButton: false,
      infoBox: true,
      sceneModePicker: false,
      selectionIndicator: true,
      timeline: false,
      navigationHelpButton: false,
    });

    baseLayer = new Cesium.ImageryLayer(new Cesium.OpenStreetMapImageryProvider({
        url : 'https://a.tile.openstreetmap.org/'
    }));
    viewer.imageryLayers.add(baseLayer);

    try {
      const promises = tilesets.value.map(ts => Cesium.Cesium3DTileset.fromUrl(ts.url));
      const loadedTilesets = await Promise.all(promises);

      loadedTilesets.forEach((loadedTs, index) => {
        const tilesetInfo = tilesets.value[index];
        viewer.scene.primitives.add(loadedTs);
        tilesetInfo.instance = loadedTs;
        if (tilesetInfo.style) {
          loadedTs.style = tilesetInfo.style;
        }
        loadedTs.show = tilesetInfo.show;
      });

      if (tilesets.value.length > 0 && tilesets.value[0].instance) {
        await viewer.zoomTo(tilesets.value[0].instance);
      }
    } catch (error) {
      console.error('Failed to load one or more tilesets:', error);
    }

    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((movement) => {
      const feature = viewer.scene.pick(movement.position);
      if (feature instanceof Cesium.Cesium3DTileFeature) {
        const propertyNames = feature.getPropertyNames();
        let description = '<table class="cesium-infoBox-defaultTable"><tbody>';
        for (let i = 0; i < propertyNames.length; i++) {
          const name = propertyNames[i];
          const value = feature.getProperty(name);
          description += `<tr><th>${name}</th><td>${value}</td></tr>`;
        }
        description += '</tbody></table>';

        viewer.selectedEntity = new Cesium.Entity({
          name: 'Feature Properties',
          description: description,
        });
      }
    }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
  }
});

const toggleBaseLayer = () => {
  if (baseLayer) {
    baseLayer.show = showBaseLayer.value;
  }
};

const toggleTilesetVisibility = (tileset) => {
  if (tileset.instance) {
    tileset.instance.show = tileset.show;
  }
};
</script>

<style scoped>
.cesium-wrapper {
  position: relative;
  width: 100%;
  height: calc(100vh - 75px); /* Adjust 75px based on your nav bar's actual height */
}

.cesium-container {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.sidebar {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(42, 42, 42, 0.8);
  color: white;
  padding: 10px;
  border-radius: 5px;
  z-index: 1;
}
.layer-control {
    display: flex;
    align-items: center;
    gap: 5px;
}
</style> 