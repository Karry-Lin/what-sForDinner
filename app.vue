<template>
  <div class="app-layout">
    <header class="app-header">
      <div class="header-container">
        <h1 class="brand-title">What's for dinner?</h1>
      </div>
    </header>

    <main class="main-content">
      <NuxtPage />
    </main>
  </div>
</template>

<script setup>
import '@fortawesome/fontawesome-free/css/all.css';
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Noto+Sans+TC:wght@400;500;700&display=swap');

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Outfit', 'Noto Sans TC', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background-color: #FAFAFA;
  color: #18181B;
  min-height: 100vh;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-header {
  background: #FFFFFF;
  border-bottom: 1px solid #E4E4E7;
  padding: 18px 24px;
}

.header-container {
  max-width: 1300px;
  margin: 0 auto;
  display: flex;
  align-items: center;
}

.brand-title {
  font-family: 'Outfit', sans-serif;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.5px;
  color: #18181B;
}

.main-content {
  flex: 1;
  max-width: 1300px;
  width: 100%;
  margin: 0 auto;
  padding: 24px 20px 40px;
}
</style>


