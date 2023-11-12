var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
import prompts from "prompts";
import * as fs from "fs";
import { HtmlValidate } from "html-validate/node";
import colors from "colors";
import * as cheerio from "cheerio";
import pa11yCi from "pa11y-ci";
import * as uniqueSelector from "cheerio-get-css-selector";
import * as cliProgress from "cli-progress";
const _Helper = class _Helper {
  constructor() {
  }
};
__publicField(_Helper, "getUrlsFromSitemap", (sitemapUrl, sitemapExclude, urls) => {
  return Promise.resolve().then(
    () => fetch(sitemapUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; StatikTesterBot/0.1; +http://www.statik.be/)"
      }
    })
  ).then((response) => response.text()).then((body) => {
    const $ = cheerio.load(body, { xmlMode: true });
    const isSitemapIndex = $("sitemapindex").length > 0;
    if (isSitemapIndex) {
      return Promise.all(
        $("sitemap > loc").toArray().map((element) => {
          return _Helper.getUrlsFromSitemap(
            $(element).text(),
            sitemapExclude,
            urls
          );
        })
      ).then((configs) => {
        return configs.pop();
      });
    }
    $("url > loc").toArray().forEach((element) => {
      let url = $(element).text();
      if (sitemapExclude.length > 0 && url.match(sitemapExclude)) {
        return;
      }
      urls.push(url);
    });
    return urls;
  }).catch((error) => {
    if (error.stack && error.stack.includes("node-fetch")) {
      throw new Error(`The sitemap "${sitemapUrl}" could not be loaded`);
    }
    console.log(error);
    throw new Error(`The sitemap "${sitemapUrl}" could not be parsed`);
  });
});
let Helper = _Helper;
class Output {
  constructor(type) {
    __publicField(this, "outputHTML", []);
    __publicField(this, "outputLinks", []);
    __publicField(this, "outputType");
    this.outputType = type;
  }
  add(url, errorMessage) {
    switch (this.outputType) {
      case "a11y":
        break;
      case "html":
        this.addHTML(url, errorMessage);
        break;
    }
  }
  render(type) {
    switch (this.outputType) {
      case "a11y":
        break;
      case "html":
        this.renderHTMLOutput(type);
        break;
    }
  }
  addHTML(url, errorMessage) {
    const output = this.outputHTML.find((output2) => output2.url === url);
    if (output) {
      output.errorMessages.push(errorMessage);
    } else {
      this.outputHTML.push({
        url,
        errorMessages: [errorMessage]
      });
    }
  }
  renderHTMLOutput(type) {
    switch (type) {
      case "console":
        this.renderHTMLOutputConsole();
        break;
      case "json":
        return JSON.stringify(this.outputHTML);
    }
  }
  renderHTMLOutputConsole() {
    let output = "";
    this.outputHTML.forEach((outputType) => {
      output += colors.underline.cyan(
        `${outputType.url} - ${outputType.errorMessages.length} errors

`
      );
      outputType.errorMessages.forEach((message) => {
        output += ` ${colors.red("•")} ${message.message}
`;
        if (message.selector) {
          output += `   ${colors.yellow(message.selector)}
`;
        }
        if (message.ruleId && message.line && message.column) {
          output += `   ${colors.dim(message.ruleId)} - line: ${message.line} | column: ${message.column}
`;
        }
        if (message.ruleUrl) {
          output += `   ${colors.dim.underline.italic(message.ruleUrl)}
`;
        }
        output += "\n";
      });
    });
    process.stdout.write(output);
  }
}
class HTMLTester {
  constructor() {
    __publicField(this, "output");
    colors.enable();
  }
  test(sitemapUrl, url = "") {
    let urls = [];
    if (url.length > 0) {
      urls = url.split(",");
    }
    if (sitemapUrl) {
      Promise.resolve().then(() => {
        Helper.getUrlsFromSitemap(sitemapUrl, "", urls).then((urls2) => {
          if (urls2) {
            this.testUrls(urls2);
          }
        });
      }).catch((error) => {
        console.error(error.message);
        process.exit(1);
      });
    } else {
      this.testUrls(urls);
    }
  }
  testUrls(urls) {
    Promise.resolve().then(() => {
      console.log(
        colors.cyan.underline(`Running validation on ${urls.length} URLS`)
      );
      const htmlvalidate = new HtmlValidate({
        elements: ["html5"],
        extends: ["html-validate:recommended"],
        rules: {
          "void-style": "off",
          "no-trailing-whitespace": "off",
          "no-inline-style": "off",
          "wcag/h71": "off",
          "wcag/h63": "off",
          "script-type": "off",
          "long-title": "off",
          "no-raw-characters": "off",
          "attribute-boolean-style": "off"
        }
      });
      this.output = new Output("html");
      const totalUrls = urls.length;
      let currentUrl = 1;
      urls.forEach((url) => {
        Promise.resolve().then(
          () => fetch(url, {
            signal: AbortSignal.timeout(1e4),
            headers: {
              "User-Agent": "Mozilla/5.0 (compatible; StatikTesterBot/0.1; +http://www.statik.be/)"
            }
          })
        ).then((response) => response.text()).then((body) => {
          htmlvalidate.validateString(body).then((result) => {
            if (result.valid) {
              console.log(colors.green("0 errors"));
              this.RenderUrl(url, currentUrl++, totalUrls, 0);
            } else {
              this.RenderUrl(
                url,
                currentUrl++,
                totalUrls,
                result.results[0].errorCount
              );
              result.results[0].messages.forEach((message) => {
                this.output.add(url, message);
              });
            }
          }).catch((error) => {
            this.RenderUrl(url, currentUrl++, totalUrls, 1, {
              message: error
            });
          });
        }).catch((error) => {
          this.RenderUrl(url, currentUrl++, totalUrls, 1, {
            message: error
          });
        });
      });
    }).catch((error) => {
      console.error(error.message);
      process.exit(1);
    });
  }
  RenderUrl(url, currentUrl, totalUrls, errors, message) {
    process.stdout.write(colors.cyan(" > "));
    process.stdout.write(colors.yellow(` ${currentUrl}/${totalUrls} `));
    process.stdout.write(url);
    process.stdout.write(" - ");
    if (errors == 0) {
      console.log(colors.green("0 errors"));
    } else {
      console.log(colors.red(`${errors} errors`));
    }
    if (message) {
      this.output.add(url, message);
    }
    if (currentUrl == totalUrls) {
      this.output.render("console");
    }
  }
}
class A11yTester {
  constructor() {
  }
  test(sitemapUrl, url = "") {
    let urls = [];
    if (url.length > 0) {
      urls = url.split(",");
    }
    if (sitemapUrl) {
      Promise.resolve().then(() => {
        Helper.getUrlsFromSitemap(sitemapUrl, "", urls).then((urls2) => {
          if (urls2) {
            this.testUrls(urls2);
          }
        });
      }).catch((error) => {
        console.error(error.message);
        process.exit(1);
      });
    } else {
      this.testUrls(urls);
    }
  }
  testUrls(urls) {
    Promise.resolve().then(() => {
      return pa11yCi(urls, { log: console });
    }).catch((error) => {
      console.error(error.message);
      process.exit(1);
    });
  }
}
class LinkTester {
  constructor() {
  }
  test(sitemapUrl, url = "") {
    colors.enable();
    let urls = [];
    if (url.length > 0) {
      urls = url.split(",");
    }
    if (sitemapUrl) {
      Promise.resolve().then(() => {
        Helper.getUrlsFromSitemap(sitemapUrl, "", urls).then((urls2) => {
          if (urls2) {
            this.testUrls(urls2);
          }
        });
      }).catch((error) => {
        console.error(error.message);
        process.exit(1);
      });
    } else {
      this.testUrls(urls);
    }
  }
  testUrls(urls) {
    Promise.resolve().then(() => {
      console.log(
        colors.cyan.underline(`Running validation on ${urls.length} URLS
`)
      );
      let output = "";
      let uniqueLinks = [];
      const baseUrl = urls[0].split("/")[0] + "//" + urls[0].split("/")[2];
      this.testLinks(urls, baseUrl, uniqueLinks, output);
    }).catch((error) => {
      console.error(error.message);
      process.exit(1);
    });
  }
  testLinks(urls, baseUrl, uniqueLinks, output) {
    this.testLink(urls[0], baseUrl, uniqueLinks).then((result) => {
      output += result.output;
      uniqueLinks = result.uniqueLinks;
      urls.shift();
      if (urls.length > 0) {
        this.testLinks(urls, baseUrl, uniqueLinks, output);
      } else {
        process.stdout.write("\n\n");
        process.stdout.write(output);
        process.exit(0);
      }
    });
  }
  testLink(url, baseUrl, uniqueLinks) {
    let output = "";
    return new Promise((resolveTest, rejectTest) => {
      Promise.resolve().then(
        () => fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; StatikTesterBot/0.1; +http://www.statik.be/)"
          }
        })
      ).then((response) => response.text()).then((body) => {
        Promise.resolve().then(() => {
          let totalErrors = 0;
          let urlsChecked = 0;
          let urlErrors = colors.cyan(`> Errors for: ${url}

`);
          const $ = cheerio.load(body);
          uniqueSelector.init($);
          const elementsAnchors = $("a[href]").toArray().filter((element) => {
            const href = $(element).attr("href");
            return href && href.startsWith("http");
          });
          const elementsLinks = $("link[href]").toArray().filter(
            (element) => $(element).attr("rel") != "canonical" && $(element).attr("rel") != "alternate" && $(element).attr("rel") != "preconnect"
          ).map((element) => {
            const href = $(element).attr("href");
            if (href && href.startsWith("http"))
              return element;
            else
              return $(element).attr("href", baseUrl + href).get(0);
          });
          const elementsScripts = $("script[src]").toArray();
          const elementsImages = $("img[src]").toArray().map((element) => {
            const src = $(element).attr("src");
            if (src && src.startsWith("http"))
              return element;
            else if (src && src.startsWith("data"))
              return element;
            else
              return $(element).attr("src", baseUrl + src).get(0);
          });
          let elements = [
            ...elementsAnchors,
            ...elementsLinks,
            ...elementsScripts,
            ...elementsImages
          ];
          elements = elements.map((element) => {
            let link = "";
            if (!element)
              return element;
            if (element.tagName == "a" || element.tagName == "link")
              link = $(element).attr("href") ?? "";
            else if (element.tagName == "script" || element.tagName == "img")
              link = $(element).attr("src") ?? "";
            if (element.tagName == "img" && link.startsWith("data")) {
              const srcset = $(element).attr("srcset");
              if (srcset) {
                link = srcset.split(" ")[0];
              }
              if (link.indexOf("http") == -1) {
                link = baseUrl + link;
              }
            }
            $(element).attr("data-url", link);
            return element;
          });
          elements = elements.filter((element) => {
            const dataUrl = $(element).attr("data-url");
            if (dataUrl) {
              if (uniqueLinks.indexOf(dataUrl) >= 0)
                return false;
              else {
                uniqueLinks.push(dataUrl);
                return true;
              }
            } else
              return false;
          });
          const bar = new cliProgress.SingleBar(
            {
              clearOnComplete: false,
              hideCursor: true,
              format: (options, params, payload) => {
                const bar2 = options.barCompleteString.substr(
                  0,
                  Math.round(params.progress * options.barsize)
                );
                const barIncomplete = options.barIncompleteString.substr(
                  Math.round(params.progress * options.barsize) + 1
                );
                return bar2 + barIncomplete + " | " + payload.url + " | Links checked: " + params.value + "/" + params.total + " | " + (payload.errors == 0 ? colors.green(payload.errors + " errors") : colors.red(payload.errors + " errors"));
              }
            },
            cliProgress.Presets.shades_grey
          );
          bar.start(elements.length, 0, {
            url,
            errors: totalErrors
          });
          if (elements.length == 0) {
            bar.stop();
            resolveTest({
              output,
              uniqueLinks
            });
          }
          elements.map((element) => {
            const dataUrl = $(element).attr("data-url");
            if (!dataUrl)
              return;
            if (!element)
              return;
            fetch(dataUrl, {
              signal: AbortSignal.timeout(1e4),
              headers: {
                "User-Agent": "Mozilla/5.0 (compatible; StatikTesterBot/0.1; +http://www.statik.be/)"
              }
            }).then((response) => {
              if (response.status >= 400) {
                urlErrors += ` ${colors.red("•")} ${colors.red(
                  `${response.status}`
                )} : ${$(element).attr("data-url")}
`;
                urlErrors += `   ${colors.yellow(
                  $(element).text().length ? $(element).text() : `<${element.tagName}>`
                )} : ${colors.yellow(
                  $(element).getUniqueSelector()
                )}

`;
                totalErrors++;
              }
              urlsChecked++;
              bar.update(urlsChecked, { errors: totalErrors });
              if (urlsChecked == elements.length) {
                if (totalErrors > 0) {
                  output += urlErrors;
                }
                bar.stop();
                resolveTest({
                  output,
                  uniqueLinks
                });
              }
            }).catch((error) => {
              urlErrors += ` ${colors.red("•")} ${colors.red(
                error.cause ? error.cause.code : error
              )} : ${$(element).attr("data-url")}
`;
              urlErrors += `   ${colors.yellow(
                $(element).text().length ? $(element).text() : `<${element.tagName}>`
              )} : ${colors.yellow(
                $(element).getUniqueSelector()
              )}

`;
              totalErrors++;
              urlsChecked++;
              bar.update(urlsChecked, { errors: totalErrors });
              if (urlsChecked == elements.length) {
                if (totalErrors > 0) {
                  output += urlErrors;
                }
                bar.stop();
                resolveTest({
                  output,
                  uniqueLinks
                });
              }
            });
          });
        });
      }).catch((error) => {
        rejectTest(error);
      });
    });
  }
}
class LocalFlow {
  constructor() {
    let runData = null;
    fs.readFile("./data/session.json", (err, buf) => {
      if (err) {
        runData = null;
      }
      try {
        runData = JSON.parse(buf.toString());
      } catch (error) {
        runData = null;
      }
      this.startFlow(runData);
    });
  }
  startFlow(runData) {
    (async () => {
      let responseTool = { value: "" };
      let type = { value: "" };
      let sitemap = { value: "" };
      let url = { value: "" };
      let project = { value: "" };
      let externalUrl = { value: "" };
      const prompt = {
        type: "select",
        name: "value",
        message: "What do you want to do?",
        choices: [
          { title: "Test A11y", value: "a11y" },
          { title: "Test HTML", value: "html" },
          { title: "Test Broken Links", value: "links" },
          { title: "Nothing (Exit)", value: "exit" }
        ],
        initial: 0
      };
      if (runData && prompt.choices && prompt.choices.length > 0) {
        prompt.choices.unshift({
          title: `Run last session again (${runData.responseTool}-test for ${runData.url})`,
          value: "runAgain"
        });
      }
      responseTool = await prompts(prompt);
      if (responseTool.value != "runAgain" && responseTool.value != "exit") {
        type = await prompts({
          type: "select",
          name: "value",
          message: "What do you want to test?",
          choices: [
            { title: "Sitemap", value: "sitemap" },
            { title: "URL", value: "url" }
          ],
          initial: 0
        });
        switch (type.value) {
          case "sitemap":
            sitemap = await prompts({
              type: "select",
              name: "value",
              message: "Where is the sitemap?",
              choices: [
                { title: "Local project", value: "project" },
                { title: "External URL", value: "externalUrl" }
              ],
              initial: 0
            });
            switch (sitemap.value) {
              case "project":
                project = await prompts({
                  type: "text",
                  name: "value",
                  message: "What is the project code?"
                });
                break;
              case "externalUrl":
                externalUrl = await prompts({
                  type: "text",
                  name: "value",
                  message: "What is the URL to the sitemap?"
                });
                break;
            }
            break;
          case "url":
            url = await prompts({
              type: "text",
              name: "value",
              message: "What is the URL?"
            });
            break;
        }
        runData = {
          responseTool: responseTool.value,
          type: type.value,
          sitemap: sitemap.value,
          url: url.value,
          project: project.value,
          externalUrl: externalUrl.value
        };
      } else {
        if (responseTool.value != "exit") {
          responseTool.value = runData.responseTool;
        }
        type.value = runData.type;
        sitemap.value = runData.sitemap;
        url.value = runData.url;
        project.value = runData.project;
        externalUrl.value = runData.externalUrl;
      }
      if (responseTool.value === "html") {
        const htmlTester = new HTMLTester();
        if (type.value === "sitemap") {
          if (sitemap.value === "project") {
            await htmlTester.test(
              `http://${project.value}.local.statik.be/sitemap.xml`,
              ""
            );
            runData.url = `http://${project.value}.local.statik.be/sitemap.xml`;
          } else {
            await htmlTester.test(externalUrl.value);
            runData.url = externalUrl.value;
          }
        }
        if (type.value === "url") {
          await htmlTester.test(null, url.value);
          runData.url = url.value;
        }
      }
      if (responseTool.value === "a11y") {
        const a11yTester = new A11yTester();
        if (type.value === "sitemap") {
          if (sitemap.value === "project") {
            await a11yTester.test(
              `http://${project.value}.local.statik.be/sitemap.xml`,
              ""
            );
            runData.url = `http://${project.value}.local.statik.be/sitemap.xml`;
          } else {
            await a11yTester.test(externalUrl.value);
            runData.url = externalUrl.value;
          }
        }
        if (type.value === "url") {
          await a11yTester.test(null, url.value);
          runData.url = url.value;
        }
      }
      if (responseTool.value === "links") {
        const linksTester = new LinkTester();
        if (type.value === "sitemap") {
          if (sitemap.value === "project") {
            await linksTester.test(
              `http://${project.value}.local.statik.be/sitemap.xml`,
              ""
            );
            runData.url = `http://${project.value}.local.statik.be/sitemap.xml`;
          } else {
            await linksTester.test(externalUrl.value);
            runData.url = externalUrl.value;
          }
        }
        if (type.value === "url") {
          await linksTester.test(null, url.value);
          runData.url = url.value;
        }
      }
      if (responseTool.value != "exit") {
        fs.writeFile(
          "./data/session.json",
          JSON.stringify(runData),
          function(err) {
            if (err)
              console.log(err);
          }
        );
      }
    })();
  }
}
{
  {
    new LocalFlow();
  }
}
