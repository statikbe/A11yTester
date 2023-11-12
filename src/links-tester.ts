#!/usr/bin/env node
"use strict";

import colors from "colors";
import { Helper } from "./helpers";
import * as cheerio from "cheerio";
import * as uniqueSelector from "cheerio-get-css-selector";
import * as cliProgress from "cli-progress";

export class LinkTester {
  constructor() {}
  public test(sitemapUrl: string | null, url = "") {
    colors.enable();

    let urls: string[] = [];
    if (url.length > 0) {
      urls = url.split(",");
    }

    if (sitemapUrl) {
      Promise.resolve()
        .then(() => {
          Helper.getUrlsFromSitemap(sitemapUrl, "", urls).then((urls) => {
            if (urls) {
              this.testUrls(urls);
            }
          });
        })
        .catch((error) => {
          // Handle any errors
          console.error(error.message);
          process.exit(1);
        });
    } else {
      this.testUrls(urls);
    }
  }

  private testUrls(urls: string[]) {
    Promise.resolve()
      .then(() => {
        console.log(
          colors.cyan.underline(`Running validation on ${urls.length} URLS\n`)
        );
        let output = "";
        let uniqueLinks: string[] = [];
        const baseUrl = urls[0].split("/")[0] + "//" + urls[0].split("/")[2];

        // Run the tests
        this.testLinks(urls, baseUrl, uniqueLinks, output);
      })
      .catch((error) => {
        // Handle any errors
        console.error(error.message);
        process.exit(1);
      });
  }

  private testLinks(
    urls: string[],
    baseUrl: string,
    uniqueLinks: string[],
    output: string
  ) {
    this.testLink(urls[0], baseUrl, uniqueLinks).then((result: any) => {
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

  private testLink(url: string, baseUrl: string, uniqueLinks: string[]) {
    let output = "";
    return new Promise((resolveTest, rejectTest) => {
      Promise.resolve()
        .then(() =>
          fetch(url, {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (compatible; StatikTesterBot/0.1; +http://www.statik.be/)",
            },
          })
        )
        .then((response) => response.text())
        .then((body) => {
          //Do the test
          Promise.resolve().then(() => {
            let totalErrors = 0;
            let urlsChecked = 0;
            let urlErrors = colors.cyan(`> Errors for: ${url}\n\n`);

            const $ = cheerio.load(body);
            uniqueSelector.init($);
            const elementsAnchors = $("a[href]")
              .toArray()
              .filter((element: any) => {
                const href = $(element).attr("href");
                return href && href.startsWith("http");
              });
            const elementsLinks = $("link[href]")
              .toArray()
              .filter(
                (element: any) =>
                  $(element).attr("rel") != "canonical" &&
                  $(element).attr("rel") != "alternate" &&
                  $(element).attr("rel") != "preconnect"
              )
              .map((element: any) => {
                const href = $(element).attr("href");
                if (href && href.startsWith("http")) return element;
                else
                  return $(element)
                    .attr("href", baseUrl + href)
                    .get(0);
              });
            const elementsScripts = $("script[src]").toArray();
            const elementsImages = $("img[src]")
              .toArray()
              .map((element: any) => {
                const src = $(element).attr("src");
                if (src && src.startsWith("http")) return element;
                else if (src && src.startsWith("data")) return element;
                else
                  return $(element)
                    .attr("src", baseUrl + src)
                    .get(0);
              });
            let elements = [
              ...elementsAnchors,
              ...elementsLinks,
              ...elementsScripts,
              ...elementsImages,
            ];

            elements = elements.map((element) => {
              let link = "";
              if (!element) return element;
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
                if (uniqueLinks.indexOf(dataUrl) >= 0) return false;
                else {
                  uniqueLinks.push(dataUrl);
                  return true;
                }
              } else return false;
            });

            const bar = new cliProgress.SingleBar(
              {
                clearOnComplete: false,
                hideCursor: true,
                format: (options: any, params: any, payload: any) => {
                  // bar grows dynamically by current progress - no whitespaces are added
                  const bar = options.barCompleteString.substr(
                    0,
                    Math.round(params.progress * options.barsize)
                  );
                  const barIncomplete = options.barIncompleteString.substr(
                    Math.round(params.progress * options.barsize) + 1
                  );
                  return (
                    bar +
                    barIncomplete +
                    " | " +
                    payload.url +
                    " | Links checked: " +
                    params.value +
                    "/" +
                    params.total +
                    " | " +
                    (payload.errors == 0
                      ? colors.green(payload.errors + " errors")
                      : colors.red(payload.errors + " errors"))
                  );
                },
              },
              cliProgress.Presets.shades_grey
            );

            bar.start(elements.length, 0, {
              url: url,
              errors: totalErrors,
            });

            if (elements.length == 0) {
              bar.stop();
              resolveTest({
                output: output,
                uniqueLinks: uniqueLinks,
              });
            }

            elements.map((element) => {
              const dataUrl = $(element).attr("data-url");
              if (!dataUrl) return;
              if (!element) return;
              fetch(dataUrl, {
                signal: AbortSignal.timeout(10000),
                headers: {
                  "User-Agent":
                    "Mozilla/5.0 (compatible; StatikTesterBot/0.1; +http://www.statik.be/)",
                },
              })
                .then((response) => {
                  if (response.status >= 400) {
                    urlErrors += ` ${colors.red("•")} ${colors.red(
                      `${response.status}`
                    )} : ${$(element).attr("data-url")}\n`;
                    urlErrors += `   ${colors.yellow(
                      $(element).text().length
                        ? $(element).text()
                        : `<${element.tagName}>`
                    )} : ${colors.yellow(
                      ($(element) as any).getUniqueSelector()
                    )}\n\n`;
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
                      output: output,
                      uniqueLinks: uniqueLinks,
                    });
                  }
                })
                .catch((error) => {
                  urlErrors += ` ${colors.red("•")} ${colors.red(
                    error.cause ? error.cause.code : error
                  )} : ${$(element).attr("data-url")}\n`;
                  urlErrors += `   ${colors.yellow(
                    $(element).text().length
                      ? $(element).text()
                      : `<${element.tagName}>`
                  )} : ${colors.yellow(
                    ($(element) as any).getUniqueSelector()
                  )}\n\n`;
                  totalErrors++;
                  urlsChecked++;
                  bar.update(urlsChecked, { errors: totalErrors });
                  if (urlsChecked == elements.length) {
                    if (totalErrors > 0) {
                      output += urlErrors;
                    }
                    bar.stop();
                    resolveTest({
                      output: output,
                      uniqueLinks: uniqueLinks,
                    });
                  }
                });
            });
          });
        })
        .catch((error) => {
          rejectTest(error);
        });
    });
  }
}
