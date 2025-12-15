# Vue Anti-Pattern Detector

A comprehensive Vue.js static analysis tool that detects 67+ anti-patterns based on formal Z-notation specifications. This tool helps maintain code quality by identifying problematic patterns that can lead to bugs, performance issues, and maintainability problems.

## Features

- **67 Anti-Pattern Detectors** across 6 categories:
  - Template anti-patterns (v-if/v-for conflicts, missing keys, complex expressions)
  - Component architecture smells (god components, prop drilling, tight coupling)
  - Reactivity system issues (ref/reactive confusion, side effects in computed)
  - State management problems (Vuex async mutations, Pinia circular dependencies)
  - Performance bottlenecks (missing virtualization, memory leaks)
  - TypeScript integration issues (untyped props, missing type safety)

- **Formal Mathematical Detection** using Z-notation predicates
- **Configurable Severity Levels** (CRITICAL, HIGH, MEDIUM, LOW)
- **Multiple Output Formats** (console, JSON, HTML reports)
- **CLI and Programmatic API** support
- **Customizable Thresholds** for different project requirements

## Installation

```bash
npm install -g vue-anti-pattern-detector
```

Or for local development:
```bash
npm install
```

## Quick Start

Analyze Vue files in your project:

```bash
vue-anti-pattern-detector analyze "src/**/*.vue"
```

Generate an HTML report:

```bash
vue-anti-pattern-detector analyze "src/**/*.vue" --format html --output report.html
```

## Usage

### CLI Commands

#### Analyze Files
```bash
vue-anti-pattern-detector analyze <patterns> [options]
```

**Arguments:**
- `patterns`: Glob patterns for Vue files (e.g., `"src/**/*.vue"`, `"components/**/*.vue"`)

**Options:**
- `-f, --format <format>`: Output format (`console`, `json`, `html`) [default: `console`]
- `-o, --output <file>`: Save report to file
- `-v, --verbose`: Show detailed refactoring suggestions
- `-c, --config <file>`: Use custom configuration file
- `--threshold-*`: Override specific thresholds (see configuration)

**Examples:**
```bash
# Basic analysis
vue-anti-pattern-detector analyze "src/**/*.vue"

# Generate HTML report with verbose output
vue-anti-pattern-detector analyze "src/**/*.vue" --format html --output analysis.html --verbose

# Use custom configuration
vue-anti-pattern-detector analyze "src/**/*.vue" --config .vue-analysis.json

# Override specific thresholds
vue-anti-pattern-detector analyze "src/**/*.vue" --threshold-template-expression-length 50
```

#### Initialize Configuration
```bash
vue-anti-pattern-detector init [--force]
```

Creates a default configuration file (`.vue-anti-pattern-detector.json`) with all available thresholds and options.

#### List Available Patterns
```bash
vue-anti-pattern-detector patterns
```

Shows all 67+ anti-pattern detectors organized by category.

## Configuration

Create a configuration file using:

```bash
vue-anti-pattern-detector init
```

This creates `.vue-anti-pattern-detector.json`:

```json
{
  "thresholds": {
    "templateExpressionLength": 40,
    "templateDepth": 6,
    "componentScriptLength": 500,
    "componentMethodCount": 20,
    "virtualizationThreshold": 500,
    "shallowReactivityThreshold": 1000
  },
  "exclude": [
    "node_modules/**",
    "dist/**",
    "**/*.test.vue"
  ],
  "rules": {
    // Enable/disable specific rules
  }
}
```

### Threshold Configuration

| Threshold | Default | Description |
|-----------|---------|-------------|
| `templateExpressionLength` | 40 | Maximum characters in template expressions |
| `templateDepth` | 6 | Maximum template nesting depth |
| `componentScriptLength` | 500 | Maximum lines in component script |
| `componentMethodCount` | 20 | Maximum methods per component |
| `componentPropsCount` | 15 | Maximum props per component |
| `virtualizationThreshold` | 500 | Minimum list size requiring virtualization |
| `shallowReactivityThreshold` | 1000 | Object size threshold for shallow reactivity |

## Programmatic API

