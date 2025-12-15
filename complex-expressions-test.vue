<template>
  <div>
    <!-- COMPLEX_TEMPLATE_EXPRESSION: Very long expressions -->
    <p>{{ user.name + ' ' + user.surname + ' (' + user.age + ' years old)' + (user.isActive ? ' - Active' : ' - Inactive') }}</p>

    <!-- COMPLEX_TEMPLATE_EXPRESSION: Deep method chaining -->
    <p>{{ formatDate(getUserById(userId).profile.birthDate).toUpperCase().substring(0, 10) }}</p>

    <!-- COMPLEX_TEMPLATE_EXPRESSION: Complex conditional with functions -->
    <p>{{ isUserAdult(user) && hasPermission(user, 'read') ? getDisplayName(user) : 'Access Denied' }}</p>

    <!-- COMPLEX_TEMPLATE_EXPRESSION: Multiple operations -->
    <div>{{ (items.length > 0 ? items.filter(i => i.active).map(i => i.value).reduce((a, b) => a + b, 0) / items.length : 0).toFixed(2) }}</div>

    <!-- COMPLEX_TEMPLATE_EXPRESSION: Function definition (should be CRITICAL) -->
    <p>{{ (() => { const result = computeScore(user); return result > 80 ? 'Excellent' : result > 60 ? 'Good' : 'Poor'; })() }}</p>

    <!-- COMPLEX_TEMPLATE_EXPRESSION: Very long chained calls -->
    <span>{{ getData().filter(x => x.valid).map(x => x.transform()).sort((a,b) => a.value - b.value).slice(0, 5).join(', ') }}</span>

    <!-- These should NOT trigger (short expressions) -->
    <p>{{ user.name }}</p>
    <p>{{ count + 1 }}</p>
    <p>{{ isActive ? 'Yes' : 'No' }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      user: {
        name: 'John',
        surname: 'Doe',
        age: 30,
        isActive: true
      },
      userId: 123,
      items: [
        { active: true, value: 10 },
        { active: false, value: 20 },
        { active: true, value: 15 }
      ]
    }
  },
  methods: {
    formatDate(date) {
      return new Date(date).toLocaleDateString();
    },
    getUserById(id) {
      return { profile: { birthDate: '1990-01-01' } };
    },
    isUserAdult(user) {
      return user.age >= 18;
    },
    hasPermission(user, permission) {
      return user.permissions?.includes(permission);
    },
    getDisplayName(user) {
      return `${user.name} ${user.surname}`;
    },
    computeScore(user) {
      return Math.random() * 100;
    },
    getData() {
      return [
        { valid: true, transform: () => ({ value: 1 }) },
        { valid: false, transform: () => ({ value: 2 }) },
        { valid: true, transform: () => ({ value: 3 }) }
      ];
    }
  }
}
</script>