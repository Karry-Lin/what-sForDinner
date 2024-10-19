<template>
  <div class="map-wrapper">
    <Transition name="toast-fade">
      <div v-if="showToast" class="toast-notification">
        <span>{{ toastMessage }}</span>
      </div>
    </Transition>

    <div class="search-card">
      <div class="search-input-wrapper">
        <vue-google-autocomplete
          id="searchTextField"
          placeholder="搜尋地點或餐廳..."
          @placechanged="searchPlaces"
          :types="options.types"
          :enable-geolocation="true"
          :geolocation-options="options.geoOptions"
          v-model="searchText"
          class="custom-search-input"
        >
        </vue-google-autocomplete>
      </div>
      <button 
        @click="addFavo" 
        :disabled="!selectRestaurant.name" 
        class="btn-primary-add"
      >
        加入最愛
      </button>
    </div>

    <div class="map-container-card">
      <GoogleMap
        ref="googleMapRef"
        v-if="!isReload"
        :api-key="googleMapsApiKey"
        :libraries="['places']"
        style="width: 100%; height: 480px;"
        :zoom="zoom"
        :center="center"
        @click="onMapClick"
      >
        <Marker
          v-if="selectRestaurant.location.lat !== 0 && selectRestaurant.location.lng !== 0"
          :options="{ position: selectRestaurant.location }"
          @click="infoWindowOpen = true"
        />
        <InfoWindow
          v-if="infoWindowOpen"
          @closeclick="infoWindowOpen=false"
          :options="{ position: selectRestaurant.location }"
        >
          <div class="custom-info-window">
            <h3 class="info-title">{{ selectRestaurant.name }}</h3>
            <p class="info-address">{{ selectRestaurant.address }}</p>
            <a :href="selectRestaurant.link" target="_blank" class="info-link">
              在地圖上檢視 ↗
            </a>
            <div class="info-actions">
              <button @click="addFavo" class="btn-info-favo">加入最愛</button>
              <button @click="sendMessage(selectRestaurant.name)" class="btn-info-wheel">加到轉盤</button>
            </div>
          </div>
        </InfoWindow>
      </GoogleMap>
    </div>

    <div class="favorites-card">
      <div class="fav-header">
        <div class="fav-title-group">
          <h3>我的最愛</h3>
          <span class="fav-count">{{ favoList.length }}</span>
        </div>

        <div v-if="favoList.length > 0" class="fav-batch-actions">
          <button @click="addAllFavoToWheel" class="btn-batch-add">
            全部加到轉盤
          </button>
          <button @click="clearAllFavo" class="btn-batch-clear">
            清空
          </button>
        </div>
      </div>

      <div v-if="favoList.length === 0" class="fav-empty-state">
        <p>尚無收藏地點，在地圖上點擊或搜尋即可加入最愛。</p>
      </div>

      <ul v-else class="fav-list">
        <li v-for="(item, index) in favoList" :key="item.placeId || index" class="fav-item">
          <div v-if="!item.isEditing" class="fav-item-content">
            <div class="fav-item-info" @click="focusLocation(item)" style="cursor: pointer;" title="點擊在地圖上定位">
              <img src="../google-maps-icon.png" alt="Google Maps" class="gmap-icon" />
              <span class="fav-item-name">{{ item.name }}</span>
            </div>
            <div class="fav-item-actions">
              <button @click.stop="item.isEditing = true" class="btn-text-action">修改</button>
              <button @click.stop="sendMessage(item.name)" class="btn-text-action btn-highlight">加到轉盤</button>
              <button @click.stop="removeFavo(index)" class="btn-text-action btn-del">刪除</button>
            </div>
          </div>

          <div v-else class="fav-item-edit-mode">
            <input v-model="item.name" class="edit-input" autofocus @keyup.enter="saveFavoEdit(item)" />
            <button @click="saveFavoEdit(item)" class="btn-save">儲存</button>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { GoogleMap, Marker, InfoWindow } from "vue3-google-map";
import VueGoogleAutocomplete from "vue-google-autocomplete";
import useEventBus from '~/composables/useEventBus';

const config = useRuntimeConfig();
const googleMapsApiKey = config.public.googleMapsApiKey;
const center = ref<{ lat: number; lng: number }>({ lat: 23.5, lng: 121 });
const zoom = ref<number>(8);
const isReload = ref<boolean>(false);
const searchText = ref<string>("");
const options = ref({
  types: "restaurant",
  geoOptions: {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0,
  },
});

const selectRestaurant = ref<{
  location: { lat: number; lng: number };
  placeId: string;
  name: string;
  address: string;
  link: string;
}>({
  location: { lat: 0, lng: 0 },
  placeId: "",
  name: "",
  address: "",
  link: "",
});

