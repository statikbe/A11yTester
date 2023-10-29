const prompts = require("prompts");
const htmlTester = require("./html-tester");
const a11yTester = require("./pa11y-ci");
const linksTester = require("./links-tester");
const fs = require("fs");

let runData = null;
fs.readFile("session.json", function (err, buf) {
  runData = JSON.parse(buf.toString());
  startFlow();
});

function startFlow() {
  (async () => {
    let responseTool = {};
    let type = {};
    let sitemap = {};
    let url = {};
    let project = {};
    let externalUrl = {};

    const prompt = {
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

    if (runData) {
      prompt.choices.unshift({
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
      if (type.value === "sitemap") {
        if (sitemap.value === "project") {
          await htmlTester(
            `http://${project.value}.local.statik.be/sitemap.xml`,
            "",
            true
          );
          runData.url = `http://${project.value}.local.statik.be/sitemap.xml`;
        } else {
          await htmlTester(externalUrl.value);
          runData.url = externalUrl.value;
        }
      }
      if (type.value === "url") {
        await htmlTester(null, url.value);
        runData.url = url.value;
      }
    }

    if (responseTool.value === "a11y") {
      if (type.value === "sitemap") {
        if (sitemap.value === "project") {
          await a11yTester(
            `http://${project.value}.local.statik.be/sitemap.xml`,
            "",
            true
          );
          runData.url = `http://${project.value}.local.statik.be/sitemap.xml`;
        } else {
          await a11yTester(externalUrl.value);
          runData.url = externalUrl.value;
        }
      }
      if (type.value === "url") {
        await a11yTester(null, url.value);
        runData.url = url.value;
      }
    }

    if (responseTool.value === "links") {
      if (type.value === "sitemap") {
        if (sitemap.value === "project") {
          await linksTester(
            `http://${project.value}.local.statik.be/sitemap.xml`,
            "",
            true
          );
          runData.url = `http://${project.value}.local.statik.be/sitemap.xml`;
        } else {
          await linksTester(externalUrl.value);
          runData.url = externalUrl.value;
        }
      }
      if (type.value === "url") {
        await linksTester(null, url.value);
        runData.url = url.value;
      }
    }

    if (responseTool.value != "exit") {
      fs.writeFile("session.json", JSON.stringify(runData), function (err) {
        if (err) console.log(err);
      });
    }
  })();
}
