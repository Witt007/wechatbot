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
startSocket((data: dataType) => {
    console.log('received data from Socket', data);
    //@ts-ignore
    const uint8Array = new Uint8Array(data);Float32Array
const blob = new Blob([uint8Array], { type: 'image/jpeg' });
const url = URL.createObjectURL(blob);

const decoder = new TextDecoder();
const html = decoder.decode(data);
    QrUrl.value =html// 'data:image/jpeg;base64,'+uint8Array.toString()

  }, { path: "/chat/login", payload: "" })
onMounted(() => {
  console.log('mounted');
  axios.get(config.baseUrl + 'chat/login/').then((res) => {
    if (!res.data) {
      console.log('there is a request error');

    }else if(res.data==="You have logged in!"){
      statusText.value=res.data
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
  justify-content: center;
}
</style>
