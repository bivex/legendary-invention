<template>
  <div>
    <!-- This should trigger VFOR_INDEX_AS_KEY -->
    <li v-for="(item, index) in items" :key="index">
      {{ item.name }}
    </li>

    <!-- This should NOT trigger (using item.id) -->
    <li v-for="(item, index) in items" :key="item.id">
      {{ item.name }}
    </li>

    <!-- This should NOT trigger (using unique id) -->
    <li v-for="(item, index) in items" :key="item.uniqueId">
      {{ item.name }}
    </li>

    <!-- Edge case: different variable names -->
    <li v-for="(user, i) in users" :key="i">
      {{ user.name }}
    </li>

    <!-- Edge case: nested index -->
    <li v-for="(item, idx) in items" :key="idx">
      <span v-for="(subItem, subIdx) in item.subItems" :key="subIdx">
        {{ subItem }}
      </span>
    </li>
  </div>
</template>

<script>
export default {
  data() {
    return {
      items: [
        { id: 1, name: 'Item 1', uniqueId: 'unique-1', subItems: ['a', 'b'] },
        { id: 2, name: 'Item 2', uniqueId: 'unique-2', subItems: ['c', 'd'] }
      ],
      users: [
        { name: 'User 1' },
        { name: 'User 2' }
      ]
    }
  }
}
</script>