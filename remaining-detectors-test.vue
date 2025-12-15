<template>
  <!-- VFOR_INDEX_AS_KEY: Using array index as key -->
  <div v-for="(item, index) in items" :key="index">
    {{ item.name }}
  </div>

  <!-- Template refs without proper typing -->
  <input ref="inputRef" type="text" />
  <div ref="divRef"></div>
</template>

<script>
// MISSING_SHALLOW_REACTIVITY: Large reactive object
const largeReactiveData = reactive(Array.from({ length: 1500 }, (_, i) => ({ id: i, data: `item${i}` })));

// WATCHER_SHOULD_BE_COMPUTED: Watcher that should be computed
const count = ref(0);
const doubleCount = ref(0);

watch(
  () => count.value * 2,
  (newVal) => {
    doubleCount.value = newVal;
  }
);

// STATE_LOCALIZATION_ANTIPATTERN: Global state as local
const isAuthenticated = ref(true);
const userTheme = ref('dark');
const appLanguage = ref('en');

// EVENT_LISTENER_MEMORY_LEAK: Event listener without cleanup
export default {
  mounted() {
    window.addEventListener('scroll', this.handleScroll);
    document.addEventListener('click', this.handleClick);
  },

  methods: {
    handleScroll() {
      console.log('Scrolled');
    },
    handleClick() {
      console.log('Clicked');
    }
  }
};
</script>