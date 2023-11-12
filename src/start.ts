/// <reference types="vite/client" />

import { LocalFlow } from "./local-flow";
import { ProductionFlow } from "./production-flow";

if (import.meta.env.VITE_ENVIRONMENT) {
  if (import.meta.env.VITE_ENVIRONMENT === "local") {
    new LocalFlow();
  }
  if (import.meta.env.VITE_ENVIRONMENT === "production") {
    new ProductionFlow();
  }
} else {
  console.log("Please set your environment in .env file");
}
