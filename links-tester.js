#!/usr/bin/env node
"use strict";

const cheerio = require("cheerio");
const colors = require("colors");
const helpers = require("./helpers");
const uniqueSelector = require("cheerio-get-css-selector");
const cliProgress = require("cli-progress");

colors.enable();

module.exports = function linksTester(sitemapUrl, url = "") {
  let urls = [];
  if (url.length > 0) {
    urls = url.split(",");
  }

  if (sitemapUrl) {
    Promise.resolve()
      .then(() => {
        helpers.getUrlsFromSitemap(sitemapUrl, null, urls).then((urls) => {
          testUrls(urls);
        });
      })
      .catch((error) => {
        // Handle any errors
        console.error(error.message);
        process.exit(1);
      });
  } else {
    testUrls(urls);
  }

  function testUrls(urls) {
    Promise.resolve()
      .then(() => {
        console.log(
          colors.cyan.underline(`Running validation on ${urls.length} URLS\n`)
        );
        let output = "";
        const totalUrls = urls.length;
        let allDone = 0;
        let uniqueLinks = [];

        const multibar = new cliProgress.MultiBar(
          {
            clearOnComplete: false,
            hideCursor: true,
            format: (options, params, payload) => {
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

        const baseUrl = urls[0].split("/")[0] + "//" + urls[0].split("/")[2];

        // Run the tests
        urls.forEach((url) => {
          Promise.resolve()
            .then(() => fetch(url))
            .then((response) => response.text())
            .then((body) => {
              //Do the test
              //   process.stdout.write(colors.cyan(" > checking: "));
              //   process.stdout.write(`${url}\n`);
              Promise.resolve().then(() => {
                let totalErrors = 0;
                let urlsChecked = 0;
                let urlErrors = colors.cyan(`> Errors for: ${url}\n\n`);

                const $ = cheerio.load(body);
                uniqueSelector.init($);
                const elementsAnchors = $("a[href]")
                  .toArray()
                  .filter((element) =>
                    $(element).attr("href").startsWith("http")
                  );
                const elementsLinks = $("link[href]")
                  .toArray()
                  .filter(
                    (element) =>
                      $(element).attr("rel") != "canonical" &&
                      $(element).attr("rel") != "alternate" &&
                      $(element).attr("rel") != "preconnect"
                  )
                  .map((element) => {
                    if ($(element).attr("href").startsWith("http"))
                      return element;
                    else
                      return $(element)
                        .attr("href", baseUrl + $(element).attr("href"))
                        .get(0);
                  });
                const elementsScripts = $("script[src]").toArray();
                const elementsImages = $("img[src]")
                  .toArray()
                  .map((element) => {
                    if ($(element).attr("src").startsWith("http"))
                      return element;
                    else if ($(element).attr("src").startsWith("data"))
                      return element;
                    else
                      return $(element)
                        .attr("src", baseUrl + $(element).attr("src"))
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
                  if (element.tagName == "a" || element.tagName == "link")
                    link = $(element).attr("href");
                  else if (
                    element.tagName == "script" ||
                    element.tagName == "img"
                  )
                    link = $(element).attr("src");
                  if (element.tagName == "img" && link.startsWith("data")) {
                    link = $(element).attr("srcset").split(" ")[0];
                    if (link.indexOf("http") == -1) {
                      link = baseUrl + link;
                    }
                  }
                  $(element).attr("data-url", link);
                  return element;
                });

                // elements = elements.filter((element) => {
                //   if (uniqueLinks.indexOf($(element).attr("data-url")) >= 0)
                //     return false;
                //   else {
                //     uniqueLinks.push($(element).attr("data-url"));
                //     return true;
                //   }
                // });

                const bar = multibar.create(elements.length, 0);
                bar.update(0, { url: url, errors: totalErrors });

                elements.map((element) => {
                  fetch($(element).attr("data-url"))
                    .then((response) => {
                      if (response.status >= 400) {
                        urlErrors += ` ${colors.red("•")} ${colors.red(
                          response.status
                        )} : ${$(element).attr("data-url")}\n`;
                        urlErrors += `   ${colors.yellow(
                          $(element).text()
                        )} : ${colors.yellow(
                          $(element).getUniqueSelector()
                        )}\n\n`;
                        totalErrors++;
                      }
                      urlsChecked++;
                      bar.update(urlsChecked, { errors: totalErrors });
                      if (urlsChecked == elements.length) {
                        allDone++;
                        if (totalErrors > 0) {
                          output += urlErrors;
                        }
                      }
                      if (allDone == totalUrls) multibar.stop();
                    })
                    .catch((error) => {
                      urlErrors += ` ${colors.red("•")} ${colors.red(
                        error.cause.code
                      )} : ${$(element).attr("data-url")}\n`;
                      urlErrors += `   ${colors.yellow(
                        $(element).text()
                      )} : ${colors.yellow(
                        $(element).getUniqueSelector()
                      )}\n\n`;
                      totalErrors++;
                      urlsChecked++;
                      bar.update(urlsChecked, { errors: totalErrors });
                      if (urlsChecked == elements.length) {
                        allDone++;
                        if (totalErrors > 0) {
                          output += urlErrors;
                        }
                      }
                      if (allDone == totalUrls) multibar.stop();
                    });
                });
              });
            })
            .catch((error) => {
              console.log(error);
              allDone++;
              if (allDone == totalUrls) multibar.stop();
            });
        });

        multibar.on("stop", function () {
          process.stdout.write("\n\n");
          process.stdout.write(output);
          process.exit(0);
        });
      })
      .catch((error) => {
        // Handle any errors
        console.error(error.message);
        process.exit(1);
      });
  }
};