let localList: string | null = null;
const favoList = ref<
  {
    location: { lat: number; lng: number };
    placeId: string;
    name: string;
    address: string;
    link: string;
    isEditing: boolean;
  }[]
>([]);

const toastMessage = ref<string>("");
const showToast = ref<boolean>(false);

function triggerToast(msg: string) {
  toastMessage.value = msg;
  showToast.value = true;
  setTimeout(() => {
    showToast.value = false;
  }, 2200);
}

const { emit, on } = useEventBus();

onMounted(() => {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      center.value.lat = position.coords.latitude;
      center.value.lng = position.coords.longitude;
      reload();
      zoom.value = 15;
    },
    (err) => {
      console.warn("Geolocation error or denied:", err);
    }
  );
  localList = localStorage.getItem("restaurant");
  favoList.value = localList ? JSON.parse(localList) : [];

  on('focus-map', (targetName) => {
    focusLocation(targetName);
  });
});

async function reload() {
  isReload.value = true;
  await nextTick();
  isReload.value = false;
}

function searchPlaces(info: any, place: any, id: any) {
  infoWindowOpen.value = false;
  if (!place || !place.geometry) return;

  selectRestaurant.value = {
    location: {
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng()
    },
    placeId: place.place_id || "",
    name: place.name || "",
    address: place.formatted_address || "",
    link: place.url || `https://www.google.com/maps/search/?api=1&query=${place.geometry.location.lat()},${place.geometry.location.lng()}`,
  };
  center.value = selectRestaurant.value.location;
  infoWindowOpen.value = true;
}

const infoWindowOpen = ref(false);

let placesService: any = null;
let geocoder: any = null;
const googleMapRef = ref<any>(null);

function ensureServices() {
  if (typeof window === 'undefined' || !window.google || !window.google.maps) return;

  if (!geocoder) {
    geocoder = new window.google.maps.Geocoder();
  }

  if (!placesService) {
    const googleMapComponent = googleMapRef.value;
    let actualMap = null;
    if (googleMapComponent) {
      if (googleMapComponent.map) {
        actualMap = googleMapComponent.map;
      } else if (googleMapComponent.$children && googleMapComponent.$children[0]) {
        actualMap = googleMapComponent.$children[0];
      } else if (typeof googleMapComponent.getMap === 'function') {
        actualMap = googleMapComponent.getMap();
      }
    }

    if (actualMap) {
      placesService = new window.google.maps.places.PlacesService(actualMap);
    } else {
      const dummyElement = document.createElement('div');
      placesService = new window.google.maps.places.PlacesService(dummyElement);
    }
  }
}

function onMapClick(event: any) {
  if (!event) return;

  if (event.placeId) {
    if (typeof event.stop === 'function') {
      event.stop();
    }

    const placeId = event.placeId;
    const clickLocation = {
      lat: typeof event.latLng?.lat === 'function' ? event.latLng.lat() : event.latLng?.lat || 0,
      lng: typeof event.latLng?.lng === 'function' ? event.latLng.lng() : event.latLng?.lng || 0,
    };

    ensureServices();

    if (placesService) {
      placesService.getDetails(
        {
          placeId: placeId,
          fields: ['name', 'formatted_address', 'geometry', 'url', 'place_id'],
        },
        (place: any, status: any) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
            const location = {
              lat: place.geometry?.location?.lat() || clickLocation.lat,
              lng: place.geometry?.location?.lng() || clickLocation.lng,
            };
            selectRestaurant.value = {
              location,
              placeId: place.place_id || placeId,
              name: place.name || '店家',
              address: place.formatted_address || '',
              link: place.url || `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`,
            };
            infoWindowOpen.value = true;
          } else {
            fallbackGeocode(clickLocation, placeId);
          }
        }
      );
    } else {
      fallbackGeocode(clickLocation, placeId);
    }
    return;
  }

  if (!event.latLng) return;

  const location = {
    lat: typeof event.latLng.lat === 'function' ? event.latLng.lat() : event.latLng.lat,
    lng: typeof event.latLng.lng === 'function' ? event.latLng.lng() : event.latLng.lng,
  };

  ensureServices();
  fallbackGeocode(location, '');
}

function fallbackGeocode(location: { lat: number; lng: number }, placeId: string) {
  if (geocoder) {
    geocoder.geocode({ location }, (results: any, status: any) => {
      if (status === 'OK' && results && results[0]) {
        const address = results[0].formatted_address || '';
        const name = address.split(',')[0] || `地點 (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)})`;
        selectRestaurant.value = {
          location,
          placeId: placeId || results[0].place_id || '',
          name,
          address,
          link: `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`,
        };
      } else {
        selectRestaurant.value = {
          location,
          placeId: placeId || '',
          name: `位置 (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)})`,
          address: `緯度: ${location.lat.toFixed(6)}, 經度: ${location.lng.toFixed(6)}`,
          link: `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`,
        };
      }
      infoWindowOpen.value = true;
    });
  } else {
    selectRestaurant.value = {
      location,
      placeId: placeId || '',
      name: `位置 (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)})`,
      address: `緯度: ${location.lat.toFixed(6)}, 經度: ${location.lng.toFixed(6)}`,
      link: `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`,
    };
    infoWindowOpen.value = true;
  }
}

