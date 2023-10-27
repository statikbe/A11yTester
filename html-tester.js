#!/usr/bin/env node
"use strict";

const cheerio = require("cheerio");
const HtmlValidate = require("html-validate");
const colors = require("colors");

colors.enable();

module.exports = function htmlTester(sitemapUrl, url = "", local = false) {
  let urls = [];
  if (url.length > 0) {
    urls = url.split(",");
  }

  if (sitemapUrl) {
    Promise.resolve()
      .then(() => {
        getUrlsFromSitemap(sitemapUrl, null, urls).then((urls) => {
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
          colors.cyan.underline(`Running validation on ${urls.length} URLS`)
        );
        const htmlvalidate = new HtmlValidate.HtmlValidate({
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
          },
        });
        let output = "";
        const totalUrls = urls.length;
        let currentUrl = 0;

        // Run the tests
        urls.forEach((url) => {
          Promise.resolve()
            .then(() => fetch(url))
            .then((response) => response.text())
            .then((body) => {
              htmlvalidate
                .validateString(body)
                .then((result) => {
                  currentUrl++;
                  process.stdout.write(colors.cyan(" > "));
                  process.stdout.write(url);
                  process.stdout.write(" - ");
                  if (result.valid) {
                    console.log(colors.green("0 errors"));
                  } else {
                    console.log(
                      colors.red(`${result.results[0].errorCount} errors`)
                    );

                    output += colors.underline(
                      `${url} - ${result.results[0].errorCount} errors\n\n`
                    );
                    result.results[0].messages.forEach((message) => {
                      output += ` ${colors.red("•")} ${message.message}\n`;
                      if (message.selector) {
                        output += `   ${colors.yellow(message.selector)}\n`;
                      }
                      output += `   ${colors.dim(message.ruleId)} - line: ${
                        message.line
                      } | column: ${message.column}\n`;
                      if (message.ruleUrl) {
                        output += `   ${colors.dim.underline.italic(
                          message.ruleUrl
                        )}\n`;
                      }
                      output += "\n";
                    });
                  }
                  if (currentUrl == totalUrls) {
                    process.stdout.write(output);
                  }
                })
                .catch((error) => {
                  currentUrl++;
                  process.stdout.write(colors.cyan(" > "));
                  process.stdout.write(url);
                  console.log(error);
                });
            })
            .catch((error) => {
              console.log(error);
            });
        });
      })
      .catch((error) => {
        // Handle any errors
        console.error(error.message);
        process.exit(1);
      });
  }

  function getUrlsFromSitemap(sitemapUrl, sitemapExclude, urls) {
    return Promise.resolve()
      .then(() => fetch(sitemapUrl))
      .then((response) => response.text())
      .then((body) => {
        const $ = cheerio.load(body, { xmlMode: true });

        const isSitemapIndex = $("sitemapindex").length > 0;
        if (isSitemapIndex) {
          return Promise.all(
            $("sitemap > loc")
              .toArray()
              .map((element) => {
                return getUrlsFromSitemap(
                  $(element).text(),
                  sitemapExclude,
                  urls
                );
              })
          ).then((configs) => {
            return configs.pop();
          });
        }

        $("url > loc")
          .toArray()
          .forEach((element) => {
            let url = $(element).text();
            if (sitemapExclude != undefined && url.match(sitemapExclude)) {
              return;
            }
            urls.push(url);
          });
        return urls;
      })
      .catch((error) => {
        if (error.stack && error.stack.includes("node-fetch")) {
          throw new Error(`The sitemap "${sitemapUrl}" could not be loaded`);
        }
        console.log(error);
        throw new Error(`The sitemap "${sitemapUrl}" could not be parsed`);
      });
  }
};
