#!/usr/bin/env node

/**
 * Vue Anti-Pattern Detector CLI
 * Command-line interface for analyzing Vue.js files
 */

const { Command } = require('commander');
const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const chalk = require('chalk');

const { VueAntiPatternDetector, VueAntiPatternReporter } = require('../index');

const program = new Command();

program
  .name('vue-anti-pattern-detector')
  .description('Vue.js anti-pattern detection tool')
  .version('1.0.0');

// Analyze command
program
  .command('analyze <patterns>')
  .description('Analyze Vue.js files for anti-patterns')
  .option('-f, --format <format>', 'Output format (console, json, html)', 'console')
  .option('-o, --output <file>', 'Save report to file')
  .option('-v, --verbose', 'Show detailed refactoring suggestions')
  .option('-c, --config <file>', 'Use custom configuration file')
  .option('--exclude <patterns>', 'Comma-separated list of patterns to exclude (e.g., "node_modules/**,dist/**")')
  .option('--threshold-template-expression-length <number>', 'Override template expression length threshold')
  .option('--threshold-template-depth <number>', 'Override template depth threshold')
  .option('--threshold-component-script-length <number>', 'Override component script length threshold')
  .option('--threshold-component-method-count <number>', 'Override component method count threshold')
  .action(async (patterns, options) => {
    try {
      // Load custom config if specified
      let config = {};
      if (options.config) {
        const configPath = path.resolve(options.config);
        if (await fs.pathExists(configPath)) {
          config = await fs.readJson(configPath);
        } else {
          console.error(chalk.red(`Configuration file not found: ${configPath}`));
          process.exit(1);
        }
      }

      // Parse exclude patterns from CLI option and config
      const excludePatterns = [];
      if (options.exclude) {
        excludePatterns.push(...options.exclude.split(',').map(p => p.trim()));
      }
      if (config.exclude && Array.isArray(config.exclude)) {
        excludePatterns.push(...config.exclude);
      }

      // Apply threshold overrides
      const thresholds = {};
      if (options.thresholdTemplateExpressionLength) {
        thresholds.templateExpressionLength = parseInt(options.thresholdTemplateExpressionLength);
      }
      if (options.thresholdTemplateDepth) {
        thresholds.templateDepth = parseInt(options.thresholdTemplateDepth);
      }
      if (options.thresholdComponentScriptLength) {
        thresholds.componentScriptLength = parseInt(options.thresholdComponentScriptLength);
      }
      if (options.thresholdComponentMethodCount) {
        thresholds.componentMethodCount = parseInt(options.thresholdComponentMethodCount);
      }

      // Initialize detector and reporter
      const detectorOptions = {
        ...config,
        thresholds: { ...config.thresholds, ...thresholds },
        verbose: options.verbose
      };

      const detector = new VueAntiPatternDetector(detectorOptions);
      const reporter = new VueAntiPatternReporter({
        format: options.format,
        verbose: options.verbose,
        outputFile: options.output
      });

      // Find files matching patterns
      const files = [];
      for (const pattern of patterns.split(',').map(p => p.trim())) {
        let globPattern = pattern;

        // If pattern is a directory, automatically search for .vue files within it
        try {
          const stat = fs.statSync(pattern);
          if (stat.isDirectory()) {
            // Check if pattern ends with a path separator, if not add one
            const pathWithSep = pattern.endsWith('/') ? pattern : pattern + '/';
            globPattern = pathWithSep + '**/*.vue';
            console.log(chalk.gray(`Searching for Vue files in directory: ${pattern}`));
          }
        } catch (error) {
          // Pattern is not a valid directory path, treat as glob pattern
          // If it doesn't contain glob characters, try to make it find .vue files
          if (!pattern.includes('*') && !pattern.includes('?') && !pattern.includes('{')) {
            // Check if it's a file path
            try {
              const stat = fs.statSync(pattern);
              if (stat.isFile()) {
                // It's a single file, use as-is
                globPattern = pattern;
              } else {
                // Not a file or directory, might be a pattern like "src/components"
                globPattern = pattern + '/**/*.vue';
              }
            } catch (fileError) {
              // Pattern doesn't exist as file, treat as directory pattern
              globPattern = pattern + '/**/*.vue';
            }
          }
        }

        const globOptions = { absolute: true };
        if (excludePatterns.length > 0) {
          // Adjust exclude patterns to be relative to the search root
          let adjustedExcludePatterns = excludePatterns;

          // If globPattern starts with a directory path (like 'vue3-enterprise-boilerplate/**/*.vue'),
          // we need to prefix exclude patterns with that directory
          const pathParts = globPattern.split('/');
          if (pathParts.length > 1 && !pathParts[0].includes('*')) {
            // Find the directory part (everything before the first **)
            const dirIndex = pathParts.findIndex(part => part.includes('**'));
            if (dirIndex > 0) {
              const searchRoot = pathParts.slice(0, dirIndex).join('/');
              adjustedExcludePatterns = excludePatterns.map(pattern => {
                // If pattern already starts with the search root, use as-is
                if (pattern.startsWith(searchRoot)) {
                  return pattern;
                }
                // Otherwise, prefix with search root
                return searchRoot + '/' + pattern;
              });
            }
          }

          globOptions.ignore = adjustedExcludePatterns;
        }
        const matches = glob.sync(globPattern, globOptions);
        files.push(...matches);
      }

      if (files.length === 0) {
        console.log(chalk.yellow('No files found matching the specified patterns.'));
        return;
      }

      console.log(chalk.blue(`Analyzing ${files.length} Vue.js file(s)...`));

      // Analyze each file
      const results = [];
      for (const filePath of files) {
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          const result = detector.analyzeFile(filePath, content);
          results.push(result);
        } catch (error) {
          console.error(chalk.red(`Error analyzing ${filePath}: ${error.message}`));
        }
      }

      // Generate and output report
      const report = reporter.generateReport(results);

      if (options.output) {
        await fs.writeFile(options.output, report);
        console.log(chalk.green(`Report saved to: ${options.output}`));
      } else {
        console.log(report);
      }

    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

// Init command
program
  .command('init')
  .description('Initialize configuration file')
  .option('--force', 'Overwrite existing configuration file')
  .action(async (options) => {
    const configPath = '.vue-analysis.json';

    if (!options.force && await fs.pathExists(configPath)) {
      console.log(chalk.yellow('Configuration file already exists. Use --force to overwrite.'));
      return;
    }

    const defaultConfig = {
      thresholds: {
        templateExpressionLength: 40,
        templateDepth: 6,
        componentScriptLength: 500,
        componentMethodCount: 20,
        componentPropsCount: 15,
        componentComputedCount: 10
      },
      exclude: [
        "node_modules/**",
        "dist/**",
        "**/*.test.vue",
        "**/*.spec.vue"
      ],
      verbose: false
    };

    await fs.writeJson(configPath, defaultConfig, { spaces: 2 });
    console.log(chalk.green('Configuration file created: .vue-analysis.json'));
  });

// Test command
program
  .command('test')
  .description('Run tests on the test-files directory')
  .option('-f, --format <format>', 'Output format (console, json, html)', 'console')
  .option('-o, --output <file>', 'Save report to file')
  .action(async (options) => {
    const testFilesDir = path.join(__dirname, '..', 'test-files');
    const pattern = path.join(testFilesDir, '**/*.vue');

    // Use glob directly to find files
    const files = glob.sync(pattern, { absolute: true });

    if (files.length === 0) {
      console.log(chalk.yellow(`No test files found in: ${testFilesDir}`));
      return;
    }

    console.log(chalk.blue(`Found ${files.length} test file(s), analyzing...`));

    // Initialize detector and reporter
    const detector = new VueAntiPatternDetector({ verbose: false });
    const reporter = new VueAntiPatternReporter({
      format: options.format,
      verbose: false,
      outputFile: options.output
    });

    // Analyze each file
    const results = [];
    for (const filePath of files) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const result = detector.analyzeFile(filePath, content);
        results.push(result);
      } catch (error) {
        console.error(chalk.red(`Error analyzing ${filePath}: ${error.message}`));
      }
    }

    // Generate and output report
    const report = reporter.generateReport(results);

    if (options.output) {
      await fs.writeFile(options.output, report);
      console.log(chalk.green(`Test report saved to: ${options.output}`));
    } else {
      console.log(report);
    }
  });

// Error handling
program.on('command:*', (unknownCommand) => {
  console.error(chalk.red(`Unknown command: ${unknownCommand[0]}`));
  console.log(chalk.yellow('Run "vue-anti-pattern-detector --help" for available commands.'));
  process.exit(1);
});

// Parse command line arguments
program.parse();