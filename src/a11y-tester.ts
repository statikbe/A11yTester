#!/usr/bin/env node
"use strict";

// import pa11yCi from "pa11y-ci";
import * as pa11y from "pa11y";
import colors from "colors";
import { Helper } from "./helpers";
import { Output } from "./output";
import { RenderType, TestResult } from "./types";

export class A11yTester {
  private external = false;
  private output: Output;
  private currentUrl = 1;
  private totalUrls = 0;
  private totalErrorUrls = 0;
  private urls: string[] = [];
  private outputType: RenderType = "cli";
  private verbose = true;
  private exportForProduction = false;
  private testPromise: Promise<any> | null = null;
  private testResolve: any;

  constructor() {
    colors.enable();
    this.output = new Output("a11yTester", "");
  }

  public test(
    sitemapUrl: string | null,
    url = "",
    external: boolean = false,
    output: RenderType = "cli",
    verbose: boolean = true,
    exportForProduction = false
  ) {
    this.outputType = output;
    this.verbose = verbose;
    this.external = external;
    this.exportForProduction = exportForProduction;

    this.urls = [];
    if (url.length > 0) {
      this.urls = url.split(",");
    }

    if (sitemapUrl) {
      Promise.resolve()
        .then(() => {
          Helper.getUrlsFromSitemap(sitemapUrl, "", this.urls).then((urls) => {
            if (urls) {
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

    this.testPromise = new Promise((resolve, reject) => {
      this.testResolve = resolve;
    });
    return this.testPromise;
  }

  private testUrls() {
    if (this.verbose) {
      console.log(
        colors.cyan.underline(
          `Running validation on ${this.urls.length} URLS\n`
        )
      );
    }

    this.output = new Output("a11yTester", new URL(this.urls[0]).origin);
    this.totalUrls = this.urls.length;
    this.currentUrl = 0;

    if (this.external && this.urls.length > 0) {
      this.testUrl(this.urls.pop() as string);
    } else {
      const promesses: Promise<any>[] = [];
      this.urls.forEach((url) => {
        promesses.push(this.testUrl(url));
      });
      Promise.all(promesses).then(() => {
        this.output.render(this.outputType);
      });
    }
  }

  private testUrl(url: string): Promise<any> {
    return pa11y.default(url, {}).then((results: any) => {
      this.currentUrl++;
      if (this.verbose) {
        process.stdout.write(colors.cyan(" > "));
        process.stdout.write(
          colors.yellow(` ${this.currentUrl}/${this.totalUrls} `)
        );
        process.stdout.write(url);
        process.stdout.write(" - ");
        if (results.issues.length == 0) {
          console.log(colors.green("0 errors"));
        } else {
          console.log(colors.red(`${results.issues.length} errors`));
          this.totalErrorUrls++;
        }
      }

      results.issues.forEach((issue: any) => {
        this.output.add(url, {
          message: issue.message,
          selector: issue.selector,
          context: issue.context,
        });
      });

      if (this.external && this.urls.length > 0) {
        setTimeout(() => {
          this.testUrl(this.urls.pop() as string);
        }, 100);
      }
      if (this.external && this.urls.length == 0) {
        const filename = this.output.render(
          this.outputType,
          this.exportForProduction
        );
        const testResult: TestResult = {
          filename: filename,
          numberOfUrls: this.totalUrls,
          numberOfUrlsWithErrors: this.totalErrorUrls,
        };
        this.testResolve(testResult);
      }
    });
  }
}
