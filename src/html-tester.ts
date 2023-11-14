#!/usr/bin/env node
"use strict";

import { HtmlValidate } from "html-validate/node";
import colors from "colors";
import { Helper } from "./helpers";
import { HTMLErrorMessage, Output } from "./output";

export class HTMLTester {
  private output: Output;
  private currentUrl = 1;
  private totalUrls = 0;
  private htmlvalidate: HtmlValidate;
  private external = false;
  private urls: string[] = [];

  constructor() {
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
        "attribute-boolean-style": "off",
      },
    });
  }

  public test(sitemapUrl: string | null, url = "", external: boolean = false) {
    this.external = external;
    this.urls = [];
    if (url.length > 0) {
      this.urls = url.split(",");
    }

    if (sitemapUrl) {
      Promise.resolve()
        .then(() => {
          Helper.getUrlsFromSitemap(sitemapUrl, "", this.urls).then((urls) => {
            if (urls) {
              this.urls = urls;
              this.testUrls();
            }
          });
        })
        .catch((error) => {
          // Handle any errors
          console.error(error.message);
          process.exit(1);
        });
    } else {
      this.testUrls();
    }
  }

  private testUrls() {
    Promise.resolve()
      .then(() => {
        console.log(
          colors.cyan.underline(
            `Running validation on ${this.urls.length} URLS`
          )
        );
        this.output = new Output("htmlTester");
        this.totalUrls = this.urls.length;
        this.currentUrl = 0;

        // Run the tests
        if (this.external && this.urls.length > 0) {
          this.testUrl(this.urls.pop() as string);
        } else {
          this.urls.forEach((url) => {
            this.testUrl(url);
          });
        }
      })
      .catch((error) => {
        // Handle any errors
        console.error(error.message);
        process.exit(1);
      });
  }

  private testUrl(url: string) {
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
        this.htmlvalidate
          .validateString(body)
          .then((result: any) => {
            if (result.valid) {
              console.log(colors.green("0 errors"));
              this.RenderUrl(url, 0);
            } else {
              this.RenderUrl(url, result.results[0].errorCount);
              result.results[0].messages.forEach((message: any) => {
                this.output.add(url, message);
              });
            }
          })
          .catch((error: string) => {
            this.RenderUrl(url, 1, {
              message: error,
            });
          });
      })
      .catch((error) => {
        this.RenderUrl(url, 1, {
          message: error,
        });
      });
  }

  private RenderUrl(url: string, errors: number, message?: HTMLErrorMessage) {
    this.currentUrl++;
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
    if (message) {
      this.output.add(url, message);
    }

    if (this.currentUrl == this.totalUrls) {
      this.output.render("console");
    }

    if (this.external && this.urls.length > 0) {
      setTimeout(() => {
        this.testUrl(this.urls.pop() as string);
      }, 100);
    }
  }
}
