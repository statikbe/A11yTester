const prompts = require("prompts");

//https://github.com/terkelg/prompts

(async () => {
  const responseTool = await prompts({
    type: "select",
    name: "value",
    message: "What do you want to do?",
    choices: [
      { title: "Test A11y", value: "a11y" },
      { title: "Test HTML", value: "html" },
    ],
    initial: 0,
  });

  const type = await prompts({
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
      const sitemap = await prompts({
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
          const project = await prompts({
            type: "text",
            name: "value",
            message: "What is the project code?",
          });
          break;
        case "externalUrl":
          const externalUrl = await prompts({
            type: "text",
            name: "value",
            message: "What is the URL to the sitemap?",
          });
          break;
      }
      break;
    case "url":
      const url = await prompts({
        type: "text",
        name: "value",
        message: "What is the URL?",
      });
      break;
  }

  //   console.log(responseTool, type, sitemap, url, project, externalUrl); // => { value: 24 }
})();
