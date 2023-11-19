import colors from "colors";
import * as fs from "fs";
import mustache from "mustache";
import open from "open";
import { Helper } from "./helpers";
import { HTMLErrorMessage, OutputTypeHTML } from "./types";
import { RefreshServer } from "./refresh-server";

export class HTMLRenderer {
  private outputHTML: OutputTypeHTML[] = [];
  constructor(outputHTML) {
    this.outputHTML = outputHTML;
  }

  public renderHTMLOutputConsole() {
    let output = "";
    this.outputHTML.forEach((outputType: OutputTypeHTML) => {
      output += colors.underline.cyan(
        `${outputType.url} - ${outputType.errorMessages.length} errors\n\n`
      );
      outputType.errorMessages.forEach((message: HTMLErrorMessage) => {
        output += ` ${colors.red("•")} ${message.message}\n`;
        if (message.selector) {
          output += `   ${colors.yellow(message.selector)}\n`;
        }
        if (message.ruleId && message.line && message.column) {
          output += `   ${colors.dim(message.ruleId)} - line: ${
            message.line
          } | column: ${message.column}\n`;
        }
        if (message.ruleUrl) {
          output += `   ${colors.dim.underline.italic(message.ruleUrl)}\n`;
        }
        output += "\n";
      });
    });
    if (output.length > 0) {
      process.stdout.write(output);
      process.exit();
    }
  }

  public renderHTMLOutputHTML(
    url: string,
    exportForProduction: boolean = false,
    snippet: boolean = false
  ) {
    const now = new Date();
    const mainUrl = new URL(url);
    let fileName = "";
    let path = "";
    let body = "";
    const manifest = Helper.getFrontendManifest();
    this.outputHTML.map((output) => {
      output.numberOfErrors = output.errorMessages.length;
      output.id = output.url.replace(/[^a-zA-Z0-9]/g, "");
    });

    if (exportForProduction) {
      fileName = `html-test-${mainUrl.origin.replace(
        /[^a-zA-Z0-9]/g,
        ""
      )}.html`;
      path = `./public/html/${fileName}`;
    } else {
      fileName = `${now.getTime()}.html`;
      path = `./public/tmp/${fileName}`;
      Helper.clearDirectory("./public/tmp");
    }

    const template = fs.readFileSync("./templates/htmlTester.html", "utf8");
    body = mustache.render(template, {
      manifest: manifest,
      mainUrl: mainUrl.origin,
      date: now.toLocaleString(),
      local: !exportForProduction,
      testedUrls: this.outputHTML,
    });

    if (!snippet) {
      fs.writeFile(path, body, (err: any) => {
        if (err) throw err;
        if (exportForProduction) {
        } else {
          open(path, {
            app: {
              name: "google chrome",
              arguments: ["--allow-file-access-from-files"],
            },
          });
          if (!exportForProduction && import.meta.env.VITE_RUN_SERVER) {
            const refreshServer = new RefreshServer();
            refreshServer.listenForHtmlChanges();
          }
        }
      });
    }

    if (snippet) {
      return body;
    } else {
      return fileName;
    }
  }
}
