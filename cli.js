import prompts from "prompts";
import * as fs from "fs";
import { HtmlValidate } from "html-validate/node";
import colors from "colors";
import * as cheerio from "cheerio";
import path from "path";
import mustache from "mustache";
import open from "open";
import * as pa11y from "pa11y";
import * as uniqueSelector from "cheerio-get-css-selector";
import * as cliProgress from "cli-progress";
const _Helper = class _Helper2 {
  constructor() {
  }
  static getFrontendManifest() {
    const manifest = JSON.parse(
      fs.readFileSync("./public/frontend/manifest.json", "utf8")
    );
    return Object.keys(manifest).reduce((acc, key) => {
      const newKey = key.split("/").join("").replace(".", "");
      acc[newKey] = manifest[key];
      return acc;
    }, {});
  }
};
_Helper.getUrlsFromSitemap = (sitemapUrl, sitemapExclude, urls) => {
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
};
_Helper.clearDirectory = (directory) => {
  return new Promise((resolve, reject) => {
    fs.readdir(directory, (err, files) => {
      if (err)
        reject(err);
      for (const file of files) {
        fs.unlink(path.join(directory, file), (err2) => {
          if (err2)
            reject(err2);
        });
      }
      resolve();
    });
  });
};
let Helper = _Helper;
class Output {
  constructor(type) {
    this.outputHTML = [];
    this.outputLinks = [];
    this.outputA11y = [];
    this.outputType = type;
  }
  add(url, errorMessage) {
    switch (this.outputType) {
      case "a11yTester":
        this.addAlly(url, errorMessage);
        break;
      case "htmlTester":
        this.addHTML(url, errorMessage);
        break;
      case "linkTester":
        this.addBrokenLink(url, errorMessage);
        break;
    }
  }
  render(type) {
    switch (this.outputType) {
      case "a11yTester":
        this.renderA11yOutput(type);
        break;
      case "htmlTester":
        this.renderHTMLOutput(type);
        break;
      case "linkTester":
        this.renderBrokenLinkOutput(type);
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
  addBrokenLink(url, errorMessage) {
    const output = this.outputLinks.find((output2) => output2.url === url);
    if (output) {
      output.brokenLinks.push(errorMessage);
    } else {
      this.outputLinks.push({
        url,
        brokenLinks: [errorMessage]
      });
    }
  }
  addAlly(url, errorMessage) {
    const output = this.outputA11y.find((output2) => output2.url === url);
    if (output) {
      output.errorMessages.push(errorMessage);
    } else {
      this.outputA11y.push({
        url,
        errorMessages: [errorMessage]
      });
    }
  }
  renderHTMLOutput(type) {
    switch (type) {
      case "cli":
        this.renderHTMLOutputConsole();
        break;
      case "json":
        return JSON.stringify(this.outputHTML);
      case "html":
        this.renderHTMLOutputHTML();
        break;
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
    if (output.length > 0) {
      process.stdout.write(output);
      process.exit();
    }
  }
  renderHTMLOutputHTML() {
    fs.readFile("./templates/htmlTester.html", (err, buf) => {
      const now = /* @__PURE__ */ new Date();
      const fileName = `./public/tmp/${now.getTime()}.html`;
      const mainUrl = new URL(this.outputHTML[0].url);
      Helper.clearDirectory("./public/tmp");
      const manifest = Helper.getFrontendManifest();
      fs.writeFile(
        fileName,
        mustache.render(buf.toString(), {
          manifest,
          mainUrl: mainUrl.origin,
          date: now.toLocaleString(),
          testedUrls: this.outputHTML
        }),
        (err2) => {
          if (err2)
            throw err2;
          open(fileName);
        }
      );
    });
  }
  renderBrokenLinkOutput(type) {
    switch (type) {
      case "cli":
        this.renderBrokenLinkOutputConsole();
        break;
      case "json":
        return JSON.stringify(this.outputLinks);
    }
  }
  renderBrokenLinkOutputConsole() {
    let output = "";
    this.outputLinks.filter((f) => f.brokenLinks.find((bl) => bl.status != "200")).forEach((outputType) => {
      output += colors.cyan(`> Errors for: ${outputType.url}

`);
      outputType.brokenLinks.filter((bl) => bl.status != "200").forEach((link) => {
        output += ` ${colors.red("•")} ${colors.red(`${link.status}`)} : ${link.url}
`;
        output += `   ${colors.yellow(
          link.linkText && link.linkText.length ? link.linkText : link.tag ?? ""
        )} : 
   ${colors.yellow(link.selector ?? "")}

`;
      });
    });
    if (output.length > 0) {
      process.stdout.write(output);
      process.exit();
    }
  }
  renderA11yOutput(type) {
    switch (type) {
      case "cli":
        this.renderA11yOutputConsole();
        break;
      case "json":
        return JSON.stringify(this.outputA11y);
    }
  }
  renderA11yOutputConsole() {
    let output = "";
    this.outputA11y.forEach((outputType) => {
      output += colors.cyan(`
> Errors for: ${outputType.url}

`);
      outputType.errorMessages.forEach((message) => {
        output += `------------------------

`;
        output += `${colors.red(`${message.message}`)}

`;
        if (message.selector) {
          output += `${colors.yellow(message.selector)}

`;
        }
        if (message.context) {
          output += `${colors.gray(message.context)}

`;
        }
      });
    });
    if (output.length > 0) {
      process.stdout.write(output);
      process.exit();
    }
  }
}
class HTMLTester {
  constructor() {
    this.currentUrl = 1;
    this.totalUrls = 0;
    this.external = false;
    this.urls = [];
    this.outputType = "cli";
    this.verbose = true;
    colors.enable();
    this.output = new Output("htmlTester");
    this.htmlvalidate = new HtmlValidate({
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
  }
  test(sitemapUrl, url = "", external = false, output = "cli", verbose = true) {
    this.external = external;
    this.outputType = output;
    this.verbose = verbose;
    this.urls = [];
    if (url.length > 0) {
      this.urls = url.split(",");
    }
    if (sitemapUrl) {
      Promise.resolve().then(() => {
        Helper.getUrlsFromSitemap(sitemapUrl, "", this.urls).then((urls) => {
          if (urls) {
            this.urls = urls;
            this.testUrls();
          }
        });
      }).catch((error) => {
        console.error(error.message);
        process.exit(1);
      });
    } else {
      this.testUrls();
    }
  }
  testUrls() {
    Promise.resolve().then(() => {
      if (this.verbose) {
        console.log(
          colors.cyan.underline(
            `Running validation on ${this.urls.length} URLS`
          )
        );
      }
      this.output = new Output("htmlTester");
      this.totalUrls = this.urls.length;
      this.currentUrl = 0;
      if (this.external && this.urls.length > 0) {
        this.testUrl(this.urls.pop());
      } else {
        this.urls.forEach((url) => {
          this.testUrl(url);
        });
      }
    }).catch((error) => {
      console.error(error.message);
      process.exit(1);
    });
  }
  testUrl(url) {
    Promise.resolve().then(
      () => fetch(url, {
        signal: AbortSignal.timeout(1e4),
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; StatikTesterBot/0.1; +http://www.statik.be/)"
        }
      })
    ).then((response) => response.text()).then((body) => {
      this.htmlvalidate.validateString(body).then((result) => {
        if (result.valid) {
          if (this.verbose) {
            console.log(colors.green("0 errors"));
          }
          this.RenderUrl(url, 0);
        } else {
          result.results[0].messages.forEach((message) => {
            this.output.add(url, message);
          });
          this.RenderUrl(url, result.results[0].errorCount);
        }
      }).catch((error) => {
        this.RenderUrl(url, 1, {
          message: error
        });
      });
    }).catch((error) => {
      this.RenderUrl(url, 1, {
        message: error
      });
    });
  }
  RenderUrl(url, errors, message) {
    this.currentUrl++;
    if (this.verbose) {
      process.stdout.write(colors.cyan(" > "));
      process.stdout.write(
        colors.yellow(` ${this.currentUrl}/${this.totalUrls} `)
      );
      process.stdout.write(url);
      process.stdout.write(" - ");
      if (errors == 0) {
        console.log(colors.green("0 errors"));
      } else {
        console.log(colors.red(`${errors} errors`));
      }
    }
    if (message) {
      this.output.add(url, message);
    }
    if (this.currentUrl == this.totalUrls) {
      this.output.render(this.outputType);
    }
    if (this.external && this.urls.length > 0) {
      setTimeout(() => {
        this.testUrl(this.urls.pop());
      }, 100);
    }
  }
}
class A11yTester {
  constructor() {
    this.external = false;
    this.currentUrl = 1;
    this.totalUrls = 0;
    this.urls = [];
    this.outputType = "cli";
    this.verbose = true;
    colors.enable();
    this.output = new Output("a11yTester");
  }
  test(sitemapUrl, url = "", external = false, output = "cli", verbose = true) {
    this.outputType = output;
    this.verbose = verbose;
    this.external = external;
    this.urls = [];
    if (url.length > 0) {
      this.urls = url.split(",");
    }
    if (sitemapUrl) {
      Promise.resolve().then(() => {
        Helper.getUrlsFromSitemap(sitemapUrl, "", this.urls).then((urls) => {
          if (urls) {
            this.testUrls();
          }
        });
      }).catch((error) => {
        console.error(error.message);
        process.exit(1);
      });
    } else {
      this.testUrls();
    }
  }
  testUrls() {
    if (this.verbose) {
      console.log(
        colors.cyan.underline(
          `Running validation on ${this.urls.length} URLS
`
        )
      );
    }
    this.output = new Output("a11yTester");
    this.totalUrls = this.urls.length;
    this.currentUrl = 0;
    if (this.external && this.urls.length > 0) {
      this.testUrl(this.urls.pop());
    } else {
      const promesses = [];
      this.urls.forEach((url) => {
        promesses.push(this.testUrl(url));
      });
      Promise.all(promesses).then(() => {
        this.output.render(this.outputType);
      });
    }
  }
  testUrl(url) {
    return pa11y.default(url, {}).then((results) => {
      this.currentUrl++;
      if (this.verbose) {
        process.stdout.write(colors.cyan(" > "));
        process.stdout.write(
          colors.yellow(` ${this.currentUrl}/${this.totalUrls} `)
        );
        process.stdout.write(url);
        process.stdout.write(" - ");
        if (results.issues.length == 0) {
          console.log(colors.green("0 errors"));
        } else {
          console.log(colors.red(`${results.issues.length} errors`));
        }
      }
      results.issues.forEach((issue) => {
        this.output.add(url, {
          message: issue.message,
          selector: issue.selector,
          context: issue.context
        });
      });
      if (this.external && this.urls.length > 0) {
        setTimeout(() => {
          this.testUrl(this.urls.pop());
        }, 100);
      }
      if (this.external && this.urls.length == 0) {
        this.output.render(this.outputType);
      }
    });
  }
}
class LinkTester {
  constructor() {
    this.external = false;
    this.urls = [];
    this.outputType = "cli";
    this.verbose = true;
    colors.enable();
    this.output = new Output("linkTester");
  }
  test(sitemapUrl, url = "", external = false, output = "cli", verbose = true) {
    this.external = external;
    this.outputType = output;
    this.verbose = verbose;
    this.output = new Output("linkTester");
    this.urls = [];
    if (url.length > 0) {
      this.urls = url.split(",");
    }
    if (sitemapUrl) {
      Promise.resolve().then(() => {
        Helper.getUrlsFromSitemap(sitemapUrl, "", this.urls).then((urls) => {
          if (urls) {
            this.urls = urls;
            this.testUrls();
          }
        });
      }).catch((error) => {
        console.error(error.message);
        process.exit(1);
      });
    } else {
      this.testUrls();
    }
  }
  testUrls() {
    Promise.resolve().then(() => {
      if (this.verbose) {
        console.log(
          colors.cyan.underline(
            `Running validation on ${this.urls.length} URLS
`
          )
        );
      }
      let uniqueLinks = [];
      const baseUrl = this.urls[0].split("/")[0] + "//" + this.urls[0].split("/")[2];
      this.testLinks(baseUrl, uniqueLinks);
    }).catch((error) => {
      console.error(error.message);
      process.exit(1);
    });
  }
  testLinks(baseUrl, uniqueLinks) {
    this.testLink(this.urls[0], baseUrl, uniqueLinks).then((result) => {
      uniqueLinks = result.uniqueLinks;
      this.urls.shift();
      if (this.urls.length > 0) {
        if (this.external) {
          setTimeout(() => {
            this.testLinks(baseUrl, uniqueLinks);
          }, 100);
        } else {
          this.testLinks(baseUrl, uniqueLinks);
        }
      } else {
        this.output.render(this.outputType);
      }
    });
  }
  testLink(url, baseUrl, uniqueLinks) {
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
          let bar = null;
          if (this.verbose) {
            bar = new cliProgress.SingleBar(
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
          }
          if (elements.length == 0) {
            if (this.verbose && bar) {
              bar.stop();
            }
            resolveTest({
              uniqueLinks
            });
          }
          const totalElements = elements.length;
          const checkLink = (element) => {
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
                this.output.add(url, {
                  url: dataUrl,
                  status: response.status.toString(),
                  tag: `<${element.tagName}>`,
                  selector: $(element).getUniqueSelector(),
                  linkText: $(element).text()
                });
                totalErrors++;
              } else {
                this.output.add(url, {
                  url: dataUrl,
                  status: response.status.toString()
                });
              }
              urlsChecked++;
              if (this.verbose && bar) {
                bar.update(urlsChecked, { errors: totalErrors });
              }
              if (urlsChecked == totalElements) {
                if (this.verbose && bar) {
                  bar.stop();
                }
                resolveTest({
                  uniqueLinks
                });
              }
            }).catch((error) => {
              this.output.add(url, {
                url: dataUrl,
                status: error.cause ? error.cause.code : error,
                tag: `<${element.tagName}>`,
                selector: $(element).getUniqueSelector(),
                linkText: $(element).text()
              });
              totalErrors++;
              urlsChecked++;
              if (this.verbose && bar) {
                bar.update(urlsChecked, { errors: totalErrors });
              }
              if (urlsChecked == totalElements) {
                if (this.verbose && bar) {
                  bar.stop();
                }
                resolveTest({
                  uniqueLinks
                });
              }
            });
          };
          if (this.external) {
            const slowCheck = () => {
              checkLink(elements.pop());
              if (elements.length > 0) {
                setTimeout(slowCheck, 100);
              }
            };
            if (elements.length > 0) {
              slowCheck();
            }
          } else {
            elements.map((element) => {
              checkLink(element);
            });
          }
        });
      }).catch((error) => {
        rejectTest(error);
      });
    });
  }
}
class LocalFlow {
  constructor(output = "cli", verbose = true) {
    this.output = output;
    this.verbose = verbose;
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
              "",
              false,
              this.output,
              this.verbose
            );
            runData.url = `http://${project.value}.local.statik.be/sitemap.xml`;
          } else {
            await htmlTester.test(
              externalUrl.value,
              "",
              true,
              this.output,
              this.verbose
            );
            runData.url = externalUrl.value;
          }
        }
        if (type.value === "url") {
          await htmlTester.test(
            null,
            url.value,
            true,
            this.output,
            this.verbose
          );
          runData.url = url.value;
        }
      }
      if (responseTool.value === "a11y") {
        const a11yTester = new A11yTester();
        if (type.value === "sitemap") {
          if (sitemap.value === "project") {
            await a11yTester.test(
              `http://${project.value}.local.statik.be/sitemap.xml`,
              "",
              false,
              this.output,
              this.verbose
            );
            runData.url = `http://${project.value}.local.statik.be/sitemap.xml`;
          } else {
            await a11yTester.test(
              externalUrl.value,
              "",
              true,
              this.output,
              this.verbose
            );
            runData.url = externalUrl.value;
          }
        }
        if (type.value === "url") {
          await a11yTester.test(
            null,
            url.value,
            true,
            this.output,
            this.verbose
          );
          runData.url = url.value;
        }
      }
      if (responseTool.value === "links") {
        const linksTester = new LinkTester();
        if (type.value === "sitemap") {
          if (sitemap.value === "project") {
            await linksTester.test(
              `http://${project.value}.local.statik.be/sitemap.xml`,
              "",
              false,
              this.output,
              this.verbose
            );
            runData.url = `http://${project.value}.local.statik.be/sitemap.xml`;
          } else {
            await linksTester.test(
              externalUrl.value,
              "",
              true,
              this.output,
              this.verbose
            );
            runData.url = externalUrl.value;
          }
        }
        if (type.value === "url") {
          await linksTester.test(
            null,
            url.value,
            true,
            this.output,
            this.verbose
          );
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
    new LocalFlow("html", "true");
  }
}
