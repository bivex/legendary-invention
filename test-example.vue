<template>
  <!-- VIF_WITH_VFOR: v-if and v-for on same element -->
  <li v-for="user in users" v-if="user.isActive" :key="user.id">
    {{ user.name }}
  </li>

  <!-- VFOR_WITHOUT_KEY: Missing key attribute -->
  <div v-for="item in items">
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
</template>

<script>
export default {
  name: 'TestComponent', // Good component name
  props: {
    users: Array,
    items: Array,
    userInput: String
  },
  data() {
    return {
      counter: 0,
      message: 'Hello World',
      longMessage: 'This is a very long message that might cause issues with component complexity metrics',
      anotherLongMessage: 'Another long message to increase the script length',
      yetAnotherMessage: 'Yet another message to make the component script longer',
      finalMessage: 'Final message to ensure we exceed the script length threshold'
    }
  },
  computed: {
    filteredUsers() {
      return this.users.filter(user => user.isActive)
    },
    anotherComputed() {
      return this.items.map(item => item.name.toUpperCase())
    },
    thirdComputed() {
      return this.counter * 2
    },
    fourthComputed() {
      return this.message + ' computed'
    },
    fifthComputed() {
      return this.longMessage.slice(0, 10)
    },
    sixthComputed() {
      return this.anotherLongMessage.split(' ').length
    },
    seventhComputed() {
      return this.yetAnotherMessage.includes('long')
    },
    eighthComputed() {
      return this.finalMessage.length
    },
    ninthComputed() {
      return this.counter > 5 ? 'High' : 'Low'
    },
    tenthComputed() {
      return [1, 2, 3, 4, 5].reduce((sum, num) => sum + num, 0)
    },
    eleventhComputed() {
      return this.users?.length || 0
    }
  },
  methods: {
    handleClick() {
      this.counter++
    },
    processData() {
      return this.items.map(item => ({
        ...item,
        processed: true
      }))
    },
    validateInput() {
      return this.userInput && this.userInput.length > 0
    },
    calculateTotal() {
      return this.items.reduce((total, item) => total + (item.price || 0), 0)
    },
    formatMessage() {
      return `${this.message} - ${this.counter}`
    },
    checkStatus() {
      return this.counter % 2 === 0 ? 'even' : 'odd'
    },
    generateId() {
      return Math.random().toString(36).substr(2, 9)
    },
    logEvent() {
      console.log('Event logged', this.counter)
    },
    resetCounter() {
      this.counter = 0
    },
    toggleMessage() {
      this.message = this.message === 'Hello World' ? 'Goodbye World' : 'Hello World'
    },
    complexCalculation() {
      let result = 0
      for (let i = 0; i < this.counter; i++) {
        result += i * 2
      }
      return result
    },
    asyncMethod() {
      return new Promise(resolve => {
        setTimeout(() => resolve('done'), 100)
      })
    },
    anotherMethod() {
      return this.items.filter(item => item.active).length
    },
    finalMethod() {
      return {
        counter: this.counter,
        message: this.message,
        itemsCount: this.items?.length || 0
      }
    },
    lastMethod() {
      const data = this.processData()
      const total = this.calculateTotal()
      return { data, total }
    }
  },
  mounted() {
    // Event listener without cleanup - potential memory leak
    window.addEventListener('resize', this.handleResize)
  },
  methods: {
    ...this.methods, // Duplicate methods definition - this will cause issues
    handleResize() {
      console.log('Window resized')
    }
  }
}
</script>

<style scoped>
.test-component {
  padding: 20px;
}

.deep-nested {
  color: red;
}
</style>