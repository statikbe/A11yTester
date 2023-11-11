require("dotenv").config();
if (process.env.ENVIRONMENT) {
  if (process.env.ENVIRONMENT === "local") {
    const localFlow = require("./local-flow");
    localFlow();
  }
  if (process.env.ENVIRONMENT === "production") {
    const productionFlow = require("./production-flow");
    productionFlow();
  }
} else {
  console.log("Please set your environment in .env file");
}
