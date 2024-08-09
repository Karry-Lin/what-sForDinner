<template>
  <div id="container">
    <div id="wheel">
      <wheel />
    </div>
    <div id="myMap">
      <myMap />
    </div>
  </div>
</template>

<script setup></script>

<style scoped>
#container {
  display: flex;
  width: 100%;
  height: 100%;
}
#wheel {
  flex: 1;
  margin: 10px;
}

#myMap {
  flex: 1;
  margin-left: 10px;
}
</style>
