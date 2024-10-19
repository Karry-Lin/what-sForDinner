<template>
  <div class="wheel-wrapper">
    <div class="wheel-card">
      <div class="wheel-header">
        <h2 class="wheel-title">幸運轉盤</h2>
      </div>

      <div class="fortune-wheel-container">
        <FortuneWheel
          v-if="!isReload"
          style="width: 440px; max-width: 100%"
          :canvas="canvasOptions"
          :prizes="prizesCanvas"
          :prizeId="prizeId"
          :verify="true"
          @rotateStart="onCanvasRotateStart"
          @rotateEnd="onRotateEnd"
          :useWeight="true"
        />
      </div>
    </div>

    <Transition name="modal-fade">
      <div v-if="showWinnerModal" class="modal-overlay" @click.self="showWinnerModal = false">
        <div class="winner-modal-card">
          <button class="modal-close-btn" @click="showWinnerModal = false">X</button>
          <div class="modal-content">
            <span class="winner-subtitle">抽中結果</span>
            <h2 class="winner-title">{{ output }}</h2>
            <div class="modal-actions">
              <button @click="handleFocusMap" class="btn-modal-gmap">
                在地圖上定位
              </button>
              <button @click="showWinnerModal = false" class="btn-modal-confirm">
                確定
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <div class="wheel-options-card">
      <div class="options-header">
        <div class="options-title-group">
          <h3>轉盤選項</h3>
          <span class="options-count">{{ prizesCanvas.length }}</span>
        </div>
        <div class="options-presets">
          <button @click="loadDefaultFoodPresets" class="btn-preset">
            預設
          </button>
          <button @click="clearAllPrizes" class="btn-clear-all">
            清空
          </button>
        </div>
      </div>

      <div class="options-list">
        <div 
          v-for="(prize, index) in prizesCanvas" 
          :key="prize.id || index" 
          class="option-item-row"
        >
          <div class="color-indicator" :style="{ backgroundColor: prize.bgColor }"></div>
          <span class="option-idx">{{ index + 1 }}</span>
          <input 
            type="text" 
            v-model="prizesCanvas[index].name" 
            placeholder="輸入選項名稱..."
            class="option-input"
          />
          <button @click="deletePrize(index)" class="btn-del-option" title="刪除">
            X
          </button>
        </div>
      </div>

      <div class="options-footer">
        <button @click="addSinglePrize" class="btn-add-option">
          + 新增選項
        </button>
      </div>
    </div>
  </div>
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
  btnWidth: 110,
  borderColor: "#27272A",
  borderWidth: 5,
  fontSize: 20,
  textLength: 12,
  textRadius: 165,
  lineHeight: 24,
};

const foodColors = [
  "#FF6B35",
  "#FFB703",
  "#10B981",
  "#F72585",
  "#7209B7",
  "#4CC9F0",
  "#F97316",
  "#EC4899",
];

const prizesCanvas = ref([
  { id: 1, name: "火鍋", bgColor: foodColors[0], color: "#ffffff", weight: 1 },
  { id: 2, name: "拉麵", bgColor: foodColors[1], color: "#18181B", weight: 1 },
  { id: 3, name: "便當", bgColor: foodColors[2], color: "#ffffff", weight: 1 },
  { id: 4, name: "漢堡", bgColor: foodColors[3], color: "#ffffff", weight: 1 },
  { id: 5, name: "定食", bgColor: foodColors[4], color: "#ffffff", weight: 1 },
]);

const prizeId = ref<number | string>(1);
const showWinnerModal = ref<boolean>(false);
const output = ref<string>("");

function reindexPrizes() {
  prizesCanvas.value.forEach((prize, idx) => {
    prize.id = idx + 1;
    prize.bgColor = foodColors[idx % foodColors.length];
    prize.color = prize.bgColor === "#FFB703" ? "#18181B" : "#ffffff";
    prize.weight = 1;
  });
}

function onCanvasRotateStart(rotate?: Function) {
  showWinnerModal.value = false;
  if (prizesCanvas.value.length < 2) {
    alert("請至少新增 2 個選項才能進行轉盤抽籤！");
    return;
  }
  reindexPrizes();
  const randomIndex = Math.floor(Math.random() * prizesCanvas.value.length);
  prizeId.value = prizesCanvas.value[randomIndex].id;

  if (typeof rotate === 'function') {
    rotate();
  }
}

function onRotateEnd(prize: { name: string }) {
  output.value = prize.name;
  showWinnerModal.value = true;
}

