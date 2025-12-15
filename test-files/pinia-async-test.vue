<template>
  <div>
    <h1>Pinia Async Test</h1>
    <p>{{ message }}</p>
  </div>
</template>

<script>
import { defineStore } from 'pinia';

const useAsyncStore = defineStore('async', () => {
  const message = ref('Loading...');

  const loadData = async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    message.value = 'Data loaded';
  };

  return { message, loadData };
});

const asyncFunction = async () => {
  // PINIA_USESTORE_AFTER_AWAIT: useStore after await
  await fetch('/api/init');

  // This should trigger the detector
  const store = useStore('async');

  return store.message;
};

export default {
  setup() {
    return {
      message: asyncFunction()
    };
  }
};
</script>