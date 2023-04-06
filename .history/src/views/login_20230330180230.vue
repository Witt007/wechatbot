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
    const arr=new Uint8Array(res.data);
    const blob=new Blob([arr]);
    const url=URL.createObjectURL(blob);
    const decoder=new TextDecoder('base64');
   const d= decoder.decode(res.data)
    console.log(arr,blob,url,d);
    
    if (!res.data) {
      console.log('there is a request error');

    } else if (res.data === "You have logged in!") {
      showQr.value = false
      statusText.value = res.data
    }else  if (res.data instanceof Blob) {
    const url = URL.createObjectURL(res.data);
    showQr.value = true;
    //@ts-ignore
    QrUrl.value = url// 'data:image/jpeg;base64,'+uint8Array.toString()  
  }else{
    const arr=new Uint8Array(res.data);
    const blob=new Blob([arr]);
    const url=URL.createObjectURL(blob);
    QrUrl.value=url;
    showQr.value=true
  }
  })
  //FIXME: to create class that based event and that can support multiple event listeners. 
  
  startSocket((data: any) => {
  console.log('received data from Socket', typeof data, Object.prototype.toString.call(data), data);
  if (data instanceof Blob) {
    const url = URL.createObjectURL(data);
    showQr.value = true;
    //@ts-ignore
    QrUrl.value = url// 'data:image/jpeg;base64,'+uint8Array.toString()  
  } else  {
    const dataobj: dataType = JSON.parse(data);

    if (dataobj.payload == 'ok' && dataobj.path === '/login') {
      showQr.value = false;
      statusText.value = 'Authorized login succeeded!';
    }
  }

}, { path: "/chat/login", payload: "" })

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