function deletePrize(index: number) {
  prizesCanvas.value.splice(index, 1);
  reindexPrizes();
  reload();
}

function addSinglePrize() {
  const nextIdx = prizesCanvas.value.length + 1;
  prizesCanvas.value.push({
    id: nextIdx,
    name: `選項 ${nextIdx}`,
    bgColor: foodColors[(nextIdx - 1) % foodColors.length],
    color: "#ffffff",
    weight: 1,
  });
  reindexPrizes();
  reload();
}

function clearAllPrizes() {
  prizesCanvas.value = [];
  reload();
}

const defaultPresets = ["火鍋", "拉麵", "便當", "燒肉", "韓式炸雞", "義大利麵", "漢堡", "牛肉麵"];

function loadDefaultFoodPresets() {
  prizesCanvas.value = defaultPresets.map((name, idx) => ({
    id: idx + 1,
    name,
    bgColor: foodColors[idx % foodColors.length],
    color: "#ffffff",
    weight: 1,
  }));
  reindexPrizes();
  reload();
}

const { emit, on } = useEventBus();

function handleFocusMap() {
  showWinnerModal.value = false;
  if (output.value) {
    emit('focus-map', output.value);
  }
}

onMounted(() => {
  on("message", (msg) => {
    const nameStr = typeof msg === 'string' ? msg : msg?.name || '';
    if (!nameStr) return;

    const exists = prizesCanvas.value.some(p => p.name === nameStr);
    if (!exists) {
      prizesCanvas.value.push({
        id: prizesCanvas.value.length + 1,
        name: nameStr,
        bgColor: foodColors[prizesCanvas.value.length % foodColors.length],
        color: "#ffffff",
        weight: 1,
      });
      reindexPrizes();
      reload();
    }
  });
});
</script>

<style scoped>
.wheel-wrapper {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.wheel-card {
  background: #FFFFFF;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #E4E4E7;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.wheel-header {
  width: 100%;
  margin-bottom: 16px;
}

.wheel-title {
  font-size: 16px;
  font-weight: 600;
  color: #18181B;
}

.fortune-wheel-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px 0;
  width: 100%;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.4);
  z-index: 10000;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.winner-modal-card {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 28px 24px;
  width: 100%;
  max-width: 360px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  position: relative;
  text-align: center;
}

.modal-close-btn {
  position: absolute;
  top: 12px;
  right: 14px;
  background: transparent;
  border: none;
  color: #A1A1AA;
  font-size: 16px;
  cursor: pointer;
}

.winner-subtitle {
  font-size: 13px;
  color: #71717A;
}

.winner-title {
  font-size: 24px;
  font-weight: 700;
  color: #18181B;
  margin: 12px 0 20px;
  word-break: break-word;
}

.modal-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.btn-modal-gmap {
  background: #F4F4F5;
  color: #18181B;
  border: 1px solid #E4E4E7;
  padding: 10px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  display: block;
}

.btn-modal-confirm {
  background: #18181B;
  color: white;
  border: none;
  padding: 10px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.wheel-options-card {
  background: #FFFFFF;
  padding: 16px 20px;
  border-radius: 12px;
  border: 1px solid #E4E4E7;
}

.options-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.options-title-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.options-title-group h3 {
  font-size: 16px;
  font-weight: 600;
  color: #18181B;
}

.options-count {
  background: #F4F4F5;
  color: #71717A;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
}

.options-presets {
  display: flex;
  gap: 6px;
}

.btn-preset {
  background: #F4F4F5;
  color: #18181B;
  border: 1px solid #E4E4E7;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}

.btn-clear-all {
  background: transparent;
  color: #EF4444;
  border: none;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 280px;
  overflow-y: auto;
}

.option-item-row {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #FAFAFA;
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid #E4E4E7;
}

.color-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.option-idx {
  font-size: 12px;
  color: #A1A1AA;
  width: 18px;
}

.option-input {
  flex: 1;
  border: 1px solid #E4E4E7;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 13px;
  outline: none;
  background: #FFFFFF;
}

.option-input:focus {
  border-color: #18181B;
}

.btn-del-option {
  background: transparent;
  border: none;
  color: #A1A1AA;
  padding: 2px 6px;
  font-size: 12px;
  cursor: pointer;
}

.btn-del-option:hover {
  color: #EF4444;
}

.options-footer {
  margin-top: 12px;
}

.btn-add-option {
  width: 100%;
  background: #FAFAFA;
  color: #18181B;
  border: 1px dashed #D4D4D8;
  padding: 8px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.btn-add-option:hover {
  background: #F4F4F5;
}
</style>


