module.exports = function cliReporter(options: any = {}, config: any = {}) {
  const log = Object.assign({}, config.log);
  return {
    beforeAll(urls: Array<string>) {
      log.info("URLS", urls);
    },

    results(testResults: any, reportConfig: any) {
      log.info("TEST RESULTS", testResults, "REPORT CONFIG", reportConfig);
    },

    error(error: any, url: string) {
      log.error("ERROR", error, "URL", url);
    },

    afterAll(report: any) {
      log.info("REPORT", report);
    },
  };
};
