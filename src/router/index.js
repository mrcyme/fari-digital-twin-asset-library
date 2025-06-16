import { createRouter, createWebHistory } from 'vue-router';
import AssetLibrary from '../views/AssetLibrary.vue';
import PointCloudLibrary from '../views/PointCloudLibrary.vue';
import MapLibrary from '../views/MapLibrary.vue';
import TilesetLibrary from '../views/TilesetLibrary.vue';

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
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router; 