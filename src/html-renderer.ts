import colors from "colors";
import * as fs from "fs";
import mustache from "mustache";
import open from "open";
import { Helper } from "./helpers";
import { HTMLErrorMessage, OutputTypeHTML } from "./output";

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
    exportForProduction: boolean = false
  ) {
    fs.readFile("./templates/htmlTester.html", (err: any, buf: any) => {
      const now = new Date();
      let fileName = "";
      const manifest = Helper.getFrontendManifest();
      const mainUrl = new URL(url);
      this.outputHTML.map((output) => {
        output.numberOfErrors = output.errorMessages.length;
        output.id = output.url.replace(/[^a-zA-Z0-9]/g, "");
      });

      if (exportForProduction) {
        fileName = `./public/html/html-test-${mainUrl.origin.replace(
          /[^a-zA-Z0-9]/g,
          ""
        )}.html`;
      } else {
        fileName = `./public/tmp/${now.getTime()}.html`;
        Helper.clearDirectory("./public/tmp");
      }
      fs.writeFile(
        fileName,
        mustache.render(buf.toString(), {
          manifest: manifest,
          mainUrl: mainUrl.origin,
          date: now.toLocaleString(),
          testedUrls: this.outputHTML,
        }),
        (err: any) => {
          if (err) throw err;
          if (exportForProduction) {
          } else {
            open(fileName, {
              app: {
                name: "google chrome",
                arguments: ["--allow-file-access-from-files"],
              },
            });
          }
        }
      );
    });
  }
}
