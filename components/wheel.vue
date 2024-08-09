<template>
  <div class="spinning-wheel-content">
    <label>選項數量：</label>
    <input type="number" v-model="numPrizes" min="1" max="10" />

    <div v-for="(prize, index) in prizesCanvas" :key="index">
      <label>
        選項 {{ index + 1 }} 名稱：
        <input type="text" v-model="prizesCanvas[index].name" />
      </label>
    </div>
    <button @click="reload()">confirm</button>
  </div>
  <div style="margin: 20px; font-size: 30px; color: brown">
    結果： {{ output }}
  </div>

  <FortuneWheel
    v-if="!isReload"
    style="width: 460px; max-width: 100%"
    :canvas="canvasOptions"
    :prizes="prizesCanvas"
    @rotateStart="onCanvasRotateStart"
    @rotateEnd="onRotateEnd"
    :useWeight="true"
  />
</template>

<script setup lang="ts">
import FortuneWheel from "vue-fortune-wheel";
import "vue-fortune-wheel/style.css";
import useEventBus from "~/composables/useEventBus";

const isReload = ref<boolean>(false);
async function reload() {
  isReload.value = true;
  await nextTick();
  isReload.value = false;
}

const canvasOptions = {
  btnWidth: 140,
  borderColor: "#584b43",
  borderWidth: 6,
  lineHeight: 30,
};

let numPrizes = ref(5);

const color = ["#CFCFEA", "#A89B9D", "#816c61", "#575a4b", "#2a2c24"];

const prizesCanvas = ref([
  {
    id: 1,
    name: "Lavender",
    bgColor: color[0],
    color: "#ffffff",
    weight: 1,
  },
  {
    id: 2,
    name: "Rose quartz",
    bgColor: color[1],
    color: "#ffffff",
    weight: 1,
  },
  {
    id: 3,
    name: "Cinereous",
    bgColor: color[2],
    color: "#ffffff",
    weight: 1,
  },
  {
    id: 4,
    name: "Ebony",
    bgColor: color[3],
    color: "#ffffff",
    weight: 1,
  },
  {
    id: 5,
    name: "Black olive",
    bgColor: color[4],
    color: "#ffffff",
    weight: 1,
  },
]);

watch(
  numPrizes,
  (newVal) => {
    // When increasing the number of prizes, add new prizes
    if (newVal > prizesCanvas.value.length) {
      const lastId = prizesCanvas.value.length + 1;
      for (let i = lastId; i <= newVal; i++) {
        prizesCanvas.value.push({
          id: i,
          name: `Prize ${i}`,
          bgColor: color[(i - 1) % color.length],
          color: "#ffffff",
          weight: 1,
        });
      }
    }
    // When decreasing the number of prizes, remove extra prizes
    else if (newVal < prizesCanvas.value.length) {
      prizesCanvas.value.splice(newVal);
    }
  },
  { immediate: true }
);

function onCanvasRotateStart() {
  console.log("RotateStart");
}

const output = ref<string>("");
function onRotateEnd(prize: { name: string }) {
  output.value = prize.name;
}
const { on } = useEventBus();
let countAdd = 0;
onMounted(() => {
  on("message", (msg) => {
    prizesCanvas.value[countAdd].name = <string>msg;
    countAdd++;
    reload();
  });
});
</script>

<style scoped>
.spinning-wheel-content {
  max-width: 460px;
  margin: 0;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.spinning-wheel-content label {
  margin-right: 10px;
}

.spinning-wheel-content input {
  margin: 5px;
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.spinning-wheel-content button {
  margin-top: 10px;
  padding: 10px 20px;
  background-color: #007bff;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.spinning-wheel-content button:hover {
  background-color: #0056b3;
}

.spinning-wheel-content p {
  margin: 5px 0;
}
</style>
