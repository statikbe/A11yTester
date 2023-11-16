import colors from "colors";
import * as fs from "fs";
import mustache from "mustache";
import open from "open";
import { Helper } from "./helpers";
import { BrokenLink, OutputTypeLink } from "./output";

export class LinksRenderer {
  private outputLinks: OutputTypeLink[] = [];

  constructor(outputLinks) {
    this.outputLinks = outputLinks;
  }

  public renderBrokenLinkOutputConsole() {
    let output = "";
    this.outputLinks
      .filter((f) => f.brokenLinks.find((bl) => bl.status != "200"))
      .forEach((outputType: OutputTypeLink) => {
        output += colors.cyan(`> Errors for: ${outputType.url}\n\n`);
        outputType.brokenLinks
          .filter((bl) => bl.status != "200")
          .forEach((link: BrokenLink) => {
            output += ` ${colors.red("•")} ${colors.red(`${link.status}`)} : ${
              link.url
            }\n`;
            output += `   ${colors.yellow(
              link.linkText && link.linkText.length
                ? link.linkText
                : link.tag ?? ""
            )} : \n   ${colors.yellow(link.selector ?? "")}\n\n`;
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
    fs.readFile("./templates/linkTester.html", (err: any, buf: any) => {
      const now = new Date();
      let fileName = "";
      const manifest = Helper.getFrontendManifest();
      const mainUrl = new URL(url);
      this.outputLinks.map((output) => {
        output.numberOfErrors = output.brokenLinks.filter(
          (bl) => bl.status != "200"
        ).length;
        output.numberOfOKLinks = output.brokenLinks.filter(
          (bl) => bl.status == "200"
        ).length;
        output.okLinks = output.brokenLinks.filter((bl) => bl.status == "200");
        output.brokenLinks = output.brokenLinks.filter(
          (bl) => bl.status != "200"
        );
        output.id = output.url.replace(/[^a-zA-Z0-9]/g, "");
      });

      if (exportForProduction) {
        fileName = `./public/html/link-test-${mainUrl.origin.replace(
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
          testedUrls: this.outputLinks,
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
