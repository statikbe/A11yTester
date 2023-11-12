import prompts from "prompts";
import * as fs from "fs";
import { HTMLTester } from "./html-tester";
import { A11yTester } from "./pa11y-ci";
import { LinkTester } from "./links-tester";

export class LocalFlow {
  constructor() {
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
              ""
            );
            runData.url = `http://${project.value}.local.statik.be/sitemap.xml`;
          } else {
            await htmlTester.test(externalUrl.value);
            runData.url = externalUrl.value;
          }
        }
        if (type.value === "url") {
          await htmlTester.test(null, url.value);
          runData.url = url.value;
        }
      }

      if (responseTool.value === "a11y") {
        const a11yTester = new A11yTester();
        if (type.value === "sitemap") {
          if (sitemap.value === "project") {
            await a11yTester.test(
              `http://${project.value}.local.statik.be/sitemap.xml`,
              ""
            );
            runData.url = `http://${project.value}.local.statik.be/sitemap.xml`;
          } else {
            await a11yTester.test(externalUrl.value);
            runData.url = externalUrl.value;
          }
        }
        if (type.value === "url") {
          await a11yTester.test(null, url.value);
          runData.url = url.value;
        }
      }

      if (responseTool.value === "links") {
        const linksTester = new LinkTester();
        if (type.value === "sitemap") {
          if (sitemap.value === "project") {
            await linksTester.test(
              `http://${project.value}.local.statik.be/sitemap.xml`,
              ""
            );
            runData.url = `http://${project.value}.local.statik.be/sitemap.xml`;
          } else {
            await linksTester.test(externalUrl.value);
            runData.url = externalUrl.value;
          }
        }
        if (type.value === "url") {
          await linksTester.test(null, url.value);
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
