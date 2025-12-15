<template>
  <div class="user-list">
    <!-- This is a clean, well-structured Vue component -->
    <h1>{{ title }}</h1>

    <div v-for="user in filteredUsers" :key="user.id" class="user-item">
      <span>{{ user.name }}</span>
      <button @click="selectUser(user)">Select</button>
    </div>

    <p v-if="selectedUser">Selected: {{ selectedUser.name }}</p>
  </div>
</template>

<script>
export default {
  name: 'UserList',
  props: {
    users: {
      type: Array,
      required: true
    },
    title: {
      type: String,
      default: 'Users'
    }
  },
  emits: ['user-selected'],
  data() {
    return {
      selectedUser: null
    }
  },
  computed: {
    filteredUsers() {
      return this.users.filter(user => user.active)
    }
  },
  methods: {
    selectUser(user) {
      this.selectedUser = user
      this.$emit('user-selected', user)
    }
  }
}
</script>

<style scoped>
.user-list {
  max-width: 400px;
  margin: 0 auto;
}

.user-item {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  border: 1px solid #ddd;
  margin: 5px 0;
  border-radius: 4px;
}

button {
  background: #007bff;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 3px;
  cursor: pointer;
}
</style>