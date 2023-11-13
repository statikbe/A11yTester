#!/usr/bin/env node
"use strict";

import pa11yCi from "pa11y-ci";
import { Helper } from "./helpers";

export class A11yTester {
  constructor() {}

  public test(sitemapUrl: string | null, url = "") {
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
        // Actually run Pa11y CI
        return pa11yCi(urls, {
          log: console,
        });
      })
      .catch((error) => {
        // Handle any errors
        console.error(error.message);
        process.exit(1);
      });
  }
}
