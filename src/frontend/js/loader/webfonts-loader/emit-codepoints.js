var loaderUtils = require("loader-utils");

var hashFiles = require("./utils").hashFiles;

module.exports = {
    createArrayCodepointFiles(codepointFiles, elem) {
        const defaultElem = {
            fileName: "[fontname].codepoints.js",
            type: "web",
        };
        if (typeof elem === "boolean") {
            codepointFiles.push(Object.assign({}, defaultElem));
        } else if (typeof elem === "string") {
            codepointFiles.push(
                Object.assign({}, defaultElem, { fileName: elem })
            );
        } else if (Array.isArray(elem)) {
            elem.forEach((e) =>
                this.createArrayCodepointFiles(codepointFiles, e)
            );
        } else if (typeof elem === "object") {
            codepointFiles.push(Object.assign({}, defaultElem, elem));
        }
    },
    emitFiles(loaderContext, emitCodepointsOptions, generatorOptions, options) {
        var codepointFiles = [];
        this.createArrayCodepointFiles(codepointFiles, emitCodepointsOptions);
        codepointFiles.forEach((emitOption) => {
            var codepointsContent = JSON.stringify(generatorOptions.codepoints);
            switch (emitOption.type) {
                case "commonjs": {
                    codepointsContent =
                        "module.exports = " + codepointsContent + ";";
                    break;
                }
                case "web": {
                    codepointsContent = [
                        "if (typeof webfontIconCodepoints === 'undefined') {",
                        "  webfontIconCodepoints = {};",
                        "}",
                        "webfontIconCodepoints[" +
                            JSON.stringify(generatorOptions.fontName) +
                            "] = " +
                            codepointsContent +
                            ";",
                    ].join("\n");
                    break;
                }
                case "json": {
                    break;
                }
            }

            var codepointsFilename = emitOption.fileName;
            var chunkHash =
                codepointsFilename.indexOf("[chunkhash]") !== -1
                    ? hashFiles(generatorOptions.files, options.hashLength)
                    : "";

            codepointsFilename = codepointsFilename
                .replace("[chunkhash]", chunkHash)
                .replace("[fontname]", generatorOptions.fontName);

            codepointsFilename = loaderUtils.interpolateName(
                loaderContext,
                codepointsFilename,
                {
                    context:
                        loaderContext.rootContext ||
                        loaderContext.options.context ||
                        loaderContext.context,
                    content: codepointsContent,
                }
            );
            loaderContext.emitFile(codepointsFilename, codepointsContent);
        });
    },
};
