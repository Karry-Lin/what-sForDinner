<template>
  <div class="dashboard-grid">
    <section class="grid-section map-section">
      <myMap />
    </section>
    <section class="grid-section wheel-section">
      <wheel />
    </section>
  </div>
</template>

<script setup>
</script>

<style scoped>
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  width: 100%;
}

@media (min-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: 7fr 5fr;
    align-items: start;
  }
}

.grid-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
</style>

