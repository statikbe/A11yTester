import colors from "colors";
import { HTMLRenderer } from "./html-renderer";
import { A11yRenderer } from "./a11y-renderer";
import { LinksRenderer } from "./links-renderer";

export type RenderType = "cli" | "json" | "html";
export type OutputType = "a11yTester" | "htmlTester" | "linkTester";

export type HTMLErrorMessage = {
  message: string;
  line?: number;
  column?: number;
  selector?: string;
  ruleId?: string;
  ruleUrl?: string;
};

export type OutputTypeHTML = {
  url: string;
  errorMessages: HTMLErrorMessage[];
  numberOfErrors?: number;
  id?: string;
};

export type BrokenLink = {
  url: string;
  status: string;
  tag?: string;
  selector?: string;
  linkText?: string;
};

export type OutputTypeLink = {
  url: string;
  brokenLinks: BrokenLink[];
  okLinks?: BrokenLink[];
  numberOfErrors?: number;
  numberOfOKLinks?: number;
  id?: string;
};

export type A11yErrorMessage = {
  message: string;
  selector?: string;
  context?: string;
};

export type OutputTypeA11y = {
  url: string;
  errorMessages: A11yErrorMessage[];
  numberOfErrors?: number;
  id?: string;
};

export class Output {
  private outputHTML: OutputTypeHTML[] = [];
  private outputLinks: OutputTypeLink[] = [];
  private outputA11y: OutputTypeA11y[] = [];
  private outputType: OutputType;
  private url: string;

  constructor(type: OutputType, url: string) {
    this.outputType = type;
    this.url = url;
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

  private renderA11yOutput(type: RenderType) {
    const a11yRenderer = new A11yRenderer(this.outputA11y);
    switch (type) {
      case "cli":
        a11yRenderer.renderA11yOutputConsole();
        break;
      case "json":
        return JSON.stringify(this.outputA11y);
        break;
      case "html":
        a11yRenderer.renderA11yOutputHTML(this.url);
        break;
    }
  }

  private renderHTMLOutput(type: RenderType) {
    const htmlRenderer = new HTMLRenderer(this.outputHTML);
    switch (type) {
      case "cli":
        htmlRenderer.renderHTMLOutputConsole();
        break;
      case "json":
        return JSON.stringify(this.outputHTML);
        break;
      case "html":
        htmlRenderer.renderHTMLOutputHTML(this.url);
        break;
    }
  }

  private renderBrokenLinkOutput(type: RenderType) {
    const linksRenderer = new LinksRenderer(this.outputLinks);
    switch (type) {
      case "cli":
        linksRenderer.renderBrokenLinkOutputConsole();
        break;
      case "json":
        return JSON.stringify(this.outputLinks);
        break;
      case "html":
        linksRenderer.renderHTMLOutputHTML(this.url);
        break;
    }
  }
}
