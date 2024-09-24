<template>
  <div class="title">
    <h1>What's for dinner?</h1>
  </div>
  <vue-google-autocomplete
    id="searchTextField"
    placeholder="Enter a location"
    @placechanged="searchPlaces"
    :types="options.types"
    :enable-geolocation="true"
    :geolocation-options="options.geoOptions"
    v-model="searchText"
  >
  </vue-google-autocomplete>
  <button @click="addFavo">加入最愛</button>
  <div class="favolist">
    <h3>我的最愛</h3>
    <ul>
      <li v-for="(item, index) in favoList" :key="item.placeId">
        <p v-if="!item.isEditing">
          <a :href="item.link" target="_blank">
            <img src="../google-maps-icon.png" alt="Google Maps" style="width: 24px; height: 24px;" />
          </a>
          {{ item.name }}
          <button @click="item.isEditing=true">修改</button>
          <button @click="sendMessage(item.name)">加到轉盤</button>
          <button @click="removeFavo(index)">X</button>
        </p>
        <p v-if="item.isEditing">
          <input v-model="item.name"/>
          <button @click="item.isEditing=false">儲存</button>
        </p>
      </li>
    </ul>
  </div>
  <GoogleMap
    v-if="!isReload"
    :api-key="googleMapsApiKey"
    :libraries="['places']"
    style="width: 80%; height: 650px"
    :zoom="zoom"
    :center="center"
  >
    <Marker :options="{ position: center }" @click="openInfo" />
    <InfoWindow
      v-if="infoWindowOpen"
      @closeclick="infoWindowOpen=false"
      :options="{
        position: center,
        content: `<h3>${selectRestaurant.name}</h3>
        <p>地址:${selectRestaurant.address}</p>
        <a href='${selectRestaurant.link}' target='_blank'>在Google地圖上查看</a>`
      }"
    />
  </GoogleMap>
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
  link:"",
});
let localList;
let favoList = ref<
  {
    location: { lat: number; lng: number };
    placeId: string;
    name: string;
    address: string;
    link: string;
    isEditing: boolean;
  }[]
>([]);
onMounted(() => {
  navigator.geolocation.getCurrentPosition((position) => {
    center.value.lat = position.coords.latitude;
    center.value.lng = position.coords.longitude;
    reload();
    zoom.value = 17;
  });
  localList = localStorage.getItem("restaurant");
  favoList.value = localList ? JSON.parse(localList) : [];
});

async function reload() {
  isReload.value = true;
  await nextTick();
  isReload.value = false;
}
function searchPlaces(info, place, id) {
  infoWindowOpen.value = false;
  selectRestaurant.value.location = {
    lat: place.geometry.location.lat(),
    lng: place.geometry.location.lng()
  };
  selectRestaurant.value.placeId = place.place_id;
  selectRestaurant.value.name = place.name;
  selectRestaurant.value.address = place.formatted_address;
  selectRestaurant.value.link = place.url;
  center.value = selectRestaurant.value.location;
}
let infoWindowOpen = ref(false);
function openInfo() {
  infoWindowOpen.value = true;
}
function addFavo() {
  favoList.value.push({ ...selectRestaurant.value, isEditing: false});
  localStorage.setItem("restaurant", JSON.stringify(favoList.value));
}
function removeFavo(index) {
  favoList.value.splice(index, 1);
  localStorage.setItem("restaurant", JSON.stringify(favoList.value));
}
const { emit } = useEventBus();
function sendMessage(name) {
  emit('message', name);
}
</script>
<style scoped>
#searchTextField {
  margin: 10px;
  font-size: 18px;
  border: 1px solid #918d8d;
  border-radius: 5px;
}
.title h1 {
  margin: 0;
}
.favolist h3 {
  margin: 0;
}
button {
  margin: 5px;
  padding: 5px 15px;
  background-color: #007bff;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>
