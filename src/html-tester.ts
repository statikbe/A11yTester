#!/usr/bin/env node
"use strict";

import { HtmlValidate } from "html-validate/node";
import colors from "colors";
import { Helper } from "./helpers";
import { HTMLErrorMessage, Output } from "./output";

export class HTMLTester {
  private output: Output;
  constructor() {
    colors.enable();
  }

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
            "attribute-boolean-style": "off",
          },
        });
        this.output = new Output("html");
        const totalUrls = urls.length;
        let currentUrl = 1;

        // Run the tests
        urls.forEach((url) => {
          Promise.resolve()
            .then(() =>
              fetch(url, {
                signal: AbortSignal.timeout(10000),
                headers: {
                  "User-Agent":
                    "Mozilla/5.0 (compatible; StatikTesterBot/0.1; +http://www.statik.be/)",
                },
              })
            )
            .then((response) => response.text())
            .then((body) => {
              htmlvalidate
                .validateString(body)
                .then((result: any) => {
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

                    result.results[0].messages.forEach((message: any) => {
                      this.output.add(url, message);
                    });
                  }
                })
                .catch((error: string) => {
                  this.RenderUrl(url, currentUrl++, totalUrls, 1, {
                    message: error,
                  });
                });
            })
            .catch((error) => {
              this.RenderUrl(url, currentUrl++, totalUrls, 1, {
                message: error,
              });
            });
        });
      })
      .catch((error) => {
        // Handle any errors
        console.error(error.message);
        process.exit(1);
      });
  }

  private RenderUrl(
    url: string,
    currentUrl: number,
    totalUrls: number,
    errors: number,
    message?: HTMLErrorMessage
  ) {
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