function focusLocation(target: any) {
  if (typeof target === 'object' && target && target.location && (target.location.lat !== 0 || target.location.lng !== 0)) {
    const loc = { lat: Number(target.location.lat), lng: Number(target.location.lng) };
    selectRestaurant.value = {
      location: loc,
      placeId: target.placeId || "",
      name: target.name || "",
      address: target.address || "",
      link: target.link || `https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`,
    };
    center.value = loc;
    zoom.value = 16;
    infoWindowOpen.value = true;
    triggerToast(`已定位至「${selectRestaurant.value.name}」`);
    scrollToMap();
    return;
  }

  const searchName = typeof target === 'string' ? target : target?.name;
  if (!searchName) return;

  ensureServices();

  if (placesService) {
    const req = {
      query: searchName,
      location: center.value.lat !== 0 ? center.value : undefined,
      radius: 25000,
    };
    placesService.textSearch(req, (results: any, status: any) => {
      if (status === window.google?.maps?.places?.PlacesServiceStatus?.OK && results && results[0]) {
        const place = results[0];
        const loc = place.geometry.location;
        const location = {
          lat: typeof loc.lat === 'function' ? loc.lat() : loc.lat,
          lng: typeof loc.lng === 'function' ? loc.lng() : loc.lng,
        };
        selectRestaurant.value = {
          location,
          placeId: place.place_id || '',
          name: place.name || searchName,
          address: place.formatted_address || '',
          link: place.url || `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`,
        };
        center.value = location;
        zoom.value = 16;
        infoWindowOpen.value = true;
        triggerToast(`已定位至「${selectRestaurant.value.name}」`);
        scrollToMap();
        return;
      }

      fallbackGeocodeSearch(searchName);
    });
  } else {
    fallbackGeocodeSearch(searchName);
  }
}

