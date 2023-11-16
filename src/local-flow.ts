import prompts from "prompts";
import * as fs from "fs";
import { HTMLTester } from "./html-tester";
import { A11yTester } from "./a11y-tester";
import { LinkTester } from "./links-tester";
import { RenderType } from "./types";

export class LocalFlow {
  private output: RenderType | "cli-choose";
  private verbose: boolean;

  constructor(
    output: RenderType | "cli-choose" = "cli",
    verbose: boolean = true
  ) {
    this.output = output;
    this.verbose = verbose;

    let runData = null;
    fs.readFile("./data/session.json", (err: any, buf: any) => {
      if (err) {
        runData = null;
      }
      try {
        runData = JSON.parse(buf.toString());
      } catch (error) {
        runData = null;
      }
      this.startFlow(runData);
    });
  }

  private startFlow(runData: any) {
    (async () => {
      if (this.output === "cli-choose") {
        const renderChoice = await prompts({
          type: "select",
          name: "value",
          message: "Where should the errors be exported to?",
          choices: [
            { title: "CLI", value: "cli" },
            { title: "HTML", value: "html" },
          ],
          initial: 0,
        });

        this.output = renderChoice.value;
      }

      let responseTool: prompts.Answers<"value"> = { value: "" };
      let type: prompts.Answers<"value"> = { value: "" };
      let sitemap: prompts.Answers<"value"> = { value: "" };
      let url: prompts.Answers<"value"> = { value: "" };
      let project: prompts.Answers<"value"> = { value: "" };
      let externalUrl: prompts.Answers<"value"> = { value: "" };

      const prompt: prompts.PromptObject = {
        type: "select",
        name: "value",
        message: "What do you want to do?",
        choices: [
          { title: "Test A11y", value: "a11y" },
          { title: "Test HTML", value: "html" },
          { title: "Test Broken Links", value: "links" },
          { title: "Nothing (Exit)", value: "exit" },
        ],
        initial: 0,
      };

      if (runData && prompt.choices && prompt.choices.length > 0) {
        (prompt.choices as prompts.Choice[]).unshift({
          title: `Run last session again (${runData.responseTool}-test for ${runData.url})`,
          value: "runAgain",
        });
      }

      responseTool = await prompts(prompt);

      if (responseTool.value != "runAgain" && responseTool.value != "exit") {
        type = await prompts({
          type: "select",
          name: "value",
          message: "What do you want to test?",
          choices: [
            { title: "Sitemap", value: "sitemap" },
            { title: "URL", value: "url" },
          ],
          initial: 0,
        });

        switch (type.value) {
          case "sitemap":
            sitemap = await prompts({
              type: "select",
              name: "value",
              message: "Where is the sitemap?",
              choices: [
                { title: "Local project", value: "project" },
                { title: "External URL", value: "externalUrl" },
              ],
              initial: 0,
            });

            switch (sitemap.value) {
              case "project":
                project = await prompts({
                  type: "text",
                  name: "value",
                  message: "What is the project code?",
                });
                break;
              case "externalUrl":
                externalUrl = await prompts({
                  type: "text",
                  name: "value",
                  message: "What is the URL to the sitemap?",
                });
                break;
            }
            break;
          case "url":
            url = await prompts({
              type: "text",
              name: "value",
              message: "What is the URL?",
            });
            break;
        }

        runData = {
          responseTool: responseTool.value,
          type: type.value,
          sitemap: sitemap.value,
          url: url.value,
          project: project.value,
          externalUrl: externalUrl.value,
        };
      } else {
        if (responseTool.value != "exit") {
          responseTool.value = runData.responseTool;
        }
        type.value = runData.type;
        sitemap.value = runData.sitemap;
        url.value = runData.url;
        project.value = runData.project;
        externalUrl.value = runData.externalUrl;
      }

      if (responseTool.value === "html") {
        const htmlTester = new HTMLTester();
        if (type.value === "sitemap") {
          if (sitemap.value === "project") {
            await htmlTester.test(
              `http://${project.value}.local.statik.be/sitemap.xml`,
              "",
              false,
              this.output as RenderType,
              this.verbose
            );
            runData.url = `http://${project.value}.local.statik.be/sitemap.xml`;
          } else {
            await htmlTester.test(
              externalUrl.value,
              "",
              true,
              this.output as RenderType,
              this.verbose
            );
            runData.url = externalUrl.value;
          }
        }
        if (type.value === "url") {
          await htmlTester.test(
            null,
            url.value,
            true,
            this.output as RenderType,
            this.verbose
          );
          runData.url = url.value;
        }
      }

      if (responseTool.value === "a11y") {
        const a11yTester = new A11yTester();
        if (type.value === "sitemap") {
          if (sitemap.value === "project") {
            await a11yTester.test(
              `http://${project.value}.local.statik.be/sitemap.xml`,
              "",
              false,
              this.output as RenderType,
              this.verbose
            );
            runData.url = `http://${project.value}.local.statik.be/sitemap.xml`;
          } else {
            await a11yTester.test(
              externalUrl.value,
              "",
              true,
              this.output as RenderType,
              this.verbose
            );
            runData.url = externalUrl.value;
          }
        }
        if (type.value === "url") {
          await a11yTester.test(
            null,
            url.value,
            true,
            this.output as RenderType,
            this.verbose
          );
          runData.url = url.value;
        }
      }

      if (responseTool.value === "links") {
        const linksTester = new LinkTester();
        if (type.value === "sitemap") {
          if (sitemap.value === "project") {
            await linksTester.test(
              `http://${project.value}.local.statik.be/sitemap.xml`,
              "",
              false,
              this.output as RenderType,
              this.verbose
            );
            runData.url = `http://${project.value}.local.statik.be/sitemap.xml`;
          } else {
            await linksTester.test(
              externalUrl.value,
              "",
              true,
              this.output as RenderType,
              this.verbose
            );
            runData.url = externalUrl.value;
          }
        }
        if (type.value === "url") {
          await linksTester.test(
            null,
            url.value,
            true,
            this.output as RenderType,
            this.verbose
          );
          runData.url = url.value;
        }
      }

      if (responseTool.value != "exit") {
        fs.writeFile(
          "./data/session.json",
          JSON.stringify(runData),
          function (err: any) {
            if (err) console.log(err);
          }
        );
      }
    })();
  }
}
