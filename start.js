const prompts = require("prompts");
const htmlTester = require("./html-tester");
const a11yTester = require("./pa11y-ci");

//https://github.com/terkelg/prompts

(async () => {
  let responseTool = "";
  let type = "";
  let sitemap = "";
  let url = "";
  let project = "";
  let externalUrl = "";

  responseTool = await prompts({
    type: "select",
    name: "value",
    message: "What do you want to do?",
    choices: [
      { title: "Test A11y", value: "a11y" },
      { title: "Test HTML", value: "html" },
    ],
    initial: 0,
  });

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

  if (responseTool.value === "html") {
    if (type.value === "sitemap") {
      if (sitemap.value === "project") {
        htmlTester(
          `http://${project.value}.local.statik.be/sitemap.xml`,
          "",
          true
        );
      } else {
        htmlTester(externalUrl.value);
      }
    }
    if (type.value === "url") {
      htmlTester(null, url.value);
    }
  }

  if (responseTool.value === "a11y") {
    if (type.value === "sitemap") {
      if (sitemap.value === "project") {
        a11yTester(
          `http://${project.value}.local.statik.be/sitemap.xml`,
          "",
          true
        );
      } else {
        a11yTester(externalUrl.value);
      }
    }
    if (type.value === "url") {
      a11yTester(null, url.value);
    }
  }
})();
