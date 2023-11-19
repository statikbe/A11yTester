import * as fs from "fs";
import { HTMLTester } from "./html-tester";
import { A11yTester } from "./a11y-tester";
import { LinkTester } from "./links-tester";
import { RunData, TestLog, TestResult } from "./types";
import mustache from "mustache";
import { Helper } from "./helpers";
import open from "open";
import { log } from "console";

export class ProductionFlow {
  private verbose: boolean;
  private runData: RunData = null;
  private testLog: TestLog = null;

  constructor(verbose: boolean = false) {
    this.verbose = verbose;
    console.log("Running production flow");
    try {
      this.runData = JSON.parse(
        fs.readFileSync("./data/production.json", "utf8")
      );
      try {
        this.testLog = JSON.parse(fs.readFileSync("./data/log.json", "utf8"));
      } catch (error) {
        this.testLog = {
          executions: [],
        };
      }
      this.startFlow();
    } catch (error) {
      console.log(error);
    }
  }

  private startFlow() {
    this.runData.tests = this.runData.tests.filter((test) => {
      if (this.testLog) {
        const lastExecution = this.testLog.executions.filter(
          (execution) => execution.projectCode === test.projectCode
        );
        if (lastExecution.length > 0) {
          const lastExecutionDate = new Date(lastExecution[0].created);
          const nextExecutionDate = new Date(
            lastExecutionDate.getTime() + test.frequency * 86400000
          );
          if (nextExecutionDate.getTime() < new Date().getTime()) {
            return true;
          } else {
            console.log(
              `Skipping ${test.projectCode} - ${lastExecution[0].date} - ${
                test.frequency
              } days - next execution on ${nextExecutionDate.toLocaleDateString(
                "nl-BE"
              )}`
            );
          }
        } else {
          return true;
        }
        return false;
      } else {
        return true;
      }
    });

    this.runTests();
  }

  private runTests() {
    if (this.runData.tests.length > 0) {
      const test = this.runData.tests.shift();
      console.log(`Running tests for ${test.projectCode}`);
      this.runTest(test).then((result: TestResult[]) => {
        result.map((r) => {
          r.numberOfUrlsWithoutErrors =
            r.numberOfUrls - r.numberOfUrlsWithErrors;
          r.passed = r.numberOfUrlsWithErrors === 0;
          return r;
        });
        const now = new Date();
        const date = `${now.toLocaleDateString("nl-BE", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })} | ${now.toLocaleTimeString("nl-BE")}`;

        const logItem = this.testLog.executions.find(
          (e) => e.projectCode === test.projectCode
        );

        if (logItem) {
          logItem.created = now.toISOString();
          logItem.date = date;
          logItem.results = result;
        } else {
          this.testLog.executions.push({
            projectCode: test.projectCode,
            created: now.toISOString(),
            date: date,
            results: result,
          });
        }
        this.runTests();
      });
    } else {
      console.log("All done");
      const manifest = Helper.getFrontendManifest();
      fs.readFile("./templates/index.html", (err: any, buf: any) => {
        fs.writeFile(
          "./public/index.html",
          mustache.render(buf.toString(), {
            manifest: manifest,
            testedUrls: this.testLog.executions,
          }),
          (err: any) => {
            if (err) throw err;
            open("./public/index.html", {
              app: {
                name: "google chrome",
                arguments: ["--allow-file-access-from-files"],
              },
            });
          }
        );
      });
      fs.writeFile("./data/log.json", JSON.stringify(this.testLog), (err) => {
        if (err) throw err;
      });
    }
  }

  private runTest(test) {
    const testResults: TestResult[] = [];

    return new Promise((resolve, reject) => {
      if (test.tests.length > 0) {
        const testName = test.tests.shift();
        console.log(`Running ${testName} test for ${test.projectCode}`);

        switch (testName) {
          case "html":
            const htmlTester = new HTMLTester();
            htmlTester
              .test(test.sitemap, test.url, true, "html", this.verbose, true)
              .then((testResult: TestResult) => {
                testResult.type = "html";
                testResults.push(testResult);
                this.runTest(test).then((result: TestResult[]) => {
                  resolve([...testResults, ...result]);
                });
              });
            break;
          case "a11y":
            const a11yTester = new A11yTester();
            a11yTester
              .test(test.sitemap, test.url, true, "html", this.verbose, true)
              .then((testResult: TestResult) => {
                testResult.type = "a11y";
                testResults.push(testResult);
                this.runTest(test).then((result: TestResult[]) => {
                  resolve([...testResults, ...result]);
                });
              });
            break;
          case "links":
            const linkTester = new LinkTester();
            linkTester
              .test(test.sitemap, test.url, true, "html", this.verbose, true)
              .then((testResult: TestResult) => {
                testResult.type = "links";
                testResults.push(testResult);
                this.runTest(test).then((result: TestResult[]) => {
                  resolve([...testResults, ...result]);
                });
              });
            break;
        }
      } else {
        resolve(testResults);
      }
    });
  }

  private addToIndex(test, testResult) {}
}
