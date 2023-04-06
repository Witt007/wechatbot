<template>
  <div class="about">
    <h1>Please scan the QR code using WeChat to log in</h1>
    <img :src="QrUrl">
    <span v-if="statusText">{{ statusText }}</span>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref,reactive } from "vue";
import { startSocket } from "../controllers/socketApi";
import type { dataType } from "../controllers/socketApi";
import axios from "axios";
import config from "../controllers/config";
const QrUrl = rea('');
const statusText = ref('');
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
  startSocket((data: dataType) => {
    console.log('received data from Socket', data);
    QrUrl.value = data.payload

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
