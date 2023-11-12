#!/usr/bin/env node
"use strict";

import { HtmlValidate } from "html-validate/node";
import colors from "colors";
import { Helper } from "./helpers";

export class HTMLTester {
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
        let output = "";
        const totalUrls = urls.length;
        let currentUrl = 0;

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
                    result.results[0].messages.forEach((message: any) => {
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
                .catch((error: string) => {
                  currentUrl++;
                  process.stdout.write(colors.cyan(" > "));
                  process.stdout.write(url);
                  output += colors.underline(`${url}\n\n`);
                  output += ` ${colors.red("•")} ${error}\n`;
                  if (currentUrl == totalUrls) {
                    process.stdout.write(output);
                  }
                });
            })
            .catch((error) => {
              currentUrl++;
              process.stdout.write(colors.cyan(" > "));
              process.stdout.write(url);
              output += colors.underline(`${url}\n\n`);
              output += ` ${colors.red("•")} ${error}\n`;
              if (currentUrl == totalUrls) {
                process.stdout.write(output);
              }
            });
        });
      })
      .catch((error) => {
        // Handle any errors
        console.error(error.message);
        process.exit(1);
      });
  }
}
