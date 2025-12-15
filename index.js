/**
 * Vue Anti-Pattern Detector
 * Main entry point and API exports
 */

const VueAntiPatternDetector = require('./src/core/detector');
const VueAntiPatternReporter = require('./src/reporter');

module.exports = {
  VueAntiPatternDetector,
  VueAntiPatternReporter,

  // Convenience function for programmatic usage
  analyzeFile: (filePath, content, options = {}) => {
    const detector = new VueAntiPatternDetector(options);
    return detector.analyzeFile(filePath, content);
  },

  // Convenience function for analyzing multiple files
  analyzeFiles: (files, options = {}) => {
    const detector = new VueAntiPatternDetector(options);
    const reporter = new VueAntiPatternReporter(options);

    const results = files.map(({ path, content }) =>
      detector.analyzeFile(path, content)
    );

    return {
      results,
      report: reporter.generateReport(results)
    };
  }
};