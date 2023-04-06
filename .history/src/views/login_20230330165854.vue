<template>
  <div class="about">
    <h1>Please scan the QR code using WeChat to log in</h1>
    <img v-if="showQr" style="margin: 5%;" :src="QrUrl">
    <span style="color: greenyellow;" v-if="statusText">{{ statusText }}</span>
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
const showQr = ref(true);

onMounted(() => {
  console.log('mounted');
  axios.get('/chat/login/').then((res) => {
    if (!res.data) {
      console.log('there is a request error');

    } else if (res.data === "You have logged in!") {
      showQr.value = false
      statusText.value = res.data
    }
  })
  //FIXME: to create class that based event and that can support multiple event listeners.  

})
</script>

<style>
.about {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex-direction: column;
}
</style>
