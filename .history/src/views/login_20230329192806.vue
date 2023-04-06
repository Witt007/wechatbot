<template>
  <div class="about">
    <h1>Please scan the QR code using WeChat to log in</h1>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import {send} from "../controllers/socketApi";
import type {dataType} from "../controllers/socketApi";
onMounted(()=>{
  send({path:"/login",payload:""}).then((data:dataType)=>{
console.log('received data from Socket');

  })
})
</script>

<style>
  .about {
    min-height: 100vh;
    display: flex;
    align-items: center;justify-content: center;
  }
</style>
