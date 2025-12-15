<template>
  <div>
    <!-- VHTML_XSS_RISK: Dynamic content without sanitization (CRITICAL) -->
    <div v-html="userGeneratedContent"></div>

    <!-- VHTML_XSS_RISK: Dynamic content from API (CRITICAL) -->
    <div v-html="apiResponse.htmlContent"></div>

    <!-- VHTML_XSS_RISK: Dynamic content with variables (CRITICAL) -->
    <div v-html="`<strong>${username}</strong> said: ${message}`"></div>

    <!-- VHTML_XSS_RISK: Dynamic content from computed (CRITICAL) -->
    <div v-html="formattedHtmlContent"></div>

    <!-- This should be HIGH severity (dynamic but potentially safe) -->
    <div v-html="safeHtmlSnippet"></div>

    <!-- This should NOT trigger (static content) -->
    <div v-html="'<strong>Static content</strong>'"></div>

    <!-- This should NOT trigger (literal string) -->
    <div v-html="`<em>Safe literal</em>`"></div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      userGeneratedContent: '<script>alert("XSS")</script><p>User content</p>',
      apiResponse: {
        htmlContent: '<img src="x" onerror="alert(\'XSS\')" /><p>API content</p>'
      },
      username: 'Hacker<script>alert("XSS")</script>',
      message: 'Hello <img src="x" onerror="stealCookies()" />',
      safeHtmlSnippet: '<em>Safe content</em>'
    }
  },
  computed: {
    formattedHtmlContent() {
      return `<div class="content">${this.userGeneratedContent}</div>`;
    }
  }
}
</script>