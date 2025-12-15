/**
 * Reporting system for Vue anti-pattern detection results
 */

const chalk = require('chalk');

class VueAntiPatternReporter {
  constructor(options = {}) {
    this.options = {
      format: options.format || 'console', // console, json, html
      verbose: options.verbose || false,
      outputFile: options.outputFile || null,
      ...options
    };
  }

  /**
   * Generate report from analysis results
   */
  generateReport(results) {
    const summary = this.calculateSummary(results);

    switch (this.options.format) {
      case 'json':
        return this.generateJsonReport(results, summary);
      case 'html':
        return this.generateHtmlReport(results, summary);
      default:
        return this.generateConsoleReport(results, summary);
    }
  }

  /**
   * Calculate summary statistics
   */
  calculateSummary(results) {
    const summary = {
      totalFiles: results.length,
      totalIssues: 0,
      issuesBySeverity: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 },
      issuesByPattern: {},
      filesWithIssues: 0
    };

    results.forEach(fileResult => {
      if (fileResult.issues.length > 0) {
        summary.filesWithIssues++;
        summary.totalIssues += fileResult.issues.length;

        fileResult.issues.forEach(issue => {
          summary.issuesBySeverity[issue.severity]++;
          summary.issuesByPattern[issue.pattern] = (summary.issuesByPattern[issue.pattern] || 0) + 1;
        });
      }
    });

