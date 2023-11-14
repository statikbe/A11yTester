import colors from "colors";
import { type } from "os";

type RenderType = "console" | "json" | "html";
type OutputType = "a11yTester" | "htmlTester" | "linkTester";

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
  tag?: string;
  selector?: string;
  linkText?: string;
};

type OutputTypeLink = {
  url: string;
  brokenLinks: BrokenLink[];
};

type A11yErrorMessage = {
  message: string;
  selector?: string;
  context?: string;
};

type OutputTypeA11y = {
  url: string;
  errorMessages: A11yErrorMessage[];
};

export class Output {
  private outputHTML: OutputTypeHTML[] = [];
  private outputLinks: OutputTypeLink[] = [];
  private outputA11y: OutputTypeA11y[] = [];
  private outputType: OutputType;
  constructor(type: OutputType) {
    this.outputType = type;
  }

  public add(
    url: string,
    errorMessage: HTMLErrorMessage | BrokenLink | A11yErrorMessage
  ) {
    switch (this.outputType) {
      case "a11yTester":
        this.addAlly(url, errorMessage as A11yErrorMessage);
        break;
      case "htmlTester":
        this.addHTML(url, errorMessage as HTMLErrorMessage);
        break;
      case "linkTester":
        this.addBrokenLink(url, errorMessage as BrokenLink);
        break;
    }
  }

  public render(type: RenderType) {
    switch (this.outputType) {
      case "a11yTester":
        this.renderA11yOutput(type);
        break;
      case "htmlTester":
        this.renderHTMLOutput(type);
        break;
      case "linkTester":
        this.renderBrokenLinkOutput(type);
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

  private addBrokenLink(url: string, errorMessage: BrokenLink) {
    const output = this.outputLinks.find((output) => output.url === url);
    if (output) {
      output.brokenLinks.push(errorMessage);
    } else {
      this.outputLinks.push({
        url,
        brokenLinks: [errorMessage],
      });
    }
  }

  private addAlly(url: string, errorMessage: A11yErrorMessage) {
    const output = this.outputA11y.find((output) => output.url === url);
    if (output) {
      output.errorMessages.push(errorMessage);
    } else {
      this.outputA11y.push({
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
    if (output.length > 0) {
      process.stdout.write(output);
      process.exit();
    }
  }

  private renderBrokenLinkOutput(type: RenderType) {
    switch (type) {
      case "console":
        this.renderBrokenLinkOutputConsole();
        break;
      case "json":
        return JSON.stringify(this.outputLinks);
        break;
      case "html":
        break;
    }
  }

  private renderBrokenLinkOutputConsole() {
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

  private renderA11yOutput(type: RenderType) {
    switch (type) {
      case "console":
        this.renderA11yOutputConsole();
        break;
      case "json":
        return JSON.stringify(this.outputA11y);
        break;
      case "html":
        break;
    }
  }

  private renderA11yOutputConsole() {
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
}
