// Simple test for the Vue anti-pattern detector
const { VueAntiPatternDetector } = require('./index');
const fs = require('fs');

const testVueContent = `<template>
  <li v-for="user in users" v-if="user.isActive" :key="user.id">
    {{ user.name }}
  </li>
</template>

<script>
export default {
  name: 'test-component',
  props: ['users']
}
</script>`;

console.log('Testing Vue Anti-Pattern Detector...');

try {
  const detector = new VueAntiPatternDetector();

  // Let's debug the SFC parsing
  const sfc = detector.parseSFC(testVueContent);
  console.log('Template AST:', JSON.stringify(sfc.descriptor.template.ast, null, 2));

  const result = detector.analyzeFile('test.vue', testVueContent);

  console.log('\nAnalysis result:');
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
}