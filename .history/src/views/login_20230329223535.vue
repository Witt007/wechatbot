<template>
  <div class="about">
    <h1>Please scan the QR code using WeChat to log in</h1>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { startSocket } from "../controllers/socketApi";
import type { dataType } from "../controllers/socketApi";
onMounted(() => {
  console.log('mounted');
//FIXME: to create class that based event that can support multiple event listeners.  
  startSocket((data: dataType) => {
    console.log('received data from Socket', data);

  }, { path: "/login", payload: "" })
})
</script>

<style>
.about {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
