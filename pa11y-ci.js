#!/usr/bin/env node
"use strict";

const cheerio = require("cheerio");
const fetch = require("node-fetch");
const pa11yCi = require("pa11y-ci");

module.exports = function a11yTester(sitemapUrl, url = "", local = false) {
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

  // Start the promise chain to actually run everything
  function testUrls(urls) {
    Promise.resolve()
      .then(() => {
        // Actually run Pa11y CI
        return pa11yCi(urls, { log: console });
      })
      .catch((error) => {
        // Handle any errors
        console.error(error.message);
        process.exit(1);
      });
  }

  // Load a sitemap from a remote URL, parse out the
  // URLs, and add them to an existing config object
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
