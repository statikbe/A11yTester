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

                const $ = cheerio.load(body);
                uniqueSelector.init($);
                const elements = $("a[href]")
                  .toArray()
                  .filter((element) =>
                    $(element).attr("href").startsWith("http")
                  );
                const bar = multibar.create(elements.length, 0);
                bar.update(0, { url: url, errors: totalErrors });

                elements.map((element) => {
                  const link = $(element).attr("href");
                  fetch(link)
                    .then((response) => {
                      if (response.status >= 400) {
                        // console.log(
                        //   link,
                        //   $(element).text(),
                        //   $(element).getUniqueSelector()
                        // );
                        totalErrors++;
                      }
                      urlsChecked++;
                      bar.update(urlsChecked, { errors: totalErrors });
                      if (urlsChecked == elements.length) allDone++;
                      if (allDone == totalUrls) multibar.stop();
                    })
                    .catch((error) => {
                      //   console.log(link, $(element).text(), error.cause.code);
                      totalErrors++;
                      urlsChecked++;
                      bar.update(urlsChecked, { errors: totalErrors });
                      if (urlsChecked == elements.length) allDone++;
                      if (allDone == totalUrls) multibar.stop();
                    });
                  // console.log(link, $(element).getUniqueSelector());
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
          console.log("All done!");
        });
      })
      .catch((error) => {
        // Handle any errors
        console.error(error.message);
        process.exit(1);
      });
  }
};
