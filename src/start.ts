/// <reference types="vite/client" />

import { LocalFlow } from "./local-flow";
import { ProductionFlow } from "./production-flow";

if (import.meta.env.VITE_ENVIRONMENT) {
  if (import.meta.env.VITE_ENVIRONMENT === "local") {
    new LocalFlow(import.meta.env.VITE_OUTPUT, import.meta.env.VITE_VERBOSE);
  }
  if (import.meta.env.VITE_ENVIRONMENT === "production") {
    new ProductionFlow(import.meta.env.VITE_VERBOSE);
  }
} else {
  console.log("Please set your environment in .env file");
}
