import { createRouter, createWebHistory } from 'vue-router';
import AssetLibrary from '../views/AssetLibrary.vue';
import PointCloudLibrary from '../views/PointCloudLibrary.vue';
import MapLibrary from '../views/MapLibrary.vue';
import TilesetLibrary from '../views/TilesetLibrary.vue';
import DemoView from '../views/DemoView.vue';

const routes = [
  {
    path: '/',
    redirect: '/assets'
  },
  {
    path: '/assets',
    name: 'AssetLibrary',
    component: AssetLibrary,
  },
  {
    path: '/pointclouds',
    name: 'PointCloudLibrary',
    component: PointCloudLibrary,
  },
  {
    path: '/maps',
    name: 'MapLibrary',
    component: MapLibrary,
  },
  {
    path: '/tilesets',
    name: 'TilesetLibrary',
    component: TilesetLibrary,
  },
  {
    path: '/demo',
    name: 'Demo',
    component: DemoView,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router; 