function fallbackGeocodeSearch(searchName: string) {
  if (geocoder) {
    geocoder.geocode({ address: searchName }, (results: any, status: any) => {
      if (status === 'OK' && results && results[0]) {
        const loc = results[0].geometry.location;
        const location = {
          lat: typeof loc.lat === 'function' ? loc.lat() : loc.lat,
          lng: typeof loc.lng === 'function' ? loc.lng() : loc.lng,
        };
        selectRestaurant.value = {
          location,
          placeId: results[0].place_id || '',
          name: searchName,
          address: results[0].formatted_address || '',
          link: `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`,
        };
        center.value = location;
        zoom.value = 16;
        infoWindowOpen.value = true;
        triggerToast(`已定位至「${searchName}」`);
        scrollToMap();
      } else {
        selectRestaurant.value = {
          location: { ...center.value },
          placeId: '',
          name: searchName,
          address: '地圖中心位置對應標籤',
          link: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchName)}`,
        };
        zoom.value = 15;
        infoWindowOpen.value = true;
        triggerToast(`已於地圖中心標記「${searchName}」`);
        scrollToMap();
      }
    });
  } else {
    selectRestaurant.value = {
      location: { ...center.value },
      placeId: '',
      name: searchName,
      address: '地圖中心位置對應標籤',
      link: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchName)}`,
    };
    infoWindowOpen.value = true;
    triggerToast(`已於地圖中心標記「${searchName}」`);
    scrollToMap();
  }
}

function scrollToMap() {
  const mapEl = document.querySelector('.map-container-card');
  if (mapEl) {
    mapEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function addFavo() {
  if (!selectRestaurant.value.name) return;
  const exists = favoList.value.some(item => item.name === selectRestaurant.value.name);
  if (exists) {
    triggerToast(`「${selectRestaurant.value.name}」已在最愛清單中`);
    return;
  }
  favoList.value.push({ ...selectRestaurant.value, isEditing: false });
  localStorage.setItem("restaurant", JSON.stringify(favoList.value));
  triggerToast(`已新增「${selectRestaurant.value.name}」至最愛`);
}

function saveFavoEdit(item: any) {
  item.isEditing = false;
  localStorage.setItem("restaurant", JSON.stringify(favoList.value));
  triggerToast(`已更新「${item.name}」`);
}

function removeFavo(index: number) {
  const removed = favoList.value[index];
  favoList.value.splice(index, 1);
  localStorage.setItem("restaurant", JSON.stringify(favoList.value));
  if (removed) {
    triggerToast(`已移除「${removed.name}」`);
  }
}

function addAllFavoToWheel() {
  if (favoList.value.length === 0) return;
  let count = 0;
  favoList.value.forEach(item => {
    if (item.name) {
      sendMessage(item.name);
      count++;
    }
  });
  triggerToast(`已將 ${count} 個地點加入轉盤`);
}

function clearAllFavo() {
  if (confirm('確定要清空所有最愛地點嗎？')) {
    favoList.value = [];
    localStorage.setItem("restaurant", JSON.stringify([]));
    triggerToast('已清空最愛地點');
  }
}

function sendMessage(name: string) {
  if (!name) return;
  emit('message', name);
  triggerToast(`已將「${name}」加入轉盤`);
}
</script>

<style scoped>
.map-wrapper {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.toast-notification {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: #18181B;
  color: #FFFFFF;
  padding: 10px 18px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 9999;
  font-size: 14px;
  font-weight: 500;
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.2s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.search-card {
  background: #FFFFFF;
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid #E4E4E7;
  display: flex;
  gap: 10px;
  align-items: center;
}

.search-input-wrapper {
  flex: 1;
}

:deep(.custom-search-input) {
  width: 100%;
  padding: 10px 14px !important;
  font-size: 14px !important;
  border: 1px solid #E4E4E7 !important;
  border-radius: 8px !important;
  outline: none !important;
  transition: border-color 0.2s ease !important;
  background: #FFFFFF !important;
  color: #18181B !important;
}

:deep(.custom-search-input:focus) {
  border-color: #18181B !important;
}

.btn-primary-add {
  background: #18181B;
  color: #FFFFFF;
  border: none;
  padding: 10px 18px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: opacity 0.2s ease;
}

.btn-primary-add:hover:not(:disabled) {
  opacity: 0.85;
}

.btn-primary-add:disabled {
  background: #E4E4E7;
  color: #A1A1AA;
  cursor: not-allowed;
}

.map-container-card {
  background: #FFFFFF;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #E4E4E7;
}

.custom-info-window {
  padding: 4px;
  min-width: 200px;
}

.info-title {
  font-size: 15px;
  font-weight: 600;
  color: #18181B;
  margin-bottom: 4px;
}

.info-address {
  font-size: 13px;
  color: #71717A;
  margin-bottom: 8px;
}

.info-link {
  font-size: 12px;
  color: #2563EB;
  text-decoration: none;
  display: inline-block;
  margin-bottom: 10px;
}

.info-actions {
  display: flex;
  gap: 6px;
}

.btn-info-favo, .btn-info-wheel {
  flex: 1;
  border: none;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}

.btn-info-favo {
  background-color: #18181B;
  color: white;
}

.btn-info-wheel {
  background-color: #F4F4F5;
  color: #18181B;
  border: 1px solid #E4E4E7;
}

.favorites-card {
  background: #FFFFFF;
  padding: 16px 20px;
  border-radius: 12px;
  border: 1px solid #E4E4E7;
}

.fav-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.fav-title-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.fav-title-group h3 {
  font-size: 16px;
  font-weight: 600;
  color: #18181B;
}

.fav-count {
  background: #F4F4F5;
  color: #71717A;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
}

.fav-batch-actions {
  display: flex;
  gap: 6px;
}

.btn-batch-add {
  background: #18181B;
  color: #FFFFFF;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.btn-batch-add:hover {
  opacity: 0.85;
}

.btn-batch-clear {
  background: #FEF2F2;
  color: #DC2626;
  border: 1px solid #FCA5A5;
  padding: 5px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.btn-batch-clear:hover {
  background: #FEE2E2;
}

.fav-empty-state {
  text-align: center;
  padding: 20px;
  color: #A1A1AA;
  font-size: 14px;
}

.fav-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.fav-item {
  background: #FAFAFA;
  border: 1px solid #E4E4E7;
  border-radius: 8px;
  padding: 10px 14px;
}

.fav-item-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.fav-item-info {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.gmap-icon {
  width: 20px;
  height: 20px;
}

.fav-item-name {
  font-size: 14px;
  font-weight: 500;
  color: #18181B;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fav-item-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-text-action {
  background: #F4F4F5;
  border: 1px solid #E4E4E7;
  color: #18181B;
  padding: 5px 10px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.btn-text-action:hover {
  background: #E4E4E7;
}

.btn-highlight {
  background: #EFF6FF;
  color: #2563EB;
  border: 1px solid #BFDBFE;
}

.btn-highlight:hover {
  background: #DBEAFE;
}

.btn-del {
  background: #FEF2F2;
  color: #DC2626;
  border: 1px solid #FCA5A5;
}

.btn-del:hover {
  background: #FEE2E2;
}

.fav-item-edit-mode {
  display: flex;
  gap: 8px;
  align-items: center;
}

.edit-input {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid #18181B;
  border-radius: 6px;
  font-size: 13px;
  outline: none;
}

.btn-save {
  background: #18181B;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
}
</style>
