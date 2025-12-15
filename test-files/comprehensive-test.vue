<template>
  <!-- Template Anti-Patterns -->
  <!-- VIF_WITH_VFOR: Using v-if and v-for on same element -->
  <li v-for="user in users" v-if="user.isActive" :key="user.id">
    {{ user.name }}
  </li>

  <!-- VFOR_WITHOUT_KEY: Missing key attribute -->
  <div v-for="item in items">
    {{ item.name }}
  </div>

  <!-- VFOR_INDEX_AS_KEY: Using array index as key -->
  <div v-for="(item, index) in items" :key="index">
    {{ item.name }}
  </div>

  <!-- COMPLEX_TEMPLATE_EXPRESSION: Very long expression -->
  <span>{{ user.firstName + ' ' + user.lastName + ' (' + user.age + ' years old)' + (user.isActive ? ' - Active' : ' - Inactive') }}</span>

  <!-- VHTML_XSS_RISK: Using v-html with dynamic content -->
  <div v-html="userInput"></div>

  <!-- DEEP_TEMPLATE_NESTING: Excessive nesting -->
  <div>
    <div>
      <div>
        <div>
          <div>
            <div>
              <div>
                <span>Deep nested content</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- LARGE_LIST_NO_VIRTUALIZATION: Large list without virtualization -->
  <div v-for="item in largeArray" :key="item.id">
    {{ item.name }}
  </div>

  <!-- Template ref without proper typing -->
  <input ref="myInput" type="text" />
</template>

<script>
// FULL_LIBRARY_IMPORT: Full lodash import
import _ from 'lodash';

// MISSING_SHALLOW_REACTIVITY: Large reactive objects
const largeData = reactive({
  items: [],
  users: [],
  settings: {},
  config: {},
  metadata: {},
  cache: {},
  state: {},
  moreData: {},
  evenMoreData: {},
  finalData: {}
});

// UNTYPED_PROPS: Props without TypeScript types
const props = defineProps({
  title: String,
  count: Number,
  data: null // untyped
});

// UNTYPED_EMITS: Emits without TypeScript types
const emit = defineEmits(['change', 'update']);

// REF_TYPE_INFERENCE_ISSUES: Various ref issues
const untypedRef = ref(null);
const stringRef = ref<string>();
const undefinedRef = ref(undefined);

// STATE_LOCALIZATION_ANTIPATTERN: Global state as local
const isAuthenticated = ref(false);
const userPreferences = reactive({
  theme: 'light',
  language: 'en'
});

// Reactive primitive (REF_REACTIVE_CONFUSION)
const count = reactive(0);

// DESTRUCTURING_REACTIVITY_LOSS: Destructuring reactive objects
const { name, age } = reactive({ name: 'John', age: 25 });
const { value: currentValue } = ref(42);

// WATCHER_SHOULD_BE_COMPUTED: Watcher that should be computed
watch(
  () => count.value * 2,
  (newVal) => {
    console.log('Computed value changed:', newVal);
  }
);

// DEEP_WATCHER_OVERUSE: Deep watcher on large object
watch(
  () => largeData,
  () => {
    console.log('Large data changed');
  },
  { deep: true }
);

// VUEX_GOD_STORE: Large store (simulated in component)
const store = {
  state: {
    prop1: null, prop2: null, prop3: null, prop4: null, prop5: null,
    prop6: null, prop7: null, prop8: null, prop9: null, prop10: null,
    prop11: null, prop12: null, prop13: null, prop14: null, prop15: null
  },
  mutations: {
    mut1: () => {}, mut2: () => {}, mut3: () => {}, mut4: () => {}, mut5: () => {},
    mut6: () => {}, mut7: () => {}, mut8: () => {}, mut9: () => {}, mut10: () => {},
    mut11: () => {}, mut12: () => {}, mut13: () => {}, mut14: () => {}, mut15: () => {}
  },
  actions: {
    act1: () => {}, act2: () => {}, act3: () => {}, act4: () => {}, act5: () => {},
    act6: () => {}, act7: () => {}, act8: () => {}, act9: () => {}, act10: () => {}
  },
  getters: {
    get1: () => {}, get2: () => {}, get3: () => {}, get4: () => {}, get5: () => {},
    get6: () => {}, get7: () => {}, get8: () => {}, get9: () => {}, get10: () => {}
  }
};

// PINIA_CIRCULAR_DEPENDENCY: Multiple stores in same file
const store1 = defineStore('store1', () => {
  const store2 = useStore('store2');
  return { data: store2.data };
});

const store2 = defineStore('store2', () => {
  const store1 = useStore('store1');
  return { data: store1.data };
});

// PINIA_USESTORE_AFTER_AWAIT: useStore after await
async function asyncFunction() {
  await fetch('/api/data');
  const store = useStore('mystory'); // This should be before await
}

// UNTYPED_PROVIDE_INJECT: Untyped provide/inject
provide('theme', 'dark');
provide('config', { key: 'value' }); // untyped

const theme = inject('theme'); // no default
const config = inject('config'); // no default

// INFINITE_NAVIGATION_LOOP: Navigation guard without checks
router.beforeEach((to, from, next) => {
  if (!isAuthenticated.value) {
    next('/login'); // Could cause infinite loop if /login requires auth
  }
});

// GOD_GUARD_ANTIPATTERN: Guard with multiple responsibilities
router.beforeEach((to, from, next) => {
  // Auth check
  if (!isAuthenticated.value) {
    next('/login');
    return;
  }

  // Analytics
  gtag('event', 'page_view', { page_path: to.path });

  // Logging
  console.log('Navigation:', from.path, '->', to.path);

  // Data fetching
  fetch('/api/track', { method: 'POST', body: JSON.stringify({ path: to.path }) });

  // Permission check
  if (to.meta.requiresAdmin && !userPreferences.isAdmin) {
    next('/unauthorized');
    return;
  }

  // Loading state
  const loadingStore = useStore('loading');
  loadingStore.setLoading(true);

  next();
});

// MISSING_LAZY_LOADING: Eager component imports
const routes = [
  { path: '/home', component: HomeComponent }, // Should be lazy
  { path: '/about', component: AboutComponent }, // Should be lazy
  { path: '/contact', component: ContactComponent } // Should be lazy
];

export default {
  setup() {
    return {
      users: [
        { id: 1, name: 'John', isActive: true },
        { id: 2, name: 'Jane', isActive: false }
      ],
      items: [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' }
      ],
      user: {
        firstName: 'John',
        lastName: 'Doe',
        age: 30,
        isActive: true
      },
      userInput: '<script>alert("XSS")</script>',
      largeArray: Array.from({ length: 1500 }, (_, i) => ({ id: i, name: `Item ${i}` })),
      largeData,
      props,
      emit,
      untypedRef,
      stringRef,
      undefinedRef,
      isAuthenticated,
      userPreferences,
      count,
      name,
      age,
      currentValue,
      myInput: ref(null), // template ref without proper typing
      store1,
      store2
    };
  },

  // EVENT_LISTENER_MEMORY_LEAK: Event listener without cleanup
  mounted() {
    window.addEventListener('resize', this.handleResize);
  },

  methods: {
    handleResize() {
      console.log('Window resized');
    }
  }
};
</script>

<style scoped>
/* Styles would go here */
</style>