<template>
  <div class="about">
    <h1>Please scan the QR code using WeChat to log in</h1>
    <img :src="QrUrl">
    <span v-if="statusText">{{ statusText }}</span>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { startSocket } from "../controllers/socketApi";
import type { dataType } from "../controllers/socketApi";
import axios from "axios";
import config from "../controllers/config";
const QrUrl = ref('');
const statusText = ref('');
onMounted(() => {
  console.log('mounted');

  //FIXME: to create class that based event and that can support multiple event listeners.  
  startSocket((data: dataType) => {
    console.log('received data from Socket', data);
    const arr=new Uint8Array(data.payload);
    const blob=new Blob([arr]);
    const url=URL.createObjectURL(blob);
    QrUrl.value = url;

  }, { path: "/chat/login", payload: "" })
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
