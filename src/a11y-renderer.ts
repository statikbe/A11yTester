import colors from "colors";
import * as fs from "fs";
import mustache from "mustache";
import open from "open";
import { Helper } from "./helpers";
import { A11yErrorMessage, OutputTypeA11y } from "./types";
import { RefreshServer } from "./refresh-server";

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
    exportForProduction: boolean = false,
    snippet: boolean = false
  ) {
    const now = new Date();
    let fileName = "";
    let path = "";
    let body = "";
    const manifest = Helper.getFrontendManifest();
    const mainUrl = new URL(url);
    this.outputA11y.map((output) => {
      output.numberOfErrors = output.errorMessages.length;
      output.id = output.url.replace(/[^a-zA-Z0-9]/g, "");
    });

    if (exportForProduction) {
      fileName = `a11y-test-${mainUrl.origin.replace(
        /[^a-zA-Z0-9]/g,
        ""
      )}.html`;
      path = `./public/html/${fileName}`;
    } else {
      fileName = `${now.getTime()}.html`;
      path = `./public/tmp/${fileName}`;
      Helper.clearDirectory("./public/tmp");
    }

    const template = fs.readFileSync("./templates/a11yTester.html", "utf8");

    body = mustache.render(template, {
      manifest: manifest,
      mainUrl: mainUrl.origin,
      date: now.toLocaleString(),
      local: !exportForProduction,
      testedUrls: this.outputA11y,
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
            refreshServer.listenForA11yChanges();
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
