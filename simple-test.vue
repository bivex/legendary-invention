<template>
  <!-- Should trigger VFOR_WITHOUT_KEY -->
  <div v-for="item in items">
    {{ item.name }}
  </div>

  <!-- Should trigger VFOR_INDEX_AS_KEY -->
  <div v-for="(item, index) in items" :key="index">
    {{ item.name }}
  </div>

  <!-- Should be fine -->
  <div v-for="item in items" :key="item.id">
    {{ item.name }}
  </div>
</template>

<script>
export default {
  data() {
    return {
      items: [{ id: 1, name: 'test' }]
    }
  }
}
</script>