/**
 * Core anti-pattern detection engine for Vue.js
 * Based on formal Z-notation specifications from formal_notation.md
 */

class VueAntiPatternDetector {
  constructor(options = {}) {
    this.options = {
      thresholds: options.thresholds || this.getDefaultThresholds(),
      verbose: options.verbose || false,
      ...options
    };

    this.results = [];
    this.detectors = this.initializeDetectors();
  }

  getDefaultThresholds() {
    return {
      // Template anti-patterns
      templateExpressionLength: 40,
      templateDepth: 6,
      deepTemplateDepth: 10,

      // Component architecture
      componentScriptLength: 500,
      componentMethodCount: 20,
      componentPropsCount: 15,
      componentComputedCount: 10,
      componentTemplateDepth: 6,

      // Performance
      virtualizationThreshold: 500,
      shallowReactivityThreshold: 1000,
      bundleContributionThreshold: 5,

      // State management
      vuexStateProperties: 20,
      vuexMutations: 20,
      vuexActions: 15,
      vuexGetters: 20,

      // Testing
      snapshotTestRatio: 0.5,

      // TypeScript
      typeCoverageThreshold: 95,
      anyUsageThreshold: 0.02
    };
  }

  initializeDetectors() {
    return {
      // Template anti-patterns
      VIF_WITH_VFOR: this.detectVIfWithVFor.bind(this),
      VFOR_WITHOUT_KEY: this.detectVForWithoutKey.bind(this),
      VFOR_INDEX_AS_KEY: this.detectVForIndexAsKey.bind(this),
      COMPLEX_TEMPLATE_EXPRESSION: this.detectComplexTemplateExpression.bind(this),
      VHTML_XSS_RISK: this.detectVHtmlXssRisk.bind(this),
      DEEP_TEMPLATE_NESTING: this.detectDeepTemplateNesting.bind(this),

      // Component architecture
      GOD_COMPONENT: this.detectGodComponent.bind(this),
      SINGLE_WORD_COMPONENT_NAME: this.detectSingleWordComponentName.bind(this),
      PROP_DRILLING: this.detectPropDrilling.bind(this),
      TIGHT_COUPLING: this.detectTightCoupling.bind(this),

      // Reactivity system
      REF_REACTIVE_CONFUSION: this.detectRefReactiveConfusion.bind(this),
      DESTRUCTURING_REACTIVITY_LOSS: this.detectDestructuringReactivityLoss.bind(this),
      COMPUTED_SIDE_EFFECTS: this.detectComputedSideEffects.bind(this),
      DEEP_WATCHER_OVERUSE: this.detectDeepWatcherOveruse.bind(this),
      WATCHER_SHOULD_BE_COMPUTED: this.detectWatcherShouldBeComputed.bind(this),

      // State management
      VUEX_ASYNC_IN_MUTATION: this.detectVuexAsyncInMutation.bind(this),
      VUEX_GOD_STORE: this.detectVuexGodStore.bind(this),
      PINIA_CIRCULAR_DEPENDENCY: this.detectPiniaCircularDependency.bind(this),
      PINIA_USESTORE_AFTER_AWAIT: this.detectPiniaUseStoreAfterAwait.bind(this),
      STATE_LOCALIZATION_ANTIPATTERN: this.detectStateLocalizationAntipattern.bind(this),
      UNTYPED_PROVIDE_INJECT: this.detectUntypedProvideInject.bind(this),

      // Vue Router
      INFINITE_NAVIGATION_LOOP: this.detectInfiniteNavigationLoop.bind(this),
      MISSING_LAZY_LOADING: this.detectMissingLazyLoading.bind(this),
      GOD_GUARD_ANTIPATTERN: this.detectGodGuardAntipattern.bind(this),

      // Performance
      LARGE_LIST_NO_VIRTUALIZATION: this.detectLargeListNoVirtualization.bind(this),
      MISSING_SHALLOW_REACTIVITY: this.detectMissingShallowReactivity.bind(this),
      EVENT_LISTENER_MEMORY_LEAK: this.detectEventListenerMemoryLeak.bind(this),
      FULL_LIBRARY_IMPORT: this.detectFullLibraryImport.bind(this),

      // TypeScript
      UNTYPED_PROPS: this.detectUntypedProps.bind(this),
      UNTYPED_EMITS: this.detectUntypedEmits.bind(this),
      REF_TYPE_INFERENCE_ISSUES: this.detectRefTypeInferenceIssues.bind(this),

      // Testing
      IMPLEMENTATION_TESTING: this.detectImplementationTesting.bind(this),
      PINIA_STATE_LEAK: this.detectPiniaStateLeak.bind(this),
      SNAPSHOT_OVERUSE: this.detectSnapshotOveruse.bind(this)
    };
  }

  /**
   * Analyze a Vue SFC file
   * @param {string} filePath - Path to the Vue file
   * @param {string} content - File content
   */
  analyzeFile(filePath, content) {
    try {
      const sfc = this.parseSFC(content);
      const issues = [];

      // Run all detectors
      Object.entries(this.detectors).forEach(([patternName, detector]) => {
        const patternIssues = detector(sfc, filePath);
        if (patternIssues && patternIssues.length > 0) {
          issues.push(...patternIssues);
        }
      });

      return {
        filePath,
        issues: issues.sort((a, b) => this.getSeverityWeight(b.severity) - this.getSeverityWeight(a.severity))
      };
    } catch (error) {
      return {
        filePath,
        issues: [{
          pattern: 'PARSE_ERROR',
          severity: 'CRITICAL',
          message: `Failed to parse Vue SFC: ${error.message}`,
          location: { line: 1, column: 1 }
        }]
      };
    }
  }

  /**
   * Parse Vue SFC using @vue/compiler-sfc
   */
  parseSFC(content) {
    const { parse } = require('@vue/compiler-sfc');
    return parse(content);
  }

  /**
   * Get severity weight for sorting
   */
  getSeverityWeight(severity) {
    const weights = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    return weights[severity] || 0;
  }

  /**
   * Template anti-pattern detectors
   */

  detectVIfWithVFor(sfc, filePath) {
    const issues = [];
    const template = sfc.descriptor.template;

    if (!template) return issues;

    this.traverseTemplate(template.ast, (node) => {
      if (node.type === 1 && this.hasDirective(node, 'for') && this.hasDirective(node, 'if')) {
        issues.push({
          pattern: 'VIF_WITH_VFOR',
          severity: 'CRITICAL',
          message: 'Using v-if and v-for on the same element creates undefined behavior',
          location: this.getNodeLocation(node),
          refactoring: '<li v-for="user in users" v-if="user.isActive"> → <li v-for="user in activeUsers"> where activeUsers = computed(() => users.filter(u => u.isActive))'
        });
      }
    });

    return issues;
  }

  detectVForWithoutKey(sfc, filePath) {
    const issues = [];
    const template = sfc.descriptor.template;

    if (!template) return issues;

    this.traverseTemplate(template.ast, (node) => {
      if (node.type === 1 && this.hasDirective(node, 'for')) {
        // Check if element has :key (v-bind:key directive) or key attribute
        const hasKeyDirective = node.props && node.props.some(prop =>
          prop.type === 7 && prop.name === 'bind' && prop.arg?.content === 'key'
        );
        const hasKeyAttribute = node.props && node.props.some(prop =>
          prop.type === 6 && prop.name === 'key'
        );

        if (!hasKeyDirective && !hasKeyAttribute) {
          const severity = filePath.includes('component') ? 'CRITICAL' : 'HIGH';
          issues.push({
            pattern: 'VFOR_WITHOUT_KEY',
            severity,
            message: 'Missing :key attribute in v-for iteration',
            location: this.getNodeLocation(node),
            refactoring: 'Add :key="uniqueId" to the iterated element'
          });
        }
      }
    });

    return issues;
  }

  detectVForIndexAsKey(sfc, filePath) {
    const issues = [];
    const template = sfc.descriptor.template;

    if (!template) return issues;

    this.traverseTemplate(template.ast, (node) => {
      if (node.type === 1 && this.hasDirective(node, 'for')) {
        // Find the key directive (v-bind:key)
        const keyDirective = node.props && node.props.find(prop =>
          prop.type === 7 && prop.name === 'bind' && prop.arg?.content === 'key'
        );
        const forDirective = this.getDirective(node, 'for');

        if (keyDirective && forDirective) {
          // Extract the index variable from v-for directive
          const forContent = forDirective.exp?.content || forDirective.value?.content || forDirective.value;
          const forMatch = forContent?.match(/\(.*,\s*(\w+)\)/);
          if (forMatch) {
            const indexVar = forMatch[1];
            // Check if the key value matches the index variable
            const keyContent = keyDirective.exp?.content || keyDirective.value?.content || keyDirective.value;
            if (keyContent === indexVar) {
              issues.push({
                pattern: 'VFOR_INDEX_AS_KEY',
                severity: 'HIGH',
                message: 'Using array index as v-for key causes incorrect component reuse',
                location: this.getNodeLocation(node),
                refactoring: 'Use unique identifier instead of array index for :key'
              });
            }
          }
        }
      }
    });

    return issues;
  }

  detectComplexTemplateExpression(sfc, filePath) {
    const issues = [];
    const template = sfc.descriptor.template;

    if (!template) return issues;

    this.traverseTemplate(template.ast, (node) => {
      if (node.type === 5) { // Interpolation
        const expression = node.content?.content || node.content;
        const charCount = expression.length;
        const hasChain = expression.includes('.');
        const hasConditional = expression.includes('?') || expression.includes('&&') || expression.includes('||');
        const hasFunction = expression.includes('(') && expression.includes(')');

        let severity = 'LOW';
        if (charCount > this.options.thresholds.templateExpressionLength || hasFunction) {
          severity = 'CRITICAL';
        } else if (charCount > 80 || (hasChain && (expression.split('.').length > 2))) {
          severity = 'HIGH';
        } else if (charCount > 50 || hasConditional) {
          severity = 'MEDIUM';
        }

        if (severity !== 'LOW') {
          issues.push({
            pattern: 'COMPLEX_TEMPLATE_EXPRESSION',
            severity,
            message: `Complex template expression (${charCount} chars) violates separation of concerns`,
            location: this.getNodeLocation(node),
            refactoring: 'Move complex logic to computed property or method'
          });
        }
      }
    });

    return issues;
  }

  detectVHtmlXssRisk(sfc, filePath) {
    const issues = [];
    const template = sfc.descriptor.template;

    if (!template) return issues;

    this.traverseTemplate(template.ast, (node) => {
      if (node.type === 1 && node.props && node.props.some(prop =>
        prop.type === 7 && prop.rawName === 'v-html'
      )) {
        const vHtmlAttr = node.props.find(prop =>
          prop.type === 7 && prop.rawName === 'v-html'
        );
        const severity = this.isDynamicContent(vHtmlAttr.value) ? 'CRITICAL' : 'HIGH';

        issues.push({
          pattern: 'VHTML_XSS_RISK',
          severity,
          message: 'Using v-html with dynamic content creates XSS vulnerability',
          location: this.getNodeLocation(node),
          refactoring: 'Use text interpolation or sanitize content before using v-html'
        });
      }
    });

    return issues;
  }

  detectDeepTemplateNesting(sfc, filePath) {
    const issues = [];
    const template = sfc.descriptor.template;

    if (!template) return issues;

    const maxDepth = this.getMaxTemplateDepth(template.ast);

    if (maxDepth > this.options.thresholds.templateDepth) {
      const severity = maxDepth > this.options.thresholds.deepTemplateDepth ? 'CRITICAL' :
                      maxDepth > 7 ? 'HIGH' : 'MEDIUM';

      issues.push({
        pattern: 'DEEP_TEMPLATE_NESTING',
        severity,
        message: `Template nesting depth of ${maxDepth} exceeds recommended limit`,
        location: { line: 1, column: 1 },
        refactoring: 'Extract nested content into separate components'
      });
    }

    return issues;
  }

  /**
   * Component architecture detectors
   */

  detectGodComponent(sfc, filePath) {
    const issues = [];
    const script = sfc.descriptor.script;
    const template = sfc.descriptor.template;

    if (!script) return issues;

    // Analyze script content
    const scriptContent = script.content || '';
    const scriptLines = scriptContent.split('\n').length;

    // Count methods, props, computed properties
    const methodMatches = scriptContent.match(/methods:\s*{[^}]*}/g) || [];
    const methodCount = (scriptContent.match(/(\w+)\([^)]*\)\s*{/g) || []).length;

