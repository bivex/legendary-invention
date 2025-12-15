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
      if (node.type === 1 && this.hasDirective(node, 'v-for') && !this.hasAttribute(node, ':key')) {
        const severity = filePath.includes('component') ? 'CRITICAL' : 'HIGH';
        issues.push({
          pattern: 'VFOR_WITHOUT_KEY',
          severity,
          message: 'Missing :key attribute in v-for iteration',
          location: this.getNodeLocation(node),
          refactoring: 'Add :key="uniqueId" to the iterated element'
        });
      }
    });

    return issues;
  }

  detectVForIndexAsKey(sfc, filePath) {
    const issues = [];
    const template = sfc.descriptor.template;

    if (!template) return issues;

    this.traverseTemplate(template.ast, (node) => {
      if (node.type === 1 && this.hasDirective(node, 'v-for')) {
        const keyAttr = this.getAttribute(node, ':key');
        const forDirective = this.getDirective(node, 'v-for');

        if (keyAttr && forDirective) {
          const forMatch = forDirective.value.match(/\(.*,\s*(\w+)\)/);
          if (forMatch && forMatch[1] === keyAttr.value) {
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
    });

    return issues;
  }

  detectComplexTemplateExpression(sfc, filePath) {
    const issues = [];
    const template = sfc.descriptor.template;

    if (!template) return issues;

    this.traverseTemplate(template.ast, (node) => {
      if (node.type === 2) { // Text interpolation
        const expression = node.content;
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
      if (node.type === 1 && this.hasDirective(node, 'v-html')) {
        const vHtmlAttr = this.getDirective(node, 'v-html');
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
  detectRefReactiveConfusion(sfc, filePath) { return []; }
  detectDestructuringReactivityLoss(sfc, filePath) { return []; }
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
  detectDeepWatcherOveruse(sfc, filePath) { return []; }
  detectWatcherShouldBeComputed(sfc, filePath) { return []; }
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
  detectVuexGodStore(sfc, filePath) { return []; }
  detectPiniaCircularDependency(sfc, filePath) { return []; }
  detectPiniaUseStoreAfterAwait(sfc, filePath) { return []; }
  detectStateLocalizationAntipattern(sfc, filePath) { return []; }
  detectUntypedProvideInject(sfc, filePath) { return []; }
  detectInfiniteNavigationLoop(sfc, filePath) { return []; }
  detectMissingLazyLoading(sfc, filePath) { return []; }
  detectGodGuardAntipattern(sfc, filePath) { return []; }
  detectLargeListNoVirtualization(sfc, filePath) { return []; }
  detectMissingShallowReactivity(sfc, filePath) { return []; }
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
  detectFullLibraryImport(sfc, filePath) { return []; }
  detectUntypedProps(sfc, filePath) { return []; }
  detectUntypedEmits(sfc, filePath) { return []; }
  detectRefTypeInferenceIssues(sfc, filePath) { return []; }
  detectImplementationTesting(sfc, filePath) { return []; }
  detectPiniaStateLeak(sfc, filePath) { return []; }
  detectSnapshotOveruse(sfc, filePath) { return []; }
}

module.exports = VueAntiPatternDetector;