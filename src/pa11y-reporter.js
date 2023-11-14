var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var require_pa11y_reporter = __commonJS({
  "pa11y-reporter.js"(exports, module) {
    module.exports = function cliReporter(options = {}, config = {}) {
      const log = Object.assign({}, config.log);
      return {
        beforeAll(urls) {
          log.info("URLS", urls);
        },
        results(testResults, reportConfig) {
          log.info("TEST RESULTS", testResults, "REPORT CONFIG", reportConfig);
        },
        error(error, url) {
          log.error("ERROR", error, "URL", url);
        },
        afterAll(report) {
          log.info("REPORT", report);
        }
      };
    };
  }
});
export default require_pa11y_reporter();