    const propMatches = scriptContent.match(/props:\s*\[([^\]]*)\]/g) || [];
    const propsCount = propMatches.length > 0 ?
      propMatches[0].match(/'/g)?.length / 2 || 0 : 0;

    const computedMatches = scriptContent.match(/computed:\s*{([^}]*)}/g) || [];
    const computedCount = computedMatches.length > 0 ?
      (computedMatches[0].match(/(\w+):/g) || []).length : 0;

    const templateDepth = template ? this.getMaxTemplateDepth(template.ast) : 0;

    // Check thresholds
    const violations = [];
    if (scriptLines > this.options.thresholds.componentScriptLength) violations.push(`Script LOC: ${scriptLines}`);
    if (methodCount > this.options.thresholds.componentMethodCount) violations.push(`Methods: ${methodCount}`);
    if (propsCount > this.options.thresholds.componentPropsCount) violations.push(`Props: ${propsCount}`);
    if (computedCount > this.options.thresholds.componentComputedCount) violations.push(`Computed: ${computedCount}`);
    if (templateDepth > this.options.thresholds.componentTemplateDepth) violations.push(`Template depth: ${templateDepth}`);

    if (violations.length > 0) {
      const severity = violations.length > 3 ? 'CRITICAL' :
                      violations.length > 2 ? 'HIGH' : 'MEDIUM';

      issues.push({
        pattern: 'GOD_COMPONENT',
        severity,
        message: `God component detected: ${violations.join(', ')}`,
        location: { line: 1, column: 1 },
        refactoring: 'Split component into smaller, focused components'
      });
    }

    return issues;
  }

  detectSingleWordComponentName(sfc, filePath) {
    const issues = [];

    // Extract component name from file path or script content
    const componentName = this.extractComponentName(sfc, filePath);

    // HTML elements are lowercase single words
    // PascalCase or camelCase component names don't conflict with HTML elements
    const isLowercaseSingleWord = componentName &&
                                   componentName !== 'App' &&
                                   componentName === componentName.toLowerCase() &&
                                   !componentName.includes('-') &&
                                   !componentName.includes('_');

    if (isLowercaseSingleWord) {
      // Check if it's actually an HTML element
      const htmlElements = ['div', 'span', 'input', 'button', 'form', 'table', 'tr', 'td', 'th', 'ul', 'li', 'ol', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'img', 'select', 'option', 'textarea', 'label', 'section', 'article', 'header', 'footer', 'nav', 'aside', 'main'];
      if (htmlElements.includes(componentName.toLowerCase())) {
        issues.push({
          pattern: 'SINGLE_WORD_COMPONENT_NAME',
          severity: 'CRITICAL',
          message: `Component name '${componentName}' conflicts with HTML element`,
          location: { line: 1, column: 1 },
          refactoring: `Rename to '${componentName}Component' or use PascalCase`
        });
      }
    }

    return issues;
  }

  /**
   * Utility methods
   */

  traverseTemplate(node, callback) {
    if (!node) return;

    // Call callback on current node
    callback(node);

    // For template fragments (type 0), traverse children
    if (node.type === 0 && node.children) {
      node.children.forEach(child => this.traverseTemplate(child, callback));
    }
    // For elements (type 1), traverse children
    else if (node.type === 1 && node.children) {
      node.children.forEach(child => this.traverseTemplate(child, callback));
    }
  }

  hasDirective(node, directiveName) {
    return node.props && node.props.some(prop =>
      prop.type === 7 && prop.name === directiveName
    );
  }

  getDirective(node, directiveName) {
    return node.props && node.props.find(prop =>
      prop.type === 7 && prop.name === directiveName
    );
  }

  hasAttribute(node, attrName) {
    return node.props && node.props.some(prop =>
      prop.type === 6 && prop.name === attrName
    );
  }

  getAttribute(node, attrName) {
    return node.props && node.props.find(prop =>
      prop.type === 6 && prop.name === attrName
    );
  }

  getNodeLocation(node) {
    return {
      line: node.loc?.start?.line || 1,
      column: node.loc?.start?.column || 1
    };
  }

  isDynamicContent(content) {
    // Simple heuristic - if it contains variables or function calls
    return content && (content.includes('{{') || content.includes('$') || content.includes('('));
  }

  getMaxTemplateDepth(node, currentDepth = 0) {
    if (!node) return currentDepth;

    let maxDepth = currentDepth;

    if (node.children) {
      node.children.forEach(child => {
        if (child.type === 1) { // Element node
          maxDepth = Math.max(maxDepth, this.getMaxTemplateDepth(child, currentDepth + 1));
        }
      });
    }

    return maxDepth;
  }

  extractComponentName(sfc, filePath) {
    // Try to extract from script content first
    const script = sfc.descriptor.script;
    if (script && script.content) {
      const nameMatch = script.content.match(/name:\s*['"]([^'"]+)['"]/);
      if (nameMatch) return nameMatch[1];
    }

    // Fallback to filename
    const fileName = filePath.split('/').pop().replace('.vue', '');
    // Convert kebab-case to PascalCase for component naming
    return fileName
      .split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
  }

  extractPropsDefinition(scriptContent) {
    const props = new Set();

    // Match various prop definition patterns
    const patterns = [
      // Array syntax: props: ['prop1', 'prop2']
      /props:\s*\[([^\]]*)\]/g,
      // Object syntax: props: { prop1: String, prop2: { type: Number } }
      /props:\s*{([^}]*)}/g,
      // Composition API: defineProps({ ... })
      /defineProps\(\s*{([^}]*)}\s*\)/g,
      // Composition API with types: defineProps<...>({ ... })
      /defineProps<[^>]+>\(\s*{([^}]*)}\s*\)/g
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(scriptContent)) !== null) {
        const propsContent = match[1];

        // Extract prop names from different formats
        if (pattern.source.includes('defineProps') || pattern.source.includes('Object')) {
          // Object format: prop1: String, prop2: { type: Number }
          const propMatches = propsContent.match(/(\w+):/g);
          if (propMatches) {
            propMatches.forEach(propMatch => {
              const propName = propMatch.replace(':', '');
              props.add(propName);
            });
          }
        } else {
          // Array format: 'prop1', 'prop2'
          const propMatches = propsContent.match(/['"]([^'"]+)['"]/g);
          if (propMatches) {
            propMatches.forEach(propMatch => {
              const propName = propMatch.replace(/['"]/g, '');
              props.add(propName);
            });
          }
        }
      }
    });

    return Array.from(props);
  }

  extractTemplatePropUsage(template) {
    const usedProps = new Set();

    if (!template || !template.ast) return usedProps;

    this.traverseTemplate(template.ast, (node) => {
      if (node.type === 1) { // Element node
        // Check for prop passing in component attributes
        if (node.props) {
          node.props.forEach(prop => {
            if (prop.type === 6 && prop.name.startsWith(':')) { // Bound attribute
              // Extract prop usage like :prop="someProp"
              const propValue = prop.value?.content;
              if (propValue && !propValue.includes('$') && !propValue.includes('"') && !propValue.includes("'")) {
                // Simple prop pass-through like :title="title"
                usedProps.add(propValue);
              }
            }
          });
        }
      }
    });

    return usedProps;
  }

  extractScriptPropUsage(scriptContent, props) {
    const usedProps = new Set();

    props.forEach(prop => {
      // Check if prop is used in script (simple heuristic)
      const propRegex = new RegExp(`\\b${prop}\\b`, 'g');
      if (propRegex.test(scriptContent)) {
        usedProps.add(prop);
      }
    });

    return usedProps;
  }

  detectPropMutations(scriptContent) {
    const mutations = [];
    const propsDefinition = this.extractPropsDefinition(scriptContent);

    propsDefinition.forEach(prop => {
      // Look for assignment patterns that mutate props
      const patterns = [
        // Direct assignment: this.propName = value
        new RegExp(`\\bthis\\.${prop}\\s*=[^=]`, 'g'),
        // Increment/decrement: this.propName++
        new RegExp(`\\bthis\\.${prop}\\s*\\+\\+`, 'g'),
        new RegExp(`\\bthis\\.${prop}\\s*--`, 'g'),
        // Compound assignment: this.propName +=
        new RegExp(`\\bthis\\.${prop}\\s*\\+=`, 'g'),
        new RegExp(`\\bthis\\.${prop}\\s*-=`, 'g'),
        new RegExp(`\\bthis\\.${prop}\\s*\\*=`, 'g'),
        new RegExp(`\\bthis\\.${prop}\\s*\/=`, 'g'),
      ];

      patterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(scriptContent)) !== null) {
          mutations.push({
            prop,
            mutation: match[0].trim(),
            location: this.getLineColumnFromIndex(scriptContent, match.index)
          });
        }
      });
    });

    return mutations;
  }

  findPatternLocation(content, pattern) {
    const regex = new RegExp(pattern, 'g');
    const match = regex.exec(content);
    if (match) {
      return this.getLineColumnFromIndex(content, match.index);
    }
    return { line: 1, column: 1 };
  }

  getLineColumnFromIndex(content, index) {
    const lines = content.substring(0, index).split('\n');
    const line = lines.length;
    const column = lines[lines.length - 1].length + 1;
    return { line, column };
  }

  analyzeComputedSideEffects(computedBody) {
    const sideEffects = [];

    // Check for state mutations
    const mutationPatterns = [
      /\bthis\.\w+\s*=[^=]/g,  // Direct assignment
      /\bthis\.\w+\s*\+\+|\bthis\.\w+\s*--/g,  // Increment/decrement
      /\bthis\.\w+\s*\+=|\bthis\.\w+\s*-=|\bthis\.\w+\s*\*=|\bthis\.\w+\s*\/=/g  // Compound assignment
    ];

    mutationPatterns.forEach(pattern => {
      if (pattern.test(computedBody)) {
        sideEffects.push({
          type: 'mutation',
          description: 'state mutation'
        });
      }
    });

    // Check for async operations
    const asyncPatterns = [
      /\basync\b/g,
      /\bawait\b/g,
      /\bPromise\b/g,
      /\bsetTimeout\b/g,
      /\bsetInterval\b/g,
      /\bfetch\b/g,
      /\baxios\b/g,
      /\$\.ajax\b/g,
      /\bXMLHttpRequest\b/g
    ];

    asyncPatterns.forEach(pattern => {
      if (pattern.test(computedBody)) {
        sideEffects.push({
          type: 'async',
          description: 'async operation'
        });
      }
    });

    // Check for DOM manipulation
    const domPatterns = [
      /\bdocument\./g,
      /\bwindow\./g,
      /\bgetElementById\b/g,
      /\bquerySelector\b/g,
      /\baddEventListener\b/g,
      /\bremoveEventListener\b/g,
      /\binnerHTML\b/g,
      /\bstyle\./g,
      /\bclassList\./g
    ];

    domPatterns.forEach(pattern => {
      if (pattern.test(computedBody)) {
        sideEffects.push({
          type: 'dom',
          description: 'DOM manipulation'
        });
      }
    });

    // Check for method calls that might have side effects
    const methodCallPatterns = [
      /\bthis\.\w+\(\)/g,  // Method calls
      /\bconsole\./g,      // Console logging
      /\blocalStorage\./g, // Local storage access
      /\bsessionStorage\./g // Session storage access
    ];

    methodCallPatterns.forEach(pattern => {
      if (pattern.test(computedBody)) {
        sideEffects.push({
          type: 'method_call',
          description: 'method call with potential side effects'
        });
      }
    });

    // Remove duplicates
    const uniqueSideEffects = sideEffects.filter((se, index, arr) =>
      arr.findIndex(s => s.type === se.type) === index
    );

    return uniqueSideEffects;
  }

  analyzeMutationsForAsync(mutationsBlock) {
    const asyncMutations = [];

    // Extract individual mutation functions
    const mutationRegex = /(\w+)\s*\([^}]*\)\s*{([^}]*)}/g;
    let match;

    while ((match = mutationRegex.exec(mutationsBlock)) !== null) {
      const mutationName = match[1];
      const mutationBody = match[2];
      const mutationIndex = match.index;

      // Check for async patterns
      const asyncPatterns = [
        /\basync\b/g,
        /\bawait\b/g,
        /\bPromise\b/g,
        /\bsetTimeout\b/g,
        /\bsetInterval\b/g,
        /\bfetch\b/g,
        /\baxios\b/g,
        /\$\.ajax\b/g,
        /\bXMLHttpRequest\b/g,
        /\bthen\b/g,  // Promise chaining
        /\bcatch\b/g, // Promise error handling
        /\bfinally\b/g // Promise finally
      ];

      let hasAsync = false;
      asyncPatterns.forEach(pattern => {
        if (pattern.test(mutationBody)) {
          hasAsync = true;
        }
      });

      if (hasAsync) {
        asyncMutations.push({
          name: mutationName,
          body: mutationBody,
          index: mutationIndex
        });
      }
    }

    return asyncMutations;
  }

  extractCleanupHooks(scriptContent) {
    const cleanupHooks = {
      compositionApi: [],
      optionsApi: []
    };

    // Composition API: onUnmounted, onBeforeUnmount
    const compositionCleanupPattern = /(onUnmounted|onBeforeUnmount)\(\s*\(\)\s*=>\s*{([^}]*)}\s*\)/g;
    let match;

    while ((match = compositionCleanupPattern.exec(scriptContent)) !== null) {
      cleanupHooks.compositionApi.push({
        type: match[1],
        body: match[2],
        index: match.index
      });
    }

    // Options API: beforeDestroy, destroyed
    const optionsCleanupPattern = /(beforeDestroy|destroyed)\(\)\s*{([^}]*)}/g;

    while ((match = optionsCleanupPattern.exec(scriptContent)) !== null) {
      cleanupHooks.optionsApi.push({
        type: match[1],
        body: match[2],
        index: match.index
      });
    }

    return cleanupHooks;
  }

  hasMatchingCleanup(listener, cleanupHooks) {
    const removePattern = new RegExp(`removeEventListener\\(\\s*['"]${listener.event}['"]\\s*,\\s*${this.escapeRegex(listener.handler)}`, 'g');

    // Check Composition API cleanup hooks
    for (const hook of cleanupHooks.compositionApi) {
      if (removePattern.test(hook.body)) {
        return true;
      }
    }

    // Check Options API cleanup hooks
    for (const hook of cleanupHooks.optionsApi) {
      if (removePattern.test(hook.body)) {
        return true;
      }
    }

    return false;
  }

  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  detectVirtualizationLibraries(scriptContent) {
    const virtualizationLibs = [
      'vue-virtual-scroller',
      'vue-virtual-scroll-list',
      'virtual-list',
      '@tanstack/vue-virtual',
      'vue3-virtual-scroll-list'
    ];

    return virtualizationLibs.some(lib =>
      scriptContent.includes(`from '${lib}'`) ||
      scriptContent.includes(`from "${lib}"`) ||
      scriptContent.includes(`require('${lib}')`) ||
      scriptContent.includes(`require("${lib}")`)
    );
  }

  estimateListSize(vForExpression, scriptContent) {
    // Handle common patterns: "item in items", "item, index in items", "(item, index) in items"
    const inMatch = vForExpression.match(/\s+in\s+(.+)$/);
    if (!inMatch) return 0;

    const listExpression = inMatch[1].trim();

    // Check for static array literals
    const arrayMatch = listExpression.match(/^\[([^\]]+)\]$/);
    if (arrayMatch) {
      const items = arrayMatch[1].split(',');
      return items.length;
    }

    // Check for Array.from({length: N}) or similar range patterns
    const arrayFromMatch = listExpression.match(/Array\.from\(\s*\{\s*length:\s*(\d+)\s*\}/);
    if (arrayFromMatch) {
      return parseInt(arrayFromMatch[1]);
    }

    // Check for range functions or common patterns
    const rangeMatch = listExpression.match(/(\d+)\s*to\s*(\d+)/);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1]);
      const end = parseInt(rangeMatch[2]);
      return Math.abs(end - start) + 1;
    }

    // Check for numeric literals in script
    const numericLiteral = listExpression.match(/^(\d+)$/);
    if (numericLiteral) {
      return parseInt(numericLiteral[1]);
    }

    // Check for computed properties or data that might be large
    // Look for variable declarations that might indicate size
    const variablePatterns = [
      new RegExp(`const\\s+${this.escapeRegex(listExpression)}\\s*=\\s*\\[([^\\]]+)\\]`, 'g'),
      new RegExp(`${this.escapeRegex(listExpression)}\\s*=\\s*\\[([^\\]]+)\\]`, 'g'),
      new RegExp(`const\\s+${this.escapeRegex(listExpression)}\\s*=\\s*Array\\.from\\(\\{length:\\s*(\\d+)`, 'g'),
      new RegExp(`${this.escapeRegex(listExpression)}\\s*=\\s*Array\\.from\\(\\{length:\\s*(\\d+)`, 'g')
    ];

    for (const pattern of variablePatterns) {
      const match = pattern.exec(scriptContent);
      if (match) {
        if (match[1].includes(',')) {
          // Array literal
          const items = match[1].split(',');
          return items.length;
        } else if (match[1]) {
          // Array.from length
          const size = parseInt(match[1]);
          if (!isNaN(size)) return size;
        }
      }
    }

    // Default estimates for common variable names that might be large
    const largeListNames = ['items', 'data', 'list', 'collection', 'array', 'records', 'rows'];
    if (largeListNames.some(name => listExpression.toLowerCase().includes(name))) {
      // Conservative estimate for potentially large lists
      return 200;
    }

    return 0;
  }

  isShallowReactive(scriptContent, position) {
    // Check if the reactive call is preceded by 'shallow'
    const beforeMatch = scriptContent.substring(0, position);
    const afterMatch = scriptContent.substring(position);

    // Check for shallowRef, shallowReactive
    return beforeMatch.match(/\bshallow(Ref|Reactive)\s*$/) ||
           afterMatch.match(/^\s*\bshallow(Ref|Reactive)\b/);
  }

  estimateDataStructureSize(dataExpression, scriptContent) {
    // Remove whitespace and simplify
    const expr = dataExpression.trim();

    // Check for array literals
    const arrayMatch = expr.match(/^\[([^\]]*)\]$/);
    if (arrayMatch) {
      const items = arrayMatch[1].split(',');
      return items.length;
    }

    // Check for object literals with property counting
    const objectMatch = expr.match(/^\{([^}]*)\}$/);
    if (objectMatch) {
      const properties = objectMatch[1].split(',');
      const propertyCount = properties.filter(prop => prop.trim().length > 0).length;
      return propertyCount;
    }

    // Check for Array.from with length
    const arrayFromMatch = expr.match(/Array\.from\(\s*\{\s*length:\s*(\d+)/);
    if (arrayFromMatch) {
      return parseInt(arrayFromMatch[1]);
    }

    // Check for new Array(length)
    const newArrayMatch = expr.match(/new\s+Array\(\s*(\d+)/);
    if (newArrayMatch) {
      return parseInt(newArrayMatch[1]);
    }

    // Check for variable references that might be large
    // Look for variable declarations in the script
    const variableMatch = expr.match(/^(\w+)$/);
    if (variableMatch) {
      const varName = variableMatch[1];

      // Look for the variable declaration
      const declarationPatterns = [
        new RegExp(`const\\s+${this.escapeRegex(varName)}\\s*=\\s*\\[([^\\]]*)\\]`, 'g'),
        new RegExp(`let\\s+${this.escapeRegex(varName)}\\s*=\\s*\\[([^\\]]*)\\]`, 'g'),
        new RegExp(`var\\s+${this.escapeRegex(varName)}\\s*=\\s*\\[([^\\]]*)\\]`, 'g'),
        new RegExp(`const\\s+${this.escapeRegex(varName)}\\s*=\\s*\{([^}]*)\\}`, 'g'),
        new RegExp(`let\\s+${this.escapeRegex(varName)}\\s*=\\s*\{([^}]*)\\}`, 'g'),
        new RegExp(`var\\s+${this.escapeRegex(varName)}\\s*=\\s*\{([^}]*)\\}`, 'g')
      ];

      for (const pattern of declarationPatterns) {
        const match = pattern.exec(scriptContent);
        if (match) {
          const content = match[1];
          if (content.includes(',')) {
            // Array or object with commas
            const items = content.split(',');
            return items.length;
          }
        }
      }

      // Check for common large data variable names
      const largeDataNames = ['data', 'items', 'list', 'collection', 'records', 'rows', 'dataset', 'tableData'];
      if (largeDataNames.includes(varName.toLowerCase())) {
        return 1000; // Conservative estimate
      }
    }

    return 0;
  }

  detectPropDrilling(sfc, filePath) {
    const issues = [];
    const script = sfc.descriptor.script;
    const template = sfc.descriptor.template;

    if (!script || !script.content) return issues;

    const scriptContent = script.content;

    // Extract props definition
    const propsDefinition = this.extractPropsDefinition(scriptContent);
    if (!propsDefinition || propsDefinition.length === 0) return issues;

    // Find props that are only passed through in template without being used in script
    const templatePropUsage = this.extractTemplatePropUsage(template);
    const scriptPropUsage = this.extractScriptPropUsage(scriptContent, propsDefinition);

    // Check for prop drilling - props that are received but only passed through
    propsDefinition.forEach(prop => {
      const isUsedInScript = scriptPropUsage.has(prop);
      const isPassedThrough = templatePropUsage.has(prop);

      if (!isUsedInScript && isPassedThrough) {
        // This is a potential prop drilling case
        // In a real implementation, we'd need cross-component analysis
        // For now, flag components that pass through more than 2 props
        const passThroughCount = propsDefinition.filter(p =>
          !scriptPropUsage.has(p) && templatePropUsage.has(p)
        ).length;

        if (passThroughCount >= 2) {
          issues.push({
            pattern: 'PROP_DRILLING',
            severity: passThroughCount >= 4 ? 'HIGH' : 'MEDIUM',
            message: `Potential prop drilling: ${passThroughCount} props passed through without local usage`,
            location: { line: 1, column: 1 },
            refactoring: 'Consider using provide/inject or state management instead of prop drilling'
          });
        }
      }
    });

    return issues;
  }
  detectTightCoupling(sfc, filePath) {
    const issues = [];
    const script = sfc.descriptor.script;
    const template = sfc.descriptor.template;

    if (!script || !script.content) return issues;

    const scriptContent = script.content;
    let tightCouplingFound = false;

    // Check for $parent access
    if (scriptContent.includes('$parent')) {
      issues.push({
        pattern: 'TIGHT_COUPLING',
        severity: 'CRITICAL',
        message: 'Direct access to $parent violates component isolation',
        location: this.findPatternLocation(scriptContent, '\\$parent'),
        refactoring: 'Use props for parent-child communication or emit events'
      });
      tightCouplingFound = true;
    }

    // Check for $children access
    if (scriptContent.includes('$children')) {
      issues.push({
        pattern: 'TIGHT_COUPLING',
        severity: 'CRITICAL',
        message: 'Direct access to $children violates component isolation',
        location: this.findPatternLocation(scriptContent, '\\$children'),
        refactoring: 'Use $refs for specific child access or redesign component structure'
      });
      tightCouplingFound = true;
    }

    // Check for prop mutation
    const propMutations = this.detectPropMutations(scriptContent);
    if (propMutations.length > 0) {
      propMutations.forEach(mutation => {
        issues.push({
          pattern: 'TIGHT_COUPLING',
          severity: 'CRITICAL',
          message: `Direct prop mutation: ${mutation} violates one-way data flow`,
          location: mutation.location,
          refactoring: 'Use local data property and emit events to parent'
        });
      });
      tightCouplingFound = true;
    }

    // Additional tight coupling patterns
    const tightCouplingPatterns = [
      { pattern: /\bthis\.\$root\b/g, message: 'Accessing $root creates tight coupling', severity: 'HIGH' },
      { pattern: /\bthis\.\$parent\.\w+/g, message: 'Accessing parent properties directly', severity: 'HIGH' },
      { pattern: /\bthis\.\$children\[\d+\]/g, message: 'Accessing specific child by index', severity: 'HIGH' }
    ];

    tightCouplingPatterns.forEach(({ pattern, message, severity }) => {
      const matches = scriptContent.match(pattern);
      if (matches) {
        issues.push({
          pattern: 'TIGHT_COUPLING',
          severity,
          message,
          location: this.findPatternLocation(scriptContent, pattern.source),
          refactoring: 'Refactor to use proper Vue.js patterns (props/events for parent-child communication)'
        });
      }
    });

    return issues;
  }
  detectRefReactiveConfusion(sfc, filePath) {
    const issues = [];
    const script = sfc.descriptor.script;

    if (!script || !script.content) return issues;

    const scriptContent = script.content;

    // 1. Detect reactive() used with primitives (should use ref instead)
    const reactivePrimitivePattern = /\breactive\s*\(\s*(['"`]?)(true|false|null|undefined|\d+|\d*\.\d+)\1\s*\)/g;
    let match;

    while ((match = reactivePrimitivePattern.exec(scriptContent)) !== null) {
      issues.push({
        pattern: 'REF_REACTIVE_CONFUSION',
        severity: 'HIGH',
        message: 'Using reactive() with primitive value - use ref() instead',
        location: this.getLineColumnFromIndex(scriptContent, match.index),
        refactoring: `reactive(${match[2]}) → ref(${match[2]})`
      });
    }

    // 2. Detect reactive() used with string/number literals
    const reactiveStringPattern = /\breactive\s*\(\s*(['"`][^'"`]*['"`])\s*\)/g;

    while ((match = reactiveStringPattern.exec(scriptContent)) !== null) {
      issues.push({
        pattern: 'REF_REACTIVE_CONFUSION',
        severity: 'MEDIUM',
        message: 'Using reactive() with string literal - consider if ref() is more appropriate',
        location: this.getLineColumnFromIndex(scriptContent, match.index),
        refactoring: `reactive(${match[1]}) → ref(${match[1]})`
      });
    }

    // 3. Detect destructuring of reactive objects without toRefs
    const destructuringPattern = /const\s*\{\s*[^}]+\}\s*=\s*(reactive|toRefs)\s*\(/g;
    let lastDestructuringIndex = -1;

    while ((match = destructuringPattern.exec(scriptContent)) !== null) {
      const isToRefs = match[1] === 'toRefs';

      if (!isToRefs) {
        // Check if toRefs is used elsewhere in the destructuring chain
        const beforeMatch = scriptContent.substring(lastDestructuringIndex + 1, match.index);
        const afterMatch = scriptContent.substring(match.index);

        // Look for toRefs usage in the same statement or nearby
        const hasToRefs = beforeMatch.includes('toRefs(') || afterMatch.match(/toRefs\s*\([^)]*reactive/);

        if (!hasToRefs) {
          issues.push({
            pattern: 'REF_REACTIVE_CONFUSION',
            severity: 'CRITICAL',
            message: 'Destructuring reactive object without toRefs() breaks reactivity',
            location: this.getLineColumnFromIndex(scriptContent, match.index),
            refactoring: 'const { prop } = reactive({...}) → const { prop } = toRefs(reactive({...}))'
          });
        }
      }

      lastDestructuringIndex = match.index;
    }

    // 4. Detect assignment to entire reactive objects (replacing instead of updating)
    const reactiveAssignmentPattern = /\b(\w+)\s*=\s*\{[^}]*\}/g;

    while ((match = reactiveAssignmentPattern.exec(scriptContent)) !== null) {
      const varName = match[1];

      // Check if this variable was declared as reactive
      const reactiveDeclarationPattern = new RegExp(`const\\s+${this.escapeRegex(varName)}\\s*=\\s*reactive`, 'g');
      const hasReactiveDeclaration = reactiveDeclarationPattern.test(scriptContent);

      if (hasReactiveDeclaration) {
        issues.push({
          pattern: 'REF_REACTIVE_CONFUSION',
          severity: 'HIGH',
          message: `Replacing entire reactive object '${varName}' loses reactivity connections`,
          location: this.getLineColumnFromIndex(scriptContent, match.index),
          refactoring: 'Update individual properties instead of replacing the entire object'
        });
      }
    }

    return issues;
  }
  detectDestructuringReactivityLoss(sfc, filePath) {
    const issues = [];
    const script = sfc.descriptor.script;

    if (!script || !script.content) return issues;

    const scriptContent = script.content;

    // 1. Detect destructuring reactive objects: const {a} = reactive({...})
    const reactiveDestructuringPattern = /const\s*\{\s*([^}]+)\}\s*=\s*reactive\s*\(/g;
    let match;

    while ((match = reactiveDestructuringPattern.exec(scriptContent)) !== null) {
      const destructuredProps = match[1].split(',').map(p => p.trim().split(':')[0].trim());

      // Check if toRefs is used in the same statement or nearby
      const beforeMatch = scriptContent.substring(0, match.index);
      const statementEnd = scriptContent.indexOf(';', match.index) + 1;
      const afterMatch = scriptContent.substring(match.index, statementEnd);

      const hasToRefs = beforeMatch.includes('toRefs(') ||
                       afterMatch.includes('toRefs(') ||
                       scriptContent.substring(statementEnd, statementEnd + 100).includes('toRefs(');

      if (!hasToRefs) {
        issues.push({
          pattern: 'DESTRUCTURING_REACTIVITY_LOSS',
          severity: 'CRITICAL',
          message: `Destructuring reactive object breaks reactivity for properties: ${destructuredProps.join(', ')}`,
          location: this.getLineColumnFromIndex(scriptContent, match.index),
          refactoring: 'const { prop } = reactive({...}) → const { prop } = toRefs(reactive({...}))'
        });
      }
    }

    // 2. Detect destructuring ref .value: const {value: x} = ref(...)
    const refValueDestructuringPattern = /const\s*\{\s*value\s*:\s*([^}\s]+)\}\s*=\s*ref\s*\(/g;

    while ((match = refValueDestructuringPattern.exec(scriptContent)) !== null) {
      const alias = match[1];

      issues.push({
        pattern: 'DESTRUCTURING_REACTIVITY_LOSS',
        severity: 'CRITICAL',
        message: `Destructuring ref's .value property breaks reactivity`,
        location: this.getLineColumnFromIndex(scriptContent, match.index),
        refactoring: `const {value: ${alias}} = ref(...) → const ${alias} = ref(...)`
      });
    }

    // 3. Detect destructuring props in setup: const {propName} = props
    const propsDestructuringPattern = /const\s*\{\s*([^}]+)\}\s*=\s*(props|defineProps)\s*\(/g;

    while ((match = propsDestructuringPattern.exec(scriptContent)) !== null) {
      const destructuredProps = match[1].split(',').map(p => p.trim().split(':')[0].trim());
      const isDefineProps = match[2] === 'defineProps';

      // Only flag if it's defineProps (Composition API) - Options API props destructuring is different
      if (isDefineProps) {
        // Check if toRefs is used
        const beforeMatch = scriptContent.substring(0, match.index);
        const afterMatch = scriptContent.substring(match.index);

        const hasToRefs = beforeMatch.includes('toRefs(') ||
                         afterMatch.includes('toRefs(') ||
                         scriptContent.substring(scriptContent.indexOf(';', match.index) + 1, scriptContent.indexOf(';', match.index) + 100).includes('toRefs(');

        if (!hasToRefs) {
          issues.push({
            pattern: 'DESTRUCTURING_REACTIVITY_LOSS',
            severity: 'HIGH',
            message: `Destructuring props breaks reactivity for: ${destructuredProps.join(', ')}`,
            location: this.getLineColumnFromIndex(scriptContent, match.index),
            refactoring: 'const { prop } = defineProps(...) → const props = defineProps(...); const { prop } = toRefs(props)'
          });
        }
      }
    }

    // 4. Detect destructuring of computed objects
    const computedDestructuringPattern = /const\s*\{\s*([^}]+)\}\s*=\s*(computed|toRefs)\s*\(\s*\{\s*([^}]*computed)/g;

    while ((match = computedDestructuringPattern.exec(scriptContent)) !== null) {
      const isToRefs = match[2] === 'toRefs';

      if (!isToRefs) {
        const destructuredProps = match[1].split(',').map(p => p.trim().split(':')[0].trim());

        issues.push({
          pattern: 'DESTRUCTURING_REACTIVITY_LOSS',
          severity: 'MEDIUM',
          message: `Destructuring computed object may break reactivity`,
          location: this.getLineColumnFromIndex(scriptContent, match.index),
          refactoring: 'const { prop } = computed({...}) → const obj = computed({...}); const { prop } = toRefs(obj)'
        });
      }
    }

    return issues;
  }
  detectComputedSideEffects(sfc, filePath) {
    const issues = [];
    const script = sfc.descriptor.script;

    if (!script || !script.content) return issues;

    const scriptContent = script.content;

    // Extract computed properties from different API patterns
    const computedPatterns = [
      // Options API: computed: { propName() { ... } }
      /computed:\s*{([^}]*)}/g,
      // Composition API: const propName = computed(() => { ... })
      /computed\(\s*\(\)\s*=>\s*{([^}]*)}\s*\)/g,
      // Composition API with function body
      /computed\(\s*function\s*\(\)\s*{([^}]*)}\s*\)/g
    ];

    computedPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(scriptContent)) !== null) {
        const computedBody = match[1];
        const sideEffects = this.analyzeComputedSideEffects(computedBody);

        if (sideEffects.length > 0) {
          const severity = sideEffects.some(se => se.type === 'mutation' || se.type === 'async') ? 'CRITICAL' : 'HIGH';
          const messages = sideEffects.map(se => se.description);

          issues.push({
            pattern: 'COMPUTED_SIDE_EFFECTS',
            severity,
            message: `Impure computed property: ${messages.join(', ')}`,
            location: this.getLineColumnFromIndex(scriptContent, match.index),
            refactoring: 'Move side effects to methods, watchers, or make computed pure'
          });
        }
      }
    });

    return issues;
  }
  detectDeepWatcherOveruse(sfc, filePath) {
    const issues = [];
    const script = sfc.descriptor.script;

    if (!script || !script.content) return issues;

    const scriptContent = script.content;

    // Detect watch/watchEffect with deep: true
    const deepWatcherPatterns = [
      // watch(source, callback, { deep: true })
      /watch\s*\([^,]+,\s*[^,]+,\s*\{[^}]*deep\s*:\s*true[^}]*\}\s*\)/g,
      // watch(source, callback, options) with deep: true
      /watch\s*\([^,]+,\s*[^,]+,\s*\{[\s\S]*?deep\s*:\s*true[\s\S]*?\}\s*\)/g,
      // watchEffect(callback, { deep: true })
      /watchEffect\s*\([^,]+,\s*\{[^}]*deep\s*:\s*true[^}]*\}\s*\)/g
    ];

    deepWatcherPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(scriptContent)) !== null) {
        const fullMatch = match[0];

        // Extract the watched source
        const sourceMatch = fullMatch.match(/watch\s*\(\s*([^,]+),\s*/);
        if (sourceMatch) {
          const source = sourceMatch[1].trim();
          const estimatedSize = this.estimateWatchedObjectSize(source, scriptContent);

          let severity = 'LOW';
          let message = 'Using deep watcher may be expensive';

          if (estimatedSize > 50) {
            severity = 'HIGH';
            message = `Deep watcher on large object (${estimatedSize} properties) creates significant overhead`;
          } else if (estimatedSize > 20) {
            severity = 'MEDIUM';
            message = `Deep watcher on moderately large object (${estimatedSize} properties)`;
          }

          issues.push({
            pattern: 'DEEP_WATCHER_OVERUSE',
            severity: severity,
            message: message,
            location: this.getLineColumnFromIndex(scriptContent, match.index),
            refactoring: 'Consider shallow watching or restructuring data to avoid deep watching'
          });
        }
      }
    });

    // Detect implicit deep watching (arrays and objects without immediate: true)
    const implicitDeepPatterns = [
      // watch(array, ...) without immediate: true
      /watch\s*\(\s*\w+\s*,\s*[^,]*,\s*\{[^}]*\}\s*\)/g,
      // watch(object, ...) without immediate: true
      /watch\s*\(\s*\{[^}]*\}\s*,\s*[^,]*,\s*\{[^}]*\}\s*\)/g
    ];

    implicitDeepPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(scriptContent)) !== null) {
        const fullMatch = match[0];

        // Check if immediate: true is present
        if (!fullMatch.includes('immediate: true') && !fullMatch.includes('immediate:true')) {
          const sourceMatch = fullMatch.match(/watch\s*\(\s*([^,]+),\s*/);
          if (sourceMatch) {
            const source = sourceMatch[1].trim();

            // Only flag if it looks like an array or object
            if (source.includes('[') || source.includes('{') || /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(source)) {
              issues.push({
                pattern: 'DEEP_WATCHER_OVERUSE',
                severity: 'LOW',
                message: 'Potential implicit deep watching - consider if immediate: true is needed',
                location: this.getLineColumnFromIndex(scriptContent, match.index),
                refactoring: 'Add immediate: true if you need initial execution, or ensure shallow watching'
              });
            }
          }
        }
      }
    });

    return issues;
  }
  detectWatcherShouldBeComputed(sfc, filePath) {
    const issues = [];
    const script = sfc.descriptor.script;

    if (!script || !script.content) return issues;

    const scriptContent = script.content;

    // Detect watch/watchEffect patterns that should be computed
    const watcherPatterns = [
      // watch(source, (newVal) => { state.value = computedValue })
      /watch\s*\(\s*[^,]+,\s*\(\s*[^)]*\)\s*=>\s*\{([\s\S]*?)\}\s*\)/g,
      // watchEffect(() => { state.value = computedValue })
      /watchEffect\s*\(\s*\(\)\s*=>\s*\{([\s\S]*?)\}\s*\)/g
    ];

    watcherPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(scriptContent)) !== null) {
        const watcherBody = match[1] || match[2]; // Different capture groups

        // Analyze the watcher body
        const analysis = this.analyzeWatcherBody(watcherBody);

        if (analysis.isPure && analysis.onlyAssignsToState && analysis.hasReactiveAssignments) {
          const severity = analysis.multipleAssignments ? 'HIGH' : 'MEDIUM';
          const message = analysis.multipleAssignments
            ? 'Watcher performs multiple reactive assignments - should be computed properties'
            : 'Watcher only assigns to reactive state - should be computed property';

          issues.push({
            pattern: 'WATCHER_SHOULD_BE_COMPUTED',
            severity: severity,
            message: message,
            location: this.getLineColumnFromIndex(scriptContent, match.index),
            refactoring: 'Replace watcher with computed property: const computedValue = computed(() => { /* logic */ })'
          });
        }
      }
    });

    return issues;
  }
  detectVuexAsyncInMutation(sfc, filePath) {
    const issues = [];
    const script = sfc.descriptor.script;

    if (!script || !script.content) return issues;

    const scriptContent = script.content;

    // Look for Vuex store definitions with mutations
    const storePatterns = [
      // mutations: { mutationName(state, payload) { ... } }
      /mutations:\s*{([^}]*)}/g,
      // const mutations = { mutationName(state, payload) { ... } }
      /const\s+mutations\s*=\s*{([^}]*)}/g,
      // export const mutations = { ... }
      /export\s+const\s+mutations\s*=\s*{([^}]*)}/g
    ];

    storePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(scriptContent)) !== null) {
        const mutationsBlock = match[1];
        const asyncMutations = this.analyzeMutationsForAsync(mutationsBlock);

        asyncMutations.forEach(mutation => {
          issues.push({
            pattern: 'VUEX_ASYNC_IN_MUTATION',
            severity: 'CRITICAL',
            message: `Vuex mutation '${mutation.name}' contains async operations - mutations must be synchronous`,
            location: this.getLineColumnFromIndex(scriptContent, match.index + mutation.index),
            refactoring: 'Move async operations to actions: actions: { asyncAction({ commit }) { commit(\'syncMutation\') } }'
          });
        });
      }
    });

    return issues;
  }
  detectVuexGodStore(sfc, filePath) {
    const issues = [];
    const script = sfc.descriptor.script;

    if (!script || !script.content) return issues;

    const scriptContent = script.content;

    // Detect Vuex store patterns
    const storePatterns = [
      // const store = createStore({...})
      /createStore\s*\(\s*\{[\s\S]*?\}\s*\)/g,
      // new Vuex.Store({...})
      /new\s+Vuex\.Store\s*\(\s*\{[\s\S]*?\}\s*\)/g,
      // export default { state: ..., mutations: ..., actions: ..., getters: ... }
      /(?:export\s+default|const\s+store\s*=)\s*\{[\s\S]*?(?:state|mutations|actions|getters)[\s\S]*?\}/g
    ];

    storePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(scriptContent)) !== null) {
        const storeBlock = match[0];

        // Analyze store structure
        const analysis = this.analyzeVuexStore(storeBlock);

        // Check thresholds for each category
        const stateThreshold = this.getVuexThreshold('state', analysis.stateCount);
        const mutationsThreshold = this.getVuexThreshold('mutations', analysis.mutationsCount);
        const actionsThreshold = this.getVuexThreshold('actions', analysis.actionsCount);
        const gettersThreshold = this.getVuexThreshold('getters', analysis.gettersCount);
        const locThreshold = this.getVuexLocThreshold(analysis.totalLines);

        // Report issues for exceeded thresholds
        if (stateThreshold.level !== 'OK') {
          issues.push({
            pattern: 'VUEX_GOD_STORE',
            severity: stateThreshold.level,
            message: `Vuex store has ${analysis.stateCount} state properties (${stateThreshold.level} threshold exceeded)`,
            location: this.getLineColumnFromIndex(scriptContent, match.index),
            refactoring: 'Split store into domain-specific modules using Vuex modules'
          });
        }

        if (mutationsThreshold.level !== 'OK') {
          issues.push({
            pattern: 'VUEX_GOD_STORE',
            severity: mutationsThreshold.level,
            message: `Vuex store has ${analysis.mutationsCount} mutations (${mutationsThreshold.level} threshold exceeded)`,
            location: this.getLineColumnFromIndex(scriptContent, match.index),
            refactoring: 'Decompose mutations into domain-specific modules'
          });
        }

        if (actionsThreshold.level !== 'OK') {
          issues.push({
            pattern: 'VUEX_GOD_STORE',
            severity: actionsThreshold.level,
            message: `Vuex store has ${analysis.actionsCount} actions (${actionsThreshold.level} threshold exceeded)`,
            location: this.getLineColumnFromIndex(scriptContent, match.index),
            refactoring: 'Split async logic into feature-specific action modules'
          });
        }

        if (gettersThreshold.level !== 'OK') {
          issues.push({
            pattern: 'VUEX_GOD_STORE',
            severity: gettersThreshold.level,
            message: `Vuex store has ${analysis.gettersCount} getters (${gettersThreshold.level} threshold exceeded)`,
            location: this.getLineColumnFromIndex(scriptContent, match.index),
            refactoring: 'Extract computed properties into separate getter modules'
          });
        }

        if (locThreshold.level !== 'OK') {
          issues.push({
            pattern: 'VUEX_GOD_STORE',
            severity: locThreshold.level,
            message: `Vuex store module is ${analysis.totalLines} lines (${locThreshold.level} threshold exceeded)`,
            location: this.getLineColumnFromIndex(scriptContent, match.index),
            refactoring: 'Refactor into multiple domain-driven store modules'
          });
        }
      }
    });

    return issues;
  }
  detectPiniaCircularDependency(sfc, filePath) {
    const issues = [];
    const script = sfc.descriptor.script;

    if (!script || !script.content) return issues;

    const scriptContent = script.content;

    // Detect Pinia store definitions
    const storePatterns = [
      // defineStore('name', { setup: () => {...} })
      /defineStore\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*\{[\s\S]*?\}\s*\)/g,
      // defineStore('name', () => ({...}))
      /defineStore\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*\(\)\s*=>\s*\(\{[\s\S]*?\}\)\s*\)/g
    ];

    const storesInFile = [];

    storePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(scriptContent)) !== null) {
        const storeName = match[1];
        const storeBody = match[0];

        storesInFile.push({
          name: storeName,
          body: storeBody,
          index: match.index
        });
      }
    });

    // If multiple stores in one file, check for cross-store reads during setup
    if (storesInFile.length > 1) {
      storesInFile.forEach(store => {
        const otherStores = storesInFile.filter(s => s.name !== store.name);

        otherStores.forEach(otherStore => {
          // Check if this store reads the other store's state during setup
          const storeReadPattern = new RegExp(`\\b${this.escapeRegex(otherStore.name)}\\.\\w+`, 'g');

          if (storeReadPattern.test(store.body)) {
            // Check if the other store also reads this store's state
            const reverseReadPattern = new RegExp(`\\b${this.escapeRegex(store.name)}\\.\\w+`, 'g');

            if (reverseReadPattern.test(otherStore.body)) {
              issues.push({
                pattern: 'PINIA_CIRCULAR_DEPENDENCY',
                severity: 'CRITICAL',
                message: `Circular dependency between Pinia stores '${store.name}' and '${otherStore.name}'`,
                location: this.getLineColumnFromIndex(scriptContent, store.index),
                refactoring: 'Move cross-store reads to actions or getters for lazy evaluation'
              });
            }
          }
        });
      });
    }

    // Detect potential cross-file circular dependencies (within same file context)
    const useStoreCalls = scriptContent.match(/useStore\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g) || [];

    if (useStoreCalls.length > 1) {
      // Multiple different stores used in same component - potential for circular deps
      const storeNames = useStoreCalls.map(call => {
        const match = call.match(/useStore\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/);
        return match ? match[1] : null;
      }).filter(Boolean);

      if (storeNames.length > 1) {
        issues.push({
          pattern: 'PINIA_CIRCULAR_DEPENDENCY',
          severity: 'MEDIUM',
          message: `Multiple Pinia stores used together - monitor for circular dependencies: ${storeNames.join(', ')}`,
          location: this.getLineColumnFromIndex(scriptContent, scriptContent.indexOf('useStore')),
          refactoring: 'Ensure stores don\'t read each other\'s state during initialization'
        });
      }
    }

    return issues;
  }
  detectPiniaUseStoreAfterAwait(sfc, filePath) {
    const issues = [];
    const script = sfc.descriptor.script;

    if (!script || !script.content) return issues;

    const scriptContent = script.content;

    // Find async functions and setup functions that contain both await and useStore
    const asyncFunctionPattern = /(?:async\s+)?(?:function\s+\w+|const\s+\w+\s*=|\w+\s*=)\s*\([^)]*\)\s*=>\s*\{[\s\S]*?\}|setup\s*\([^)]*\)\s*\{[\s\S]*?\}/g;
    let match;

    while ((match = asyncFunctionPattern.exec(scriptContent)) !== null) {
      const functionBody = match[0];

      // Check if function contains both await and useStore
      if (functionBody.includes('await') && functionBody.includes('useStore')) {
        // Find all await positions
        const awaitPositions = [];
        const awaitRegex = /\bawait\b/g;
        let awaitMatch;
        while ((awaitMatch = awaitRegex.exec(functionBody)) !== null) {
          awaitPositions.push(awaitMatch.index);
        }

        // Find all useStore positions
        const useStorePositions = [];
        const useStoreRegex = /\buseStore\b/g;
        let useStoreMatch;
        while ((useStoreMatch = useStoreRegex.exec(functionBody)) !== null) {
          useStorePositions.push(useStoreMatch.index);
        }

        // Check if any useStore call comes after any await
        const hasUseStoreAfterAwait = awaitPositions.some(awaitPos =>
          useStorePositions.some(useStorePos => useStorePos > awaitPos)
        );

        if (hasUseStoreAfterAwait) {
          issues.push({
            pattern: 'PINIA_USESTORE_AFTER_AWAIT',
            severity: 'CRITICAL',
            message: 'useStore() called after await - may use wrong Pinia instance in SSR',
            location: this.getLineColumnFromIndex(scriptContent, match.index),
            refactoring: 'Move useStore() calls before any await statements or use store instance from parameter'
          });
        }
      }
    }

    // Also check for useStore in .then() chains (async without async/await)
    const promiseChainPattern = /\.then\s*\(\s*\([^)]*\)\s*=>\s*\{[\s\S]*?\}\s*\)/g;

    while ((match = promiseChainPattern.exec(scriptContent)) !== null) {
      const thenBody = match[0];

      if (thenBody.includes('useStore')) {
        issues.push({
          pattern: 'PINIA_USESTORE_AFTER_AWAIT',
          severity: 'HIGH',
          message: 'useStore() in promise chain - may cause SSR context issues',
          location: this.getLineColumnFromIndex(scriptContent, match.index),
          refactoring: 'Capture store instance before async operations'
        });
      }
    }

    return issues;
  }
  detectStateLocalizationAntipattern(sfc, filePath) {
    const issues = [];
    const script = sfc.descriptor.script;

    if (!script || !script.content) return issues;

    const scriptContent = script.content;

    // Patterns that indicate global state being kept locally
    const globalStatePatterns = [
      // Authentication state
      { pattern: /\b(isAuthenticated|isLoggedIn|user|currentUser|authToken|session)\b/g, type: 'authentication' },
      // Theme/UI preferences
      { pattern: /\b(theme|darkMode|lightMode|colorScheme|language|locale|preferences)\b/g, type: 'preferences' },
      // Global app state
      { pattern: /\b(isLoading|loading|globalLoading|appState|sidebarOpen|menuOpen)\b/g, type: 'app-state' },
      // User settings
      { pattern: /\b(settings|config|configuration|userSettings|appConfig)\b/g, type: 'settings' },
      // Cached data that should be global
      { pattern: /\b(cache|cachedData|apiCache|dataCache)\b/g, type: 'cache' }
    ];

    // Check data/computed sections for global state variables
    const dataSectionPattern = /(?:data|setup)\s*\(\)\s*\{[\s\S]*?return\s*\{([\s\S]*?)\}/g;
    let match;

    while ((match = dataSectionPattern.exec(scriptContent)) !== null) {
      const dataProperties = match[1];

      globalStatePatterns.forEach(({ pattern, type }) => {
        const stateMatches = dataProperties.match(pattern);
        if (stateMatches) {
          // Check if this component uses provide (indicating it might be sharing state)
          const hasProvide = scriptContent.includes('provide(') || scriptContent.includes('provide,');

          if (!hasProvide) {
            issues.push({
              pattern: 'STATE_LOCALIZATION_ANTIPATTERN',
              severity: 'HIGH',
              message: `${type.replace('-', ' ')} state '${stateMatches[0]}' should be in global store, not local component state`,
              location: this.getLineColumnFromIndex(scriptContent, match.index),
              refactoring: 'Move to Pinia/Vuex store: defineStore() or createStore() for shared state management'
            });
          }
        }
      });
    }

    // Check for reactive() or ref() declarations with global state names
    const reactiveDeclarations = scriptContent.match(/(?:const|let)\s+(\w+)\s*=\s*(?:ref|reactive)\s*\(/g) || [];

    reactiveDeclarations.forEach(decl => {
      const varMatch = decl.match(/(?:const|let)\s+(\w+)\s*=/);
      if (varMatch) {
        const varName = varMatch[1];

        globalStatePatterns.forEach(({ pattern, type }) => {
          if (pattern.test(varName)) {
            // Check if this is actually shared (has provide or is in store)
            const isInStore = scriptContent.includes('defineStore') || scriptContent.includes('createStore');
            const hasProvide = scriptContent.includes('provide');

            if (!isInStore && !hasProvide) {
              issues.push({
                pattern: 'STATE_LOCALIZATION_ANTIPATTERN',
                severity: 'MEDIUM',
                message: `Variable '${varName}' appears to be global ${type} - should use Pinia/Vuex store`,
                location: this.getLineColumnFromIndex(scriptContent, scriptContent.indexOf(decl)),
                refactoring: 'Extract to store: const useStore = defineStore(\'name\', () => { ... })'
              });
            }
          }
        });
      }
    });

    return issues;
  }
  detectUntypedProvideInject(sfc, filePath) {
    const issues = [];
    const script = sfc.descriptor.script;

    if (!script || !script.content) return issues;

    const scriptContent = script.content;

    // Detect provide() calls
    const providePattern = /\bprovide\s*\(/g;
    let match;

    while ((match = providePattern.exec(scriptContent)) !== null) {
      // Get the provide call and its arguments
      const provideCall = this.extractFunctionCall(scriptContent, match.index);

      if (provideCall) {
        const args = provideCall.args;

        // Check if first argument is a string (untyped) rather than InjectionKey
        if (args.length >= 1) {
          const keyArg = args[0].trim();

          // If it's a string literal, it's untyped
          if ((keyArg.startsWith("'") && keyArg.endsWith("'")) ||
              (keyArg.startsWith('"') && keyArg.endsWith('"')) ||
              (keyArg.startsWith('`') && keyArg.endsWith('`'))) {

            issues.push({
              pattern: 'UNTYPED_PROVIDE_INJECT',
              severity: 'HIGH',
              message: 'provide() uses string key without InjectionKey - lacks type safety',
              location: this.getLineColumnFromIndex(scriptContent, match.index),
              refactoring: 'Use InjectionKey: const key = Symbol() as InjectionKey<Type>; provide(key, value)'
            });
          }
        }
      }
    }

    // Detect inject() calls
    const injectPattern = /\binject\s*\(/g;

    while ((match = injectPattern.exec(scriptContent)) !== null) {
      const injectCall = this.extractFunctionCall(scriptContent, match.index);

      if (injectCall) {
        const args = injectCall.args;

        if (args.length >= 1) {
          const keyArg = args[0].trim();
          const hasDefaultValue = args.length >= 2;

          // If it's a string key without proper typing
          if (((keyArg.startsWith("'") && keyArg.endsWith("'")) ||
               (keyArg.startsWith('"') && keyArg.endsWith('"')) ||
               (keyArg.startsWith('`') && keyArg.endsWith('`'))) &&
              !hasDefaultValue) {

            issues.push({
              pattern: 'UNTYPED_PROVIDE_INJECT',
              severity: 'HIGH',
              message: 'inject() uses string key without default value - may cause runtime errors',
              location: this.getLineColumnFromIndex(scriptContent, match.index),
              refactoring: 'Provide default value: inject(key, defaultValue) or use InjectionKey for type safety'
            });
          }
        }
      }
    }

    // Check for InjectionKey usage (good practice)
    const injectionKeyCount = (scriptContent.match(/\bInjectionKey\b/g) || []).length;
    const provideInjectCount = (scriptContent.match(/\b(provide|inject)\s*\(/g) || []).length;

    if (provideInjectCount > 0 && injectionKeyCount === 0) {
      // Look for the first provide/inject usage
      const firstUsage = scriptContent.search(/\b(provide|inject)\s*\(/);

      if (firstUsage !== -1) {
        issues.push({
          pattern: 'UNTYPED_PROVIDE_INJECT',
          severity: 'MEDIUM',
          message: 'Component uses provide/inject without InjectionKey for type safety',
          location: this.getLineColumnFromIndex(scriptContent, firstUsage),
          refactoring: 'Import InjectionKey: import type { InjectionKey } from \'vue\'; const key = Symbol() as InjectionKey<Type>'
        });
      }
    }

    return issues;
  }
  detectInfiniteNavigationLoop(sfc, filePath) {
    const issues = [];
    const script = sfc.descriptor.script;

    if (!script || !script.content) return issues;

    const scriptContent = script.content;

    // Detect router.beforeEach and similar guard patterns
    const guardPatterns = [
      // router.beforeEach((to, from, next) => { ... })
      /router\.beforeEach\s*\(\s*\([^)]*\)\s*=>\s*\{[\s\S]*?\}\s*\)/g,
      // beforeEach function declarations
      /function\s+beforeEach\s*\([^)]*\)\s*\{[\s\S]*?\}/g,
      // const beforeEach = ...
      /const\s+beforeEach\s*=\s*\([^)]*\)\s*=>\s*\{[\s\S]*?\}/g
    ];

    guardPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(scriptContent)) !== null) {
        const guardBody = match[0];

        // Check for redirect calls without route checking
        const redirectCalls = guardBody.match(/next\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g) || [];

        redirectCalls.forEach(redirectCall => {
          const redirectMatch = redirectCall.match(/next\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/);
          if (redirectMatch) {
            const redirectPath = redirectMatch[1];

            // Check if the guard checks the current route before redirecting
            const hasRouteCheck = this.hasRouteCheckBeforeRedirect(guardBody, redirectPath, redirectCall);

            if (!hasRouteCheck) {
              issues.push({
                pattern: 'INFINITE_NAVIGATION_LOOP',
                severity: 'CRITICAL',
                message: `Navigation guard redirects to '${redirectPath}' without checking current route - causes infinite loop`,
                location: this.getLineColumnFromIndex(scriptContent, match.index + guardBody.indexOf(redirectCall)),
                refactoring: 'Add route check: if (to.path !== \'/target\') next(\'/target\') or use route meta fields'
              });
            }
          }
        });

        // Also check for unconditional redirects
        const unconditionalRedirects = guardBody.match(/return\s+['"`]([^'"`]+)['"`]/g) || [];

        unconditionalRedirects.forEach(redirect => {
          const redirectMatch = redirect.match(/return\s+['"`]([^'"`]+)['"`]/);
          if (redirectMatch) {
            const redirectPath = redirectMatch[1];

            // Check if there's any condition before this return
            const beforeReturn = guardBody.substring(0, guardBody.indexOf(redirect));
            const hasCondition = /\bif\s*\(|\?|\||&|\.path|\.name|\.meta/.test(beforeReturn);

            if (!hasCondition) {
              issues.push({
                pattern: 'INFINITE_NAVIGATION_LOOP',
                severity: 'CRITICAL',
                message: `Unconditional redirect to '${redirectPath}' will cause infinite loop`,
                location: this.getLineColumnFromIndex(scriptContent, match.index + guardBody.indexOf(redirect)),
                refactoring: 'Add condition: if (!isAuthenticated) return \'/login\' or check to.path first'
              });
            }
          }
        });
      }
    });

    return issues;
  }
  detectMissingLazyLoading(sfc, filePath) {
    const issues = [];
    const script = sfc.descriptor.script;

    if (!script || !script.content) return issues;

    const scriptContent = script.content;

    // Detect route definitions with component imports
    const routePatterns = [
      // Vue Router 4 style: { path: '/home', component: Home }
      /(\{[\s\S]*?component\s*:\s*[^}]+?\})/g,
      // Routes array: const routes = [...]
      /(?:routes|Routes)\s*:\s*\[([\s\S]*?)\]/g,
      // Route objects in arrays
      /(?:path|name|component|children)\s*:\s*[^,]+/g
    ];

    routePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(scriptContent)) !== null) {
        const routeDefinition = match[0];

        // Look for component assignments in route definitions
        const componentAssignments = routeDefinition.match(/component\s*:\s*([^{}(),\s]+(?:\([^)]*\))?)/g);

        if (componentAssignments) {
          componentAssignments.forEach(assignment => {
            const componentMatch = assignment.match(/component\s*:\s*([^{}(),\s]+(?:\([^)]*\))?)/);
            if (componentMatch) {
              const componentValue = componentMatch[1].trim();

              // Check if it's a static import (not a function/dynamic import)
              if (!componentValue.includes('() => import(') &&
                  !componentValue.includes('import(') &&
                  !componentValue.includes('() =>') &&
                  !componentValue.match(/^\(\s*\)\s*=>/) &&
                  componentValue.match(/^[A-Za-z_$][A-Za-z0-9_$]*$/)) {

                // Check if this component is imported statically at the top
                const staticImportPattern = new RegExp(`import\\s+\\w+\\s+from\\s+['"\`][^'"\`]*${this.escapeRegex(componentValue)}[^'"\`]*['"\`]`, 'g');
                const hasStaticImport = staticImportPattern.test(scriptContent);

                if (hasStaticImport) {
                  issues.push({
                    pattern: 'MISSING_LAZY_LOADING',
                    severity: 'HIGH',
                    message: `Route component '${componentValue}' is eagerly loaded - increases initial bundle size`,
                    location: this.getLineColumnFromIndex(scriptContent, match.index + routeDefinition.indexOf(assignment)),
                    refactoring: 'Use lazy loading: component: () => import(\'./Component.vue\')'
                  });
                }
              }
            }
          });
        }
      }
    });

    // Check for static imports that could be routes
    const staticImports = scriptContent.match(/import\s+(\w+)\s+from\s+['"`]([^'"`]*\.vue)['"`]/g) || [];

    staticImports.forEach(importStmt => {
      const importMatch = importStmt.match(/import\s+(\w+)\s+from\s+['"`]([^'"`]*\.vue)['"`]/);
      if (importMatch) {
        const componentName = importMatch[1];
        const componentPath = importMatch[2];

        // Check if this component is used in routes but not lazy loaded
        const routeUsage = new RegExp(`component\\s*:\\s*${this.escapeRegex(componentName)}`, 'g');
        const isUsedInRoutes = routeUsage.test(scriptContent);

        if (isUsedInRoutes) {
          issues.push({
            pattern: 'MISSING_LAZY_LOADING',
            severity: 'MEDIUM',
            message: `Component '${componentName}' imported statically but used in routes`,
            location: this.getLineColumnFromIndex(scriptContent, scriptContent.indexOf(importStmt)),
            refactoring: 'Remove static import and use: component: () => import(\'' + componentPath + '\')'
          });
        }
      }
    });

    return issues;
  }
  detectGodGuardAntipattern(sfc, filePath) {
    const issues = [];
    const script = sfc.descriptor.script;

    if (!script || !script.content) return issues;

    const scriptContent = script.content;

    // Detect navigation guard patterns
    const guardPatterns = [
      // router.beforeEach
      /router\.beforeEach\s*\(\s*\([^)]*\)\s*=>\s*\{([\s\S]*?)\}\s*\)/g,
      // router.beforeResolve
      /router\.beforeResolve\s*\(\s*\([^)]*\)\s*=>\s*\{([\s\S]*?)\}\s*\)/g,
      // router.afterEach
      /router\.afterEach\s*\(\s*\([^)]*\)\s*=>\s*\{([\s\S]*?)\}\s*\)/g,
      // Named guard functions
      /function\s+(?:beforeEach|beforeResolve|afterEach)\s*\([^)]*\)\s*\{([\s\S]*?)\}/g,
      // Arrow function guards
      /const\s+(?:beforeEach|beforeResolve|afterEach)\s*=\s*\([^)]*\)\s*=>\s*\{([\s\S]*?)\}/g
    ];

    guardPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(scriptContent)) !== null) {
        const guardBody = match[1] || match[0];

        // Analyze the guard for multiple responsibilities
        const responsibilities = this.analyzeGuardResponsibilities(guardBody);
        const lineCount = guardBody.split('\n').length;

        if (responsibilities.length > 3 || lineCount > 50) {
          const severity = this.getGodGuardSeverity(responsibilities.length, lineCount);

          issues.push({
            pattern: 'GOD_GUARD_ANTIPATTERN',
            severity: severity,
            message: `Navigation guard has ${responsibilities.length} responsibilities (${lineCount} lines) - violates single responsibility principle`,
            location: this.getLineColumnFromIndex(scriptContent, match.index),
            refactoring: `Split into separate guards: ${responsibilities.slice(0, 3).join(', ')}${responsibilities.length > 3 ? '...' : ''}`
          });
        }
      }
    });

    return issues;
  }
  detectLargeListNoVirtualization(sfc, filePath) {
    const issues = [];
    const template = sfc.descriptor.template;
    const script = sfc.descriptor.script;

    if (!template || !template.content) return issues;

    const templateContent = template.content;
    const scriptContent = script?.content || '';

    // Check if virtualization libraries are imported
    const hasVirtualization = this.detectVirtualizationLibraries(scriptContent);

    // Find all v-for directives
    const vForPattern = /v-for\s*=\s*["']([^"']+)["']/g;
    let match;

    while ((match = vForPattern.exec(templateContent)) !== null) {
      const vForExpression = match[1];
      const estimatedSize = this.estimateListSize(vForExpression, scriptContent);

      if (estimatedSize > 0) {
        let severity = 'LOW';
        let message = `Large list (${estimatedSize} items) without virtualization`;

        if (estimatedSize >= 5000) {
          severity = 'CRITICAL';
        } else if (estimatedSize >= 1000) {
          severity = 'HIGH';
          message += ' - must virtualize for performance';
        } else if (estimatedSize >= 500) {
          severity = 'MEDIUM';
          message += ' - should consider virtualization';
        } else if (estimatedSize >= 100) {
          severity = 'LOW';
          message += ' - consider virtualization for better performance';
        }

        if (!hasVirtualization && estimatedSize >= 100) {
          issues.push({
            pattern: 'LARGE_LIST_NO_VIRTUALIZATION',
            severity: severity,
            message: message,
            location: this.getLineColumnFromIndex(templateContent, match.index),
            refactoring: 'Use vue-virtual-scroller or similar library: npm install vue-virtual-scroller'
          });
        }
      }
    }

    return issues;
  }
  detectMissingShallowReactivity(sfc, filePath) {
    const issues = [];
    const script = sfc.descriptor.script;

    if (!script || !script.content) return issues;

    const scriptContent = script.content;

    // Find reactive declarations
    const reactivePatterns = [
      // ref() declarations
      /ref\s*\(\s*([^)]+)\)/g,
      // reactive() declarations
      /reactive\s*\(\s*([^)]+)\)/g,
      // computed() that return large objects
      /computed\s*\(\s*\(\)\s*=>\s*([^}]+)\)/g
    ];

    reactivePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(scriptContent)) !== null) {
        const dataExpression = match[1];
        const estimatedSize = this.estimateDataStructureSize(dataExpression, scriptContent);
        const isShallow = this.isShallowReactive(scriptContent, match.index);

        if (estimatedSize > 500 && !isShallow) {
          let severity = 'MEDIUM';
          let message = `Large reactive data structure (${estimatedSize} items/properties) should use shallow reactivity`;

          if (estimatedSize > 1000) {
            severity = 'HIGH';
            message += ' - critical for performance';
          }

          issues.push({
            pattern: 'MISSING_SHALLOW_REACTIVITY',
            severity: severity,
            message: message,
            location: this.getLineColumnFromIndex(scriptContent, match.index),
            refactoring: 'Use shallowRef() or shallowReactive() for large datasets: const data = shallowRef(largeObject)'
          });
        }
      }
    });

    return issues;
  }
  detectEventListenerMemoryLeak(sfc, filePath) {
    const issues = [];
    const script = sfc.descriptor.script;

    if (!script || !script.content) return issues;

    const scriptContent = script.content;

    // Find all addEventListener calls
    const addEventListenerPattern = /addEventListener\(\s*['"]([^'"]+)['"]\s*,\s*([^,)]+)/g;
    const addedListeners = [];
    let match;

    while ((match = addEventListenerPattern.exec(scriptContent)) !== null) {
      const eventType = match[1];
      const handler = match[2].trim();
      addedListeners.push({
        event: eventType,
        handler: handler,
        index: match.index
      });
    }

    if (addedListeners.length === 0) return issues;

    // Find cleanup lifecycle hooks
    const cleanupHooks = this.extractCleanupHooks(scriptContent);

    // Check if each added listener has a corresponding removal
    addedListeners.forEach(listener => {
      const hasCleanup = this.hasMatchingCleanup(listener, cleanupHooks);

      if (!hasCleanup) {
        issues.push({
          pattern: 'EVENT_LISTENER_MEMORY_LEAK',
          severity: 'CRITICAL',
          message: `Event listener for '${listener.event}' added but not removed - causes memory leak`,
          location: this.getLineColumnFromIndex(scriptContent, listener.index),
          refactoring: 'Add removeEventListener in onUnmounted (Composition API) or beforeDestroy (Options API)'
        });
      }
    });

    return issues;
  }
  detectFullLibraryImport(sfc, filePath) {
    const issues = [];
    const script = sfc.descriptor.script;

    if (!script || !script.content) return issues;

    const scriptContent = script.content;

    // Libraries known to be large when fully imported
    const largeLibraries = {
      'lodash': { size: '~70KB', severity: 'CRITICAL', recommended: 'lodash-es' },
      'underscore': { size: '~20KB', severity: 'HIGH', recommended: 'lodash-es or native methods' },
      'moment': { size: '~200KB', severity: 'CRITICAL', recommended: 'dayjs or date-fns' },
      'jquery': { size: '~30KB', severity: 'HIGH', recommended: 'native DOM APIs' },
      'axios': { size: '~15KB', severity: 'MEDIUM', recommended: 'fetch API' }
    };

    // Check for full imports: import _ from 'library'
    const fullImportPattern = /import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g;
    let match;

    while ((match = fullImportPattern.exec(scriptContent)) !== null) {
      const importName = match[1];
      const libraryName = match[2];

      if (largeLibraries[libraryName]) {
        const libInfo = largeLibraries[libraryName];
        issues.push({
          pattern: 'FULL_LIBRARY_IMPORT',
          severity: libInfo.severity,
          message: `Full import of '${libraryName}' (${libInfo.size}) prevents tree-shaking`,
          location: this.getLineColumnFromIndex(scriptContent, match.index),
          refactoring: `Import specific functions: import { ${this.suggestSpecificImports(libraryName)} } from '${libInfo.recommended}'`
        });
      }
    }

    // Check for CommonJS-style imports that can't tree-shake
    const commonJSImportPattern = /import\s*\{\s*([^}]+)\s*\}\s*from\s+['"]([^'"]+)['"]/g;

    while ((match = commonJSImportPattern.exec(scriptContent)) !== null) {
      const imports = match[1];
      const libraryName = match[2];

      // Check if importing from CommonJS libraries
      if (this.isCommonJSLibrary(libraryName)) {
        issues.push({
          pattern: 'FULL_LIBRARY_IMPORT',
          severity: 'HIGH',
          message: `Import from CommonJS library '${libraryName}' cannot be tree-shaken`,
          location: this.getLineColumnFromIndex(scriptContent, match.index),
          refactoring: 'Use ES module version or import from specific sub-paths'
        });
      }
    }

    // Check for wildcard imports
    const wildcardImportPattern = /import\s*\*\s*as\s+\w+\s+from\s+['"]([^'"]+)['"]/g;

    while ((match = wildcardImportPattern.exec(scriptContent)) !== null) {
      const libraryName = match[1];

      if (largeLibraries[libraryName]) {
        const libInfo = largeLibraries[libraryName];
        issues.push({
          pattern: 'FULL_LIBRARY_IMPORT',
          severity: libInfo.severity,
          message: `Wildcard import of '${libraryName}' (${libInfo.size}) prevents tree-shaking`,
          location: this.getLineColumnFromIndex(scriptContent, match.index),
          refactoring: `Import specific exports: import { ${this.suggestSpecificImports(libraryName)} } from '${libraryName}'`
        });
      }
    }

    return issues;
  }
  detectUntypedProps(sfc, filePath) {
    const issues = [];
    const script = sfc.descriptor.script;

    if (!script || !script.content) return issues;

    const scriptContent = script.content;

    // Check Composition API: defineProps()
    const definePropsPattern = /defineProps\s*\(\s*([^)]*)\s*\)/g;
    let match;

    while ((match = definePropsPattern.exec(scriptContent)) !== null) {
      const propsDefinition = match[1].trim();

      // Check if it's untyped
      if (this.isUntypedPropsDefinition(propsDefinition)) {
        issues.push({
          pattern: 'UNTYPED_PROPS',
          severity: 'HIGH',
          message: 'defineProps() called without TypeScript types - eliminates compile-time validation',
          location: this.getLineColumnFromIndex(scriptContent, match.index),
          refactoring: 'Use typed props: defineProps<{ propName: string; count: number }>() or withDefaults(defineProps<{...}>(), {...})'
        });
      }
    }

    // Check Options API: props definitions
    const optionsPropsPattern = /props:\s*\{([^}]*)\}/g;

    while ((match = optionsPropsPattern.exec(scriptContent)) !== null) {
      const propsBlock = match[1];

      // Extract individual prop definitions
      const propDefinitions = this.extractPropDefinitions(propsBlock);

      propDefinitions.forEach(prop => {
        if (this.isUntypedOptionsProp(prop.definition)) {
          issues.push({
            pattern: 'UNTYPED_PROPS',
            severity: 'MEDIUM',
            message: `Prop '${prop.name}' lacks type definition`,
            location: this.getLineColumnFromIndex(scriptContent, match.index + prop.offset),
            refactoring: `Add type: ${prop.name}: { type: String, required: true } or use Composition API with TypeScript`
          });
        }
      });
    }

    // Check for 'any' type usage in prop definitions
    const anyTypePattern = /\btype:\s*(\w+)/g;

    while ((match = anyTypePattern.exec(scriptContent)) !== null) {
      if (match[1] === 'any') {
        issues.push({
          pattern: 'UNTYPED_PROPS',
          severity: 'HIGH',
          message: 'Prop uses \'any\' type - defeats type safety purpose',
          location: this.getLineColumnFromIndex(scriptContent, match.index),
          refactoring: 'Use specific types: String, Number, Boolean, Array, Object, or custom constructor functions'
        });
      }
    }

    return issues;
  }
  detectUntypedEmits(sfc, filePath) {
    const issues = [];
    const script = sfc.descriptor.script;

    if (!script || !script.content) return issues;

    const scriptContent = script.content;

    // Check Composition API: defineEmits()
    const defineEmitsPattern = /defineEmits\s*\(\s*([^)]*)\s*\)/g;
    let match;

    while ((match = defineEmitsPattern.exec(scriptContent)) !== null) {
      const emitsDefinition = match[1].trim();

      // Check if it's untyped
      if (this.isUntypedEmitsDefinition(emitsDefinition)) {
        issues.push({
          pattern: 'UNTYPED_EMITS',
          severity: 'HIGH',
          message: 'defineEmits() called without TypeScript types - no payload type safety',
          location: this.getLineColumnFromIndex(scriptContent, match.index),
          refactoring: 'Use typed emits: defineEmits<{ change: [id: number]; update: [value: string] }>()'
        });
      }
    }

    // Check Options API: emits definitions
    const optionsEmitsPattern = /emits:\s*(\[[^\]]*\]|\{[^}]*\})/g;

    while ((match = optionsEmitsPattern.exec(scriptContent)) !== null) {
      const emitsDefinition = match[1];

      // Simple array emits are untyped
      if (emitsDefinition.startsWith('[') && emitsDefinition.endsWith(']')) {
        issues.push({
          pattern: 'UNTYPED_EMITS',
          severity: 'MEDIUM',
          message: 'Options API emits array lacks payload type definitions',
          location: this.getLineColumnFromIndex(scriptContent, match.index),
          refactoring: 'Use object syntax: emits: { eventName: (payload) => boolean } or switch to Composition API with TypeScript'
        });
      }
    }

    // Check for emit() calls that might be untyped
    const emitCallPattern = /\bemit\s*\(\s*['"]([^'"]+)['"]/g;

    while ((match = emitCallPattern.exec(scriptContent)) !== null) {
      const eventName = match[1];

      // If we have defineEmits but emit calls suggest missing typing
      if (scriptContent.includes('defineEmits') && !scriptContent.includes('<')) {
        // Already flagged by defineEmits check, skip
        continue;
      }

      // Check if this emit call has proper typing context
      const hasTypedEmits = this.hasTypedEmitsContext(scriptContent, match.index);

      if (!hasTypedEmits) {
        issues.push({
          pattern: 'UNTYPED_EMITS',
          severity: 'MEDIUM',
          message: `emit('${eventName}') call lacks type safety`,
          location: this.getLineColumnFromIndex(scriptContent, match.index),
          refactoring: 'Use typed defineEmits with proper payload types'
        });
      }
    }

    return issues;
  }
  detectRefTypeInferenceIssues(sfc, filePath) {
    const issues = [];
    const script = sfc.descriptor.script;
    const template = sfc.descriptor.template;

    if (!script || !script.content) return issues;

    const scriptContent = script.content;

    // Check for ref(null) without explicit type
    const refNullPattern = /\bref\s*\(\s*null\s*\)/g;
    let match;

    while ((match = refNullPattern.exec(scriptContent)) !== null) {
      // Check if there's no generic type parameter before this
      const beforeRef = scriptContent.substring(0, match.index);
      const hasGenericType = beforeRef.match(/ref\s*<[^>]+>\s*$/);

      if (!hasGenericType) {
        issues.push({
          pattern: 'REF_TYPE_INFERENCE_ISSUES',
          severity: 'MEDIUM',
          message: 'ref(null) without explicit type leads to incorrect null handling',
          location: this.getLineColumnFromIndex(scriptContent, match.index),
          refactoring: 'Add explicit type: ref<string | null>(null) or ref<string>(undefined)'
        });
      }
    }

    // Check for ref<T>() without initial value (results in T | undefined)
    const refGenericPattern = /\bref\s*<([^>]+)>\s*\(\s*\)/g;

    while ((match = refGenericPattern.exec(scriptContent)) !== null) {
      const genericType = match[1].trim();

      // If it's not explicitly typed to include undefined, this could be problematic
      if (!genericType.includes('undefined') && !genericType.includes('| undefined')) {
        issues.push({
          pattern: 'REF_TYPE_INFERENCE_ISSUES',
          severity: 'LOW',
          message: `ref<${genericType}>() without initial value results in ${genericType} | undefined`,
          location: this.getLineColumnFromIndex(scriptContent, match.index),
          refactoring: `Provide initial value: ref<${genericType}>(${this.suggestDefaultValue(genericType)}) or type as ref<${genericType} | undefined>()`
        });
      }
    }

    // Check template refs without proper typing
    if (template && template.content) {
      const templateContent = template.content;

      // Find ref attributes in template
      const refAttributePattern = /\bref\s*=\s*["']([^"']+)["']/g;

      while ((match = refAttributePattern.exec(templateContent)) !== null) {
        const refName = match[1];

        // Check if this ref is declared in script with proper typing
        if (!this.hasProperTemplateRefType(scriptContent, refName)) {
          issues.push({
            pattern: 'REF_TYPE_INFERENCE_ISSUES',
            severity: 'MEDIUM',
            message: `Template ref '${refName}' lacks HTMLElement | null typing`,
            location: this.getLineColumnFromIndex(templateContent, match.index),
            refactoring: `Declare with type: const ${refName} = ref<HTMLElement | null>(null)`
          });
        }
      }
    }

    // Check for ref(undefined) which is often a sign of incorrect typing
    const refUndefinedPattern = /\bref\s*\(\s*undefined\s*\)/g;

    while ((match = refUndefinedPattern.exec(scriptContent)) !== null) {
      issues.push({
        pattern: 'REF_TYPE_INFERENCE_ISSUES',
        severity: 'LOW',
        message: 'ref(undefined) may indicate incorrect type inference',
        location: this.getLineColumnFromIndex(scriptContent, match.index),
        refactoring: 'Use ref<T | undefined>() or provide proper initial value'
      });
    }

    return issues;
  }
  detectImplementationTesting(sfc, filePath) {
    const issues = [];
    const script = sfc.descriptor.script;

    if (!script || !script.content) return issues;

    const scriptContent = script.content;

    // Only check test files
    if (!filePath.includes('.spec.') && !filePath.includes('.test.') &&
        !filePath.includes('__tests__') && !filePath.includes('/tests/')) {
      return issues;
    }

    // Detect testing internal component state
    const internalStatePatterns = [
      // Accessing wrapper.vm internal properties
      /\bwrapper\.vm\.\w+/g,
      // setData() calls (Vue Test Utils)
      /\bsetData\s*\(/g,
      // Direct state manipulation in tests
      /\bwrapper\.setProps\s*\(/g,
      // Testing computed properties directly
      /expect\(.*\.computed\./g,
      // Testing data properties directly
      /expect\(.*\.data\./g
    ];

    internalStatePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(scriptContent)) !== null) {
        const matchedText = match[0];

        issues.push({
          pattern: 'IMPLEMENTATION_TESTING',
          severity: 'MEDIUM',
          message: `Test accesses internal implementation: ${matchedText}`,
          location: this.getLineColumnFromIndex(scriptContent, match.index),
          refactoring: 'Test behavior (rendered output, events) instead of internal state'
        });
      }
    });

    // Detect tests that don't interact with the component (no user actions)
    const testBlocks = scriptContent.match(/(?:it|test|describe)\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*\([^)]*\)\s*=>\s*\{([\s\S]*?)\}\s*\)/g) || [];

    testBlocks.forEach(testBlock => {
      const testMatch = testBlock.match(/(?:it|test|describe)\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*\([^)]*\)\s*=>\s*\{([\s\S]*?)\}\s*\)/);
      if (testMatch) {
        const testName = testMatch[1];
        const testBody = testMatch[3];

        // Check if test has user interactions or behavior assertions
        const hasInteractions = /\b(trigger|click|type|fill|select|check|uncheck)\b/i.test(testBody);
        const hasEventAssertions = /emitted|emit/i.test(testBody);
        const hasOutputAssertions = /text|html|classes|attributes|find/i.test(testBody);

        const hasBehaviorTesting = hasInteractions || hasEventAssertions || hasOutputAssertions;

        // Check for internal state testing
        const hasInternalTesting = /\b(wrapper\.vm|setData|\.data\.|\.computed\.)/.test(testBody);

        if (hasInternalTesting && !hasBehaviorTesting) {
          issues.push({
            pattern: 'IMPLEMENTATION_TESTING',
            severity: 'HIGH',
            message: `Test "${testName}" only tests internal implementation without behavior verification`,
            location: this.getLineColumnFromIndex(scriptContent, scriptContent.indexOf(testBlock)),
            refactoring: 'Add behavior assertions: expect(wrapper.text()).toContain("expected") or expect(wrapper.emitted()).toHaveProperty("event")'
          });
        }
      }
    });

    return issues;
  }
  detectPiniaStateLeak(sfc, filePath) {
    const issues = [];
    const script = sfc.descriptor.script;

    if (!script || !script.content) return issues;

    const scriptContent = script.content;

    // Only check test files
    if (!filePath.includes('.spec.') && !filePath.includes('.test.') &&
        !filePath.includes('__tests__') && !filePath.includes('/tests/')) {
      return issues;
    }

    // Check if file uses Pinia stores
    const usesPinia = /\buseStore\b|\bdefineStore\b|\bcreatePinia\b/.test(scriptContent);

    if (!usesPinia) return issues;

    // Check for proper test isolation setup
    const hasBeforeEach = /\bbeforeEach\s*\(/.test(scriptContent);
    const hasSetActivePinia = /setActivePinia\s*\(\s*createPinia\s*\(\s*\)\s*\)/.test(scriptContent);

    // Check for proper setup in test frameworks
    const hasTestSetup = /setup\s*\(\s*\)\s*=>\s*\{[\s\S]*?setActivePinia[\s\S]*?\}/.test(scriptContent);

    if (hasBeforeEach && !hasSetActivePinia && !hasTestSetup) {
      issues.push({
        pattern: 'PINIA_STATE_LEAK',
        severity: 'CRITICAL',
        message: 'Test file uses Pinia stores without proper isolation - state pollution between tests',
        location: this.getLineColumnFromIndex(scriptContent, scriptContent.indexOf('beforeEach')),
        refactoring: 'Add to beforeEach: setActivePinia(createPinia()) or use createTestingPinia()'
      });
    }

    // Check if using stores without any setup
    if (!hasBeforeEach && !hasSetActivePinia && !hasTestSetup && usesPinia) {
      // Find first useStore call
      const firstUseStore = scriptContent.search(/\buseStore\b/);

      if (firstUseStore !== -1) {
        issues.push({
          pattern: 'PINIA_STATE_LEAK',
          severity: 'HIGH',
          message: 'Pinia store used in tests without proper setup - may cause shared state between tests',
          location: this.getLineColumnFromIndex(scriptContent, firstUseStore),
          refactoring: 'Add beforeEach(() => { setActivePinia(createPinia()) }) or use createTestingPinia()'
        });
      }
    }

    // Check for multiple stores used without isolation
    const storeCalls = scriptContent.match(/\buseStore\s*\(/g) || [];
    if (storeCalls.length > 1 && !hasSetActivePinia && !hasTestSetup) {
      issues.push({
        pattern: 'PINIA_STATE_LEAK',
        severity: 'MEDIUM',
        message: 'Multiple Pinia stores used without test isolation setup',
        location: this.getLineColumnFromIndex(scriptContent, scriptContent.indexOf('useStore')),
        refactoring: 'Isolate store instances: beforeEach(() => setActivePinia(createPinia()))'
      });
    }

    return issues;
  }
  detectSnapshotOveruse(sfc, filePath) {
    const issues = [];
    const script = sfc.descriptor.script;

    if (!script || !script.content) return issues;

    const scriptContent = script.content;

    // Only check test files
    if (!filePath.includes('.spec.') && !filePath.includes('.test.') &&
        !filePath.includes('__tests__') && !filePath.includes('/tests/')) {
      return issues;
    }

    // Count different types of tests
    const snapshotTests = (scriptContent.match(/\.toMatchSnapshot\(\)/g) || []).length;
    const inlineSnapshotTests = (scriptContent.match(/\.toMatchInlineSnapshot\s*\(/g) || []).length;
    const totalSnapshots = snapshotTests + inlineSnapshotTests;

    // Count total test cases
    const totalTests = (scriptContent.match(/\b(?:it|test|describe)\s*\(/g) || []).length;

    // Calculate snapshot ratio
    const snapshotRatio = totalTests > 0 ? totalSnapshots / totalTests : 0;

    // Check for excessive snapshot usage
    if (snapshotRatio > 0.5) {
      const percentage = Math.round(snapshotRatio * 100);
      issues.push({
        pattern: 'SNAPSHOT_OVERUSE',
        severity: snapshotRatio > 0.8 ? 'HIGH' : 'MEDIUM',
        message: `${percentage}% of tests use snapshots (${totalSnapshots}/${totalTests}) - reduces test effectiveness`,
        location: this.getLineColumnFromIndex(scriptContent, 0),
        refactoring: 'Replace snapshots with specific assertions: expect(element).toHaveTextContent("expected") or expect(result).toEqual(expectedValue)'
      });
    }

    // Check for snapshot-only test files
    if (totalTests === totalSnapshots && totalTests > 0) {
      issues.push({
        pattern: 'SNAPSHOT_OVERUSE',
        severity: 'HIGH',
        message: 'Test file contains only snapshot tests - provides no behavioral verification',
        location: this.getLineColumnFromIndex(scriptContent, 0),
        refactoring: 'Add behavioral assertions alongside snapshots or replace with specific expectations'
      });
    }

    // Check for large snapshot test blocks (indicating snapshot abuse)
    const snapshotBlocks = scriptContent.match(/expect\([^)]+\)\.toMatchSnapshot\(\)/g) || [];

    snapshotBlocks.forEach(block => {
      // Check if this is testing a large object/complex structure
      if (block.includes('wrapper.') || block.includes('component.') ||
          block.includes('mount(') || block.includes('shallowMount(')) {

        issues.push({
          pattern: 'SNAPSHOT_OVERUSE',
          severity: 'LOW',
          message: 'Snapshot testing component output - consider specific assertions for better test clarity',
          location: this.getLineColumnFromIndex(scriptContent, scriptContent.indexOf(block)),
          refactoring: 'Test specific behaviors: expect(wrapper.text()).toBe("expected") instead of snapshot'
        });
      }
    });

    // Check for multiple snapshots in a single test
    const testBlocks = scriptContent.match(/(?:it|test)\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*\([^)]*\)\s*=>\s*\{([\s\S]*?)\}\s*\)/g) || [];

    testBlocks.forEach(testBlock => {
      const testMatch = testBlock.match(/(?:it|test)\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*\([^)]*\)\s*=>\s*\{([\s\S]*?)\}\s*\)/);
      if (testMatch) {
        const testName = testMatch[1];
        const testBody = testMatch[3];

        const snapshotsInTest = (testBody.match(/\.toMatchSnapshot\(\)/g) || []).length;

        if (snapshotsInTest > 1) {
          issues.push({
            pattern: 'SNAPSHOT_OVERUSE',
            severity: 'MEDIUM',
            message: `Test "${testName}" uses ${snapshotsInTest} snapshots - test multiple behaviors separately`,
            location: this.getLineColumnFromIndex(scriptContent, scriptContent.indexOf(testBlock)),
            refactoring: 'Split into separate tests or use specific assertions for each behavior'
          });
        }
      }
    });

    return issues;
  }

  analyzeVuexStore(storeBlock) {
    // Extract state properties
    const stateMatch = storeBlock.match(/state\s*:\s*\{([^}]*)\}/);
    const stateCount = stateMatch ? (stateMatch[1].match(/,/g) || []).length + 1 : 0;

    // Extract mutations
    const mutationsMatch = storeBlock.match(/mutations\s*:\s*\{([^}]*)\}/);
    const mutationsCount = mutationsMatch ?
      (mutationsMatch[1].match(/[a-zA-Z_$][a-zA-Z0-9_$]*\s*\(/g) || []).length : 0;

    // Extract actions
    const actionsMatch = storeBlock.match(/actions\s*:\s*\{([^}]*)\}/);
    const actionsCount = actionsMatch ?
      (actionsMatch[1].match(/[a-zA-Z_$][a-zA-Z0-9_$]*\s*\(/g) || []).length : 0;

    // Extract getters
    const gettersMatch = storeBlock.match(/getters\s*:\s*\{([^}]*)\}/);
    const gettersCount = gettersMatch ?
      (gettersMatch[1].match(/[a-zA-Z_$][a-zA-Z0-9_$]*\s*\(/g) || []).length : 0;

    // Count total lines
    const totalLines = storeBlock.split('\n').length;

    return {
      stateCount,
      mutationsCount,
      actionsCount,
      gettersCount,
      totalLines
    };
  }

  getVuexThreshold(type, count) {
    const thresholds = {
      state: { LOW: 10, MEDIUM: 20, HIGH: 40, CRITICAL: 50 },
      mutations: { LOW: 10, MEDIUM: 20, HIGH: 35, CRITICAL: 50 },
      actions: { LOW: 8, MEDIUM: 15, HIGH: 25, CRITICAL: 40 },
      getters: { LOW: 10, MEDIUM: 20, HIGH: 35, CRITICAL: 50 }
    };

    const threshold = thresholds[type];
    if (!threshold) return { level: 'OK' };

    if (count > threshold.CRITICAL) return { level: 'CRITICAL' };
    if (count > threshold.HIGH) return { level: 'HIGH' };
    if (count > threshold.MEDIUM) return { level: 'MEDIUM' };
    if (count > threshold.LOW) return { level: 'LOW' };

    return { level: 'OK' };
  }

  getVuexLocThreshold(lines) {
    if (lines > 1000) return { level: 'CRITICAL' };
    if (lines > 700) return { level: 'HIGH' };
    if (lines > 400) return { level: 'MEDIUM' };
    if (lines > 200) return { level: 'LOW' };

    return { level: 'OK' };
  }

  extractFunctionCall(scriptContent, startIndex) {
    // Find the function call starting from startIndex
    const callStart = scriptContent.indexOf('(', startIndex);
    if (callStart === -1) return null;

    let parenCount = 0;
    let callEnd = callStart;

    for (let i = callStart; i < scriptContent.length; i++) {
      if (scriptContent[i] === '(') {
        parenCount++;
      } else if (scriptContent[i] === ')') {
        parenCount--;
        if (parenCount === 0) {
          callEnd = i;
          break;
        }
      }
    }

    if (callEnd === callStart) return null;

    const callContent = scriptContent.substring(callStart + 1, callEnd);
    const args = this.parseFunctionArgs(callContent);

    return {
      fullCall: scriptContent.substring(startIndex, callEnd + 1),
      args: args
    };
  }

  parseFunctionArgs(argsString) {
    const args = [];
    let currentArg = '';
    let parenCount = 0;
    let inString = false;
    let stringChar = '';

    for (let i = 0; i < argsString.length; i++) {
      const char = argsString[i];

      if (!inString) {
        if (char === '"' || char === "'") {
          inString = true;
          stringChar = char;
        } else if (char === '(') {
          parenCount++;
        } else if (char === ')') {
          parenCount--;
        } else if (char === ',' && parenCount === 0) {
          args.push(currentArg.trim());
          currentArg = '';
          continue;
        }
      } else {
        if (char === stringChar && argsString[i - 1] !== '\\') {
          inString = false;
          stringChar = '';
        }
      }

      currentArg += char;
    }

    if (currentArg.trim()) {
      args.push(currentArg.trim());
    }

    return args;
  }

  hasRouteCheckBeforeRedirect(guardBody, redirectPath, redirectCall) {
    // Get the code before the redirect call
    const beforeRedirect = guardBody.substring(0, guardBody.indexOf(redirectCall));

    // Check for route path/name checking
    const routeChecks = [
      new RegExp(`to\.path\s*!==?\s*['"]${this.escapeRegex(redirectPath)}['"]`, 'g'),
      new RegExp(`to\.path\s*!==?\s*['"]${this.escapeRegex('/' + redirectPath)}['"]`, 'g'),
      new RegExp(`from\.path\s*===?\s*['"]${this.escapeRegex(redirectPath)}['"]`, 'g'),
      new RegExp(`to\.name\s*!==?\s*['"]${this.escapeRegex(redirectPath)}['"]`, 'g'),
      new RegExp(`to\.meta\.requiresAuth`, 'g'),
      new RegExp(`isAuthenticated`, 'g'),
      /\bif\s*\(/g  // Any if condition
    ];

    return routeChecks.some(check => check.test(beforeRedirect));
  }

  analyzeGuardResponsibilities(guardBody) {
    const responsibilities = [];

    // Authentication checks
    if (/\b(?:isAuthenticated|isLoggedIn|checkAuth|token|auth)\b/i.test(guardBody)) {
      responsibilities.push('authentication');
    }

    // Route permission checks
    if (/\b(?:hasPermission|checkPermission|canAccess|role|roles)\b/i.test(guardBody)) {
      responsibilities.push('permissions');
    }

    // Redirect logic
    if (/\bnext\s*\(\s*['"`]/.test(guardBody) || /return\s+['"`]/.test(guardBody)) {
      responsibilities.push('redirection');
    }

    // Data fetching/loading
    if (/\b(?:fetch|axios|api|loadData|getData)\b/i.test(guardBody)) {
      responsibilities.push('data-fetching');
    }

    // Analytics/logging
    if (/\b(?:analytics|track|log|console\.|gtag|segment)\b/i.test(guardBody)) {
      responsibilities.push('analytics');
    }

    // Route meta validation
    if (/\bto\.meta\b/i.test(guardBody)) {
      responsibilities.push('meta-validation');
    }

    // Loading states
    if (/\b(?:loading|isLoading|setLoading)\b/i.test(guardBody)) {
      responsibilities.push('loading-states');
    }

    // Title/document manipulation
    if (/\b(?:document\.title|document\.|title\s*=)\b/i.test(guardBody)) {
      responsibilities.push('document-manipulation');
    }

    // Store/state management
    if (/\b(?:store|commit|dispatch|useStore)\b/i.test(guardBody)) {
      responsibilities.push('state-management');
    }

    // Error handling
    if (/\b(?:catch|error|try|throw)\b/i.test(guardBody) || /next\s*\(\s*error/i.test(guardBody)) {
      responsibilities.push('error-handling');
    }

    return responsibilities;
  }

  getGodGuardSeverity(responsibilityCount, lineCount) {
    if (responsibilityCount > 5 || lineCount > 100) return 'CRITICAL';
    if (responsibilityCount > 4 || lineCount > 75) return 'HIGH';
    if (responsibilityCount > 3 || lineCount > 50) return 'MEDIUM';
    if (responsibilityCount > 2 || lineCount > 30) return 'LOW';

    return 'OK';
  }

  isCommonJSLibrary(libraryName) {
    // Libraries that are primarily CommonJS and don't support tree-shaking well
    const commonJSLibs = [
      'lodash', // unless using lodash-es
      'underscore',
      'jquery',
      'bluebird',
      'q',
      'async',
      'request',
      'express',
      'chalk',
      'colors',
      'commander'
    ];

    return commonJSLibs.includes(libraryName) &&
           !libraryName.includes('-es') && // exclude lodash-es, etc.
           !libraryName.includes('/es/'); // exclude sub-path imports
  }

  suggestSpecificImports(libraryName) {
    const suggestions = {
      'lodash': 'map, filter, find, cloneDeep',
      'underscore': 'map, filter, find, clone',
      'moment': 'format, add, subtract, isValid',
      'jquery': 'ajax, get, post, on',
      'axios': 'get, post, put, delete'
    };

    return suggestions[libraryName] || 'specificFunction';
  }

  isUntypedPropsDefinition(propsDefinition) {
    // Empty or just whitespace
    if (!propsDefinition || propsDefinition.trim() === '') {
      return true;
    }

    // Check if it's a typed generic call: defineProps<{...}>()
    if (propsDefinition.includes('<') && propsDefinition.includes('>')) {
      return false; // Has TypeScript generics
    }

    // Check for withDefaults wrapper
    if (propsDefinition.includes('withDefaults')) {
      return false; // Likely typed
    }

    // Check for PropType usage: PropType<string>
    if (propsDefinition.includes('PropType')) {
      return false; // Has PropType
    }

    // If it's not empty and doesn't have typing, it's untyped
    return propsDefinition.trim() !== '';
  }

  extractPropDefinitions(propsBlock) {
    const propDefinitions = [];
    const propPattern = /(\w+):\s*(\{[^}]*\}|\w+)/g;
    let match;

    while ((match = propPattern.exec(propsBlock)) !== null) {
      propDefinitions.push({
        name: match[1],
        definition: match[2],
        offset: match.index
      });
    }

    return propDefinitions;
  }

  isUntypedOptionsProp(propDefinition) {
    // If it's just a type reference without object definition
    if (!propDefinition.includes('{') && !propDefinition.includes('}')) {
      // Simple type reference like 'String' - this is actually typed
      return false;
    }

    // If it's an object definition, check if it has type property
    if (propDefinition.includes('{') && propDefinition.includes('}')) {
      return !propDefinition.includes('type:');
    }

    return false;
  }

  isUntypedEmitsDefinition(emitsDefinition) {
    // Empty or just whitespace
    if (!emitsDefinition || emitsDefinition.trim() === '') {
      return true;
    }

    // Check if it's a typed generic call: defineEmits<{...}>()
    if (emitsDefinition.includes('<') && emitsDefinition.includes('>')) {
      return false; // Has TypeScript generics
    }

    // Check for array syntax: ['event1', 'event2'] - this is untyped
    if (emitsDefinition.startsWith('[') && emitsDefinition.endsWith(']')) {
      return true;
    }

    // If it's not empty and doesn't have typing, it's untyped
    return emitsDefinition.trim() !== '';
  }

  hasTypedEmitsContext(scriptContent, emitCallIndex) {
    // Look backwards from the emit call to find defineEmits
    const beforeEmit = scriptContent.substring(0, emitCallIndex);

    // Check if there's a typed defineEmits before this emit call
    const typedDefineEmitsPattern = /defineEmits\s*<[^>]+>/g;
    const lastTypedDefineEmits = this.findLastMatch(beforeEmit, typedDefineEmitsPattern);

    if (lastTypedDefineEmits !== -1) {
      return true;
    }

    // Check if we're in an Options API component with typed emits
    const optionsEmitsPattern = /emits:\s*\{[^}]*\}/g;
    const lastOptionsEmits = this.findLastMatch(beforeEmit, optionsEmitsPattern);

    return lastOptionsEmits !== -1;
  }

  findLastMatch(text, pattern) {
    const matches = [...text.matchAll(pattern)];
    return matches.length > 0 ? matches[matches.length - 1].index : -1;
  }

  hasProperTemplateRefType(scriptContent, refName) {
    // Look for the ref declaration
    const refDeclarationPattern = new RegExp(`const\\s+${this.escapeRegex(refName)}\\s*=\\s*ref\\s*<([^>]+)>`, 'g');
    const match = refDeclarationPattern.exec(scriptContent);

    if (match) {
      const typeDefinition = match[1].trim();

      // Check if it includes HTMLElement and null
      return typeDefinition.includes('HTMLElement') && typeDefinition.includes('null');
    }

    return false;
  }

  estimateWatchedObjectSize(source, scriptContent) {
    // Remove parentheses and whitespace
    const cleanSource = source.replace(/^\(|\)$/g, '').trim();

    // If it's a variable reference, try to find its declaration
    if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(cleanSource)) {
      // Look for reactive/ref declaration
      const reactivePattern = new RegExp(`(?:reactive|ref)\\s*\\(\\s*(\\{[^}]*\\})`, 'g');
      let match;

      while ((match = reactivePattern.exec(scriptContent)) !== null) {
        const objectLiteral = match[1];
        const propertyCount = (objectLiteral.match(/,/g) || []).length + 1;
        return propertyCount;
      }

      // Look for variable assignment to object/array
      const assignmentPattern = new RegExp(`${this.escapeRegex(cleanSource)}\\s*=\\s*(\\{[^}]*\\}|\\[[^\\]]*\\])`, 'g');

      while ((match = assignmentPattern.exec(scriptContent)) !== null) {
        const value = match[1];
        if (value.startsWith('{')) {
          // Object literal
          const propertyCount = (value.match(/,/g) || []).length + 1;
          return propertyCount;
        } else if (value.startsWith('[')) {
          // Array literal
          const itemCount = (value.match(/,/g) || []).length + 1;
          return itemCount;
        }
      }

      // Assume medium size for unknown variables
      return 25;
    }

    // If it's an inline object literal
    if (cleanSource.startsWith('{') && cleanSource.endsWith('}')) {
      const propertyCount = (cleanSource.match(/,/g) || []).length + 1;
      return propertyCount;
    }

    // If it's an inline array literal
    if (cleanSource.startsWith('[') && cleanSource.endsWith(']')) {
      const itemCount = (cleanSource.match(/,/g) || []).length + 1;
      return itemCount;
    }

    return 10; // Default conservative estimate
  }

  analyzeWatcherBody(body) {
    // Remove comments and normalize whitespace
    const cleanBody = body.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '').trim();

    // Check for side effects (anything other than assignments to reactive state)
    const hasSideEffects = /\b(console\.|fetch\(|setTimeout\(|setInterval\(|clearTimeout\(|clearInterval\(|document\.|window\.|localStorage\.|sessionStorage\.)/.test(cleanBody);

    // Check for async operations
    const hasAsync = /\b(async|await|Promise\.|then\(|catch\(|finally\()/.test(cleanBody);

    // Check for reactive assignments
    const reactiveAssignments = cleanBody.match(/\b\w+\.value\s*=\s*[^;]+/g) || [];
    const reactiveObjAssignments = cleanBody.match(/\b\w+\.\w+\s*=\s*[^;]+/g) || [];

    const totalAssignments = reactiveAssignments.length + reactiveObjAssignments.length;

    // Check if only assignments (no other statements)
    const statements = cleanBody.split(';').map(s => s.trim()).filter(s => s.length > 0);
    const assignmentStatements = statements.filter(stmt =>
      stmt.includes('.value =') || (stmt.includes('=') && !stmt.includes('const ') && !stmt.includes('let ') && !stmt.includes('var '))
    );

    const onlyAssignsToState = statements.length === assignmentStatements.length && statements.length > 0;

    return {
      isPure: !hasSideEffects && !hasAsync,
      onlyAssignsToState: onlyAssignsToState,
      hasReactiveAssignments: totalAssignments > 0,
      multipleAssignments: totalAssignments > 1,
      totalAssignments: totalAssignments
    };
  }

  suggestDefaultValue(type) {
    const defaults = {
      'string': "''",
      'number': '0',
      'boolean': 'false',
      'string[]': '[]',
      'number[]': '[]',
      'boolean[]': '[]',
      'object': '{}',
      'Array': '[]',
      'Object': '{}'
    };

    // Handle array types
    if (type.endsWith('[]')) {
      return '[]';
    }

    // Handle union types - take first type
    const unionType = type.split('|')[0].trim();

    return defaults[unionType] || 'null';
  }
}

module.exports = VueAntiPatternDetector;