    return summary;
  }

  /**
   * Generate console report
   */
  generateConsoleReport(results, summary) {
    let output = '';

    // Header
    output += chalk.blue.bold('🔍 Vue Anti-Pattern Detection Report\n\n');

    // Summary
    output += chalk.bold('📊 Summary:\n');
    output += `  Files analyzed: ${summary.totalFiles}\n`;
    output += `  Files with issues: ${summary.filesWithIssues}\n`;
    output += `  Total issues: ${summary.totalIssues}\n\n`;

    if (summary.totalIssues > 0) {
      output += chalk.bold('🚨 Issues by severity:\n');
      Object.entries(summary.issuesBySeverity).forEach(([severity, count]) => {
        if (count > 0) {
          const color = this.getSeverityColor(severity);
          output += `  ${chalk[color](severity)}: ${count}\n`;
        }
      });
      output += '\n';

      output += chalk.bold('🔧 Top issues by pattern:\n');
      Object.entries(summary.issuesByPattern)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .forEach(([pattern, count]) => {
          output += `  ${pattern}: ${count}\n`;
        });
      output += '\n';
    }

    // Detailed results
    results.forEach(fileResult => {
      if (fileResult.issues.length > 0) {
        output += chalk.bold.underline(`📁 ${fileResult.filePath}\n`);

        fileResult.issues.forEach(issue => {
          const color = this.getSeverityColor(issue.severity);
          const severityIcon = this.getSeverityIcon(issue.severity);

          output += `  ${severityIcon} ${chalk[color](issue.severity)}: ${issue.message}\n`;
          output += `    Pattern: ${chalk.cyan(issue.pattern)}\n`;
          output += `    Location: Line ${issue.location.line}, Column ${issue.location.column}\n`;

          if (issue.refactoring && this.options.verbose) {
            output += `    💡 Refactoring: ${chalk.yellow(issue.refactoring)}\n`;
          }

          output += '\n';
        });
      }
    });

    // Footer with recommendations
    if (summary.totalIssues > 0) {
      output += chalk.bold('💡 Recommendations:\n');
      if (summary.issuesBySeverity.CRITICAL > 0) {
        output += `  ${chalk.red('•')} Address ${summary.issuesBySeverity.CRITICAL} CRITICAL issues immediately (runtime errors, security risks)\n`;
      }
      if (summary.issuesBySeverity.HIGH > 0) {
        output += `  ${chalk.yellow('•')} Fix ${summary.issuesBySeverity.HIGH} HIGH priority issues before merge (maintainability, performance)\n`;
      }
      if (summary.issuesBySeverity.MEDIUM > 0) {
        output += `  ${chalk.blue('•')} Consider ${summary.issuesBySeverity.MEDIUM} MEDIUM issues in refactoring cycles\n`;
      }
      output += '\n';
    }

    return output;
  }

  /**
   * Generate JSON report
   */
  generateJsonReport(results, summary) {
    return JSON.stringify({
      summary,
      results,
      generatedAt: new Date().toISOString(),
      tool: 'vue-anti-pattern-detector'
    }, null, 2);
  }

  /**
   * Generate HTML report
   */
  generateHtmlReport(results, summary) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vue Anti-Pattern Detection Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .summary-card { background: #f8f9fa; padding: 20px; border-radius: 6px; text-align: center; }
        .severity-critical { color: #dc3545; }
        .severity-high { color: #fd7e14; }
        .severity-medium { color: #ffc107; }
        .severity-low { color: #28a745; }
        .file-result { margin-bottom: 30px; border: 1px solid #e9ecef; border-radius: 6px; overflow: hidden; }
        .file-header { background: #f8f9fa; padding: 15px; font-weight: bold; border-bottom: 1px solid #e9ecef; }
        .issue { padding: 15px; border-bottom: 1px solid #f8f9fa; }
        .issue:last-child { border-bottom: none; }
        .pattern { font-weight: bold; color: #495057; }
        .location { color: #6c757d; font-size: 0.9em; }
        .refactoring { background: #fff3cd; padding: 10px; border-radius: 4px; margin-top: 10px; border-left: 4px solid #ffc107; }
        .footer { margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 6px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔍 Vue Anti-Pattern Detection Report</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
        </div>

        <div class="summary">
            <div class="summary-card">
                <h3>Files Analyzed</h3>
                <div style="font-size: 2em; font-weight: bold;">${summary.totalFiles}</div>
            </div>
            <div class="summary-card">
                <h3>Files with Issues</h3>
                <div style="font-size: 2em; font-weight: bold;">${summary.filesWithIssues}</div>
            </div>
            <div class="summary-card">
                <h3>Total Issues</h3>
                <div style="font-size: 2em; font-weight: bold;">${summary.totalIssues}</div>
            </div>
        </div>

        ${summary.totalIssues > 0 ? `
        <h2>Issues by Severity</h2>
        <ul>
            ${Object.entries(summary.issuesBySeverity).filter(([, count]) => count > 0).map(([severity, count]) => `
            <li class="severity-${severity.toLowerCase()}"><strong>${severity}:</strong> ${count}</li>
            `).join('')}
        </ul>
        ` : '<p>🎉 No issues found!</p>'}

        ${results.filter(r => r.issues.length > 0).map(fileResult => `
        <div class="file-result">
            <div class="file-header">📁 ${fileResult.filePath}</div>
            ${fileResult.issues.map(issue => `
            <div class="issue">
                <div class="pattern severity-${issue.severity.toLowerCase()}">
                    ${this.getSeverityIcon(issue.severity)} ${issue.severity}: ${issue.pattern}
                </div>
                <div>${issue.message}</div>
                <div class="location">Line ${issue.location.line}, Column ${issue.location.column}</div>
                ${issue.refactoring ? `<div class="refactoring"><strong>💡 Refactoring:</strong> ${issue.refactoring}</div>` : ''}
            </div>
            `).join('')}
        </div>
        `).join('')}

        <div class="footer">
            <h3>💡 Recommendations</h3>
            <ul>
                ${summary.issuesBySeverity.CRITICAL > 0 ? `<li class="severity-critical">Address ${summary.issuesBySeverity.CRITICAL} CRITICAL issues immediately (runtime errors, security risks)</li>` : ''}
                ${summary.issuesBySeverity.HIGH > 0 ? `<li class="severity-high">Fix ${summary.issuesBySeverity.HIGH} HIGH priority issues before merge (maintainability, performance)</li>` : ''}
                ${summary.issuesBySeverity.MEDIUM > 0 ? `<li class="severity-medium">Consider ${summary.issuesBySeverity.MEDIUM} MEDIUM issues in refactoring cycles</li>` : ''}
                <li>Run this tool regularly to maintain code quality</li>
            </ul>
        </div>
    </div>
</body>
</html>`;
    return html;
  }

  /**
   * Get color for severity level
   */
  getSeverityColor(severity) {
    const colors = {
      CRITICAL: 'red',
      HIGH: 'yellow',
      MEDIUM: 'blue',
      LOW: 'green'
    };
    return colors[severity] || 'white';
  }

  /**
   * Get icon for severity level
   */
  getSeverityIcon(severity) {
    const icons = {
      CRITICAL: '🚨',
      HIGH: '⚠️',
      MEDIUM: 'ℹ️',
      LOW: '✅'
    };
    return icons[severity] || '❓';
  }
}

module.exports = VueAntiPatternReporter;