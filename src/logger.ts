import * as fs from "fs";

import { OutputTypeA11y, OutputTypeHTML, OutputTypeLink } from "./types";

export class Logger {
  constructor() {}

  public static GetNewErrors(
    type: "html" | "link" | "a11y",
    output: OutputTypeHTML | OutputTypeLink | OutputTypeA11y
  ) {
    if (fs.existsSync(`./data/logs/${type}-${output[0].id}.json`)) {
      try {
        const previousData = JSON.parse(
          fs.readFileSync(`./data/logs/${type}-${output[0].id}.json`, "utf8")
        );
        const newErrors = output[0].errorMessages.filter(
          (error) =>
            !previousData.errorMessages.some(
              (previousError) =>
                previousError.message === error.message &&
                (previousError.selector === error.selector ||
                  error.ruleId == "form-dup-name")
            )
        );
        return newErrors;
      } catch (error) {
        console.log(error);
      }
    } else {
      fs.writeFile(
        `./data/logs/${type}-${output[0].id}.json`,
        JSON.stringify(output[0]),
        (err: any) => {
          if (err) throw err;
        }
      );
      return output[0].errorMessages;
    }
  }
}