```javascript
const { VueAntiPatternDetector, VueAntiPatternReporter } = require('vue-anti-pattern-detector');

// Analyze a single file
const detector = new VueAntiPatternDetector();
const result = detector.analyzeFile('path/to/Component.vue', fileContent);

// Analyze multiple files
const files = [
  { path: 'ComponentA.vue', content: contentA },
  { path: 'ComponentB.vue', content: contentB }
];

const { results, report } = analyzeFiles(files, {
  format: 'json',
  verbose: true
});
```

## Anti-Pattern Categories

### Template Anti-Patterns
- **VIF_WITH_VFOR**: `v-if` and `v-for` on same element (CRITICAL)
- **VFOR_WITHOUT_KEY**: Missing `:key` in v-for loops
- **COMPLEX_TEMPLATE_EXPRESSION**: Excessive inline logic
- **VHTML_XSS_RISK**: Unsanitized dynamic HTML
- **DEEP_TEMPLATE_NESTING**: Excessive template depth

### Component Architecture
- **GOD_COMPONENT**: Monolithic components with too many responsibilities
- **SINGLE_WORD_COMPONENT_NAME**: HTML element naming conflicts
- **PROP_DRILLING**: Excessive props passing through levels
- **TIGHT_COUPLING**: Direct parent/child manipulation

### Reactivity System
- **REF_REACTIVE_CONFUSION**: Incorrect reactive primitive usage
- **DESTRUCTURING_REACTIVITY_LOSS**: Breaking reactive connections
- **COMPUTED_SIDE_EFFECTS**: Impure computed properties
- **DEEP_WATCHER_OVERUSE**: Expensive deep observation

### State Management
- **VUEX_ASYNC_IN_MUTATION**: Asynchronous mutation handlers
- **VUEX_GOD_STORE**: Monolithic store modules
- **PINIA_CIRCULAR_DEPENDENCY**: Cross-store initialization issues
- **UNTYPED_PROVIDE_INJECT**: Missing type safety in dependency injection

### Performance
- **LARGE_LIST_NO_VIRTUALIZATION**: DOM explosion without virtualization
- **MISSING_SHALLOW_REACTIVITY**: Deep proxy overhead on large objects
- **EVENT_LISTENER_MEMORY_LEAK**: Uncleared global event listeners
- **FULL_LIBRARY_IMPORT**: Tree-shaking failures

### TypeScript Integration
- **UNTYPED_PROPS**: Missing prop type definitions
- **UNTYPED_EMITS**: Missing event payload types
- **REF_TYPE_INFERENCE_ISSUES**: Incorrect ref typing

## Severity Levels

| Level | Priority | Action Required |
|-------|----------|-----------------|
| **CRITICAL** | A (Essential) | Fix immediately - runtime errors, security |
| **HIGH** | B (Strongly Recommended) | Fix before merge - maintainability, performance |
| **MEDIUM** | C (Recommended) | Fix in refactoring cycles |
| **LOW** | D (Use with Caution) | Context-dependent evaluation |

## Integration

### ESLint Plugin
The detector patterns align with existing ESLint rules:

```javascript
// eslint.config.js
module.exports = {
  extends: [
    'plugin:vue/vue3-strongly-recommended'
  ],
  rules: {
    'vue/no-use-v-if-with-v-for': 'error',
    'vue/require-v-for-key': 'error',
    'vue/multi-word-component-names': 'error'
  }
};
```

### CI/CD Integration

```yaml
# .github/workflows/vue-analysis.yml
name: Vue Anti-Pattern Analysis
on: [push, pull_request]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install -g vue-anti-pattern-detector
      - run: vue-anti-pattern-detector analyze "src/**/*.vue" --format json --output analysis.json
      - uses: actions/upload-artifact@v3
        with:
          name: analysis-report
          path: analysis.json
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add your detector implementation
4. Update tests and documentation
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Related

- [Vue.js Style Guide](https://vuejs.org/style-guide/)
- [Vue Mess Detector](https://github.com/dennybiasiolli/vue-mess-detector)
- [ESLint Plugin Vue](https://eslint.vuejs.org/)