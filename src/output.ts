import colors from "colors";

type RenderType = "console" | "json" | "html";

type HTMLErrorMessage = {
  line: number;
  column: number;
  message: string;
  url: string;
  selector: string;
  errorType: string;
  ruleUrl: string;
};

type OutputTypeHTML = {
  url: string;
  errorMessages: HTMLErrorMessage[];
};

type BrokenLink = {
  url: string;
  status: string;
  tag: string;
  selector: string;
  linkText: string;
};

type OutputTypeLink = {
  url: string;
  links: string[];
  brokenLinks: BrokenLink[];
};

export class Output {
  private outputHTML: OutputTypeHTML[] = [];
  private outputLinks: OutputTypeLink[] = [];
  constructor() {}

  public addHTML(url: string, errorMessage: HTMLErrorMessage) {
    const output = this.outputHTML.find((output) => output.url === url);
    if (output) {
      output.errorMessages.push(errorMessage);
    } else {
      this.outputHTML.push({
        url,
        errorMessages: [errorMessage],
      });
    }
  }

  public renderHTMLOutput(type: RenderType) {
    switch (type) {
      case "console":
        return this.renderHTMLOutputConsole();
        break;
      case "json":
        return JSON.stringify(this.outputHTML);
        break;
      case "html":
        break;
    }
  }

  private renderHTMLOutputConsole() {
    let output = "";
    this.outputHTML.forEach((outputType: OutputTypeHTML) => {
      output += colors.underline(
        `${outputType.url} - ${outputType.errorMessages.length} errors\n\n`
      );
      outputType.errorMessages.forEach((message: HTMLErrorMessage) => {
        output += ` ${colors.red("•")} ${message.message}\n`;
        if (message.selector) {
          output += `   ${colors.yellow(message.selector)}\n`;
        }
        output += `   ${colors.dim(message.errorType)} - line: ${
          message.line
        } | column: ${message.column}\n`;
        if (message.ruleUrl) {
          output += `   ${colors.dim.underline.italic(
            message.ruleUrl
          )}\n`;
        }
        output += "\n";
    });
    process.stdout.write(output);
  }
}
