import colors from "colors";

type RenderType = "console" | "json" | "html";
type OutputType = "a11y" | "html" | "link";

export type HTMLErrorMessage = {
  message: string;
  line?: number;
  column?: number;
  selector?: string;
  ruleId?: string;
  ruleUrl?: string;
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
  private outputType: OutputType;
  constructor(type: OutputType) {
    this.outputType = type;
  }

  public add(url: string, errorMessage: HTMLErrorMessage) {
    switch (this.outputType) {
      case "a11y":
        // this.addAlly(url, errorMessage);
        break;
      case "html":
        this.addHTML(url, errorMessage);
        break;
      case "link":
        // this.addLink(url, errorMessage);
        break;
    }
  }

  public render(type: RenderType) {
    switch (this.outputType) {
      case "a11y":
        // this.renderAlly();
        break;
      case "html":
        this.renderHTMLOutput(type);
        break;
      case "link":
        // this.renderLink();
        break;
    }
  }

  private addHTML(url: string, errorMessage: HTMLErrorMessage) {
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

  private renderHTMLOutput(type: RenderType) {
    switch (type) {
      case "console":
        this.renderHTMLOutputConsole();
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
    process.stdout.write(output);
  }
}
