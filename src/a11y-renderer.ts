import colors from "colors";
import * as fs from "fs";
import mustache from "mustache";
import open from "open";
import { Helper } from "./helpers";
import { A11yErrorMessage, OutputTypeA11y } from "./output";

export class A11yRenderer {
  private outputA11y: OutputTypeA11y[] = [];
  constructor(outputA11y) {
    this.outputA11y = outputA11y;
  }

  public renderA11yOutputConsole() {
    let output = "";
    this.outputA11y.forEach((outputType: OutputTypeA11y) => {
      output += colors.cyan(`\n> Errors for: ${outputType.url}\n\n`);
      outputType.errorMessages.forEach((message: A11yErrorMessage) => {
        output += `------------------------\n\n`;
        output += `${colors.red(`${message.message}`)}\n\n`;
        if (message.selector) {
          output += `${colors.yellow(message.selector)}\n\n`;
        }
        if (message.context) {
          output += `${colors.gray(message.context)}\n\n`;
        }
      });
    });
    if (output.length > 0) {
      process.stdout.write(output);
      process.exit();
    }
  }

  public renderA11yOutputHTML(
    url: string,
    exportForProduction: boolean = false
  ) {
    fs.readFile("./templates/a11yTester.html", (err: any, buf: any) => {
      const now = new Date();
      let fileName = "";
      const manifest = Helper.getFrontendManifest();
      const mainUrl = new URL(url);
      this.outputA11y.map((output) => {
        output.numberOfErrors = output.errorMessages.length;
        output.id = output.url.replace(/[^a-zA-Z0-9]/g, "");
      });

      if (exportForProduction) {
        fileName = `./public/html/a11y-test-${mainUrl.origin.replace(
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
          testedUrls: this.outputA11y,
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
