#!/usr/bin/env node
"use strict";

const cheerio = require("cheerio");
const fetch = require("node-fetch");
const pa11yCi = require("pa11y-ci");
const helpers = require("./helpers");

module.exports = function a11yTester(sitemapUrl, url = "", local = false) {
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
};
