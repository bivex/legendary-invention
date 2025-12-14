const Vue = require('./tree-sitter-vue');

console.log('🧪 Testing Vue Parser Binding');
console.log('=============================');

// Test 1: Check if the binding loads
console.log('✅ Vue binding loaded successfully');
console.log('Vue language name:', Vue.name);

// Test 2: Check node types
console.log('\n📋 Node Types Available:', Vue.nodeTypeInfo.length);
console.log('Sample node types:');
Vue.nodeTypeInfo.slice(0, 10).forEach((nodeType, index) => {
  console.log(`  ${index + 1}. ${nodeType.type}`);
});

// Test 3: Test with web-tree-sitter
async function testWithWebTreeSitter() {
  console.log('\n🌐 Testing with web-tree-sitter...');

  const { Parser } = require('web-tree-sitter');
  await Parser.init();

  const parser = new Parser();
  parser.setLanguage(Vue);

  const vueCode = `
<template>
  <div class="hello">
    <h1>{{ title }}</h1>
    <button @click="handleClick">Click me</button>
  </div>
</template>
`;

  const tree = parser.parse(vueCode);
  console.log('✅ Vue code parsed successfully');
  console.log('Root node type:', tree.rootNode.type);
  console.log('Child count:', tree.rootNode.children.length);

  // Show some of the parse tree
  console.log('\n🌳 Parse Tree Structure:');
  function printTree(node, depth = 0, maxDepth = 3) {
    if (depth > maxDepth) return;

    const indent = '  '.repeat(depth);
    const type = node.type;
    const text = node.text.length > 40 ? node.text.slice(0, 37) + '...' : node.text;
    const children = node.children?.length || 0;

    console.log(`${indent}${type}: "${text}" (${children} children)`);

    if (node.children && depth < maxDepth) {
      node.children.slice(0, 3).forEach(child => printTree(child, depth + 1, maxDepth));
    }
  }

  printTree(tree.rootNode);
}

testWithWebTreeSitter().catch(console.error);
