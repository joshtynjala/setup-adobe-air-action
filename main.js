const core = require("@actions/core");
const github = require("@actions/github");
const toolCache = require("@actions/tool-cache");
const fs = require("fs");
const path = require("path");

async function setupAdobeAIR() {
  try {
    var airVersion = core.getInput("air-version");
    if (!airVersion) {
      airVersion = "latest";
    } else if (!/^\d{1,2}\.\d$/.test(airVersion)) {
      throw new Error("Invalid Adobe AIR version: " + airVersion);
    }
    console.log("Adobe AIR version: " + airVersion);

    var installLocation = process.platform.startsWith("win")
      ? "c:\\AIR_SDK"
      : "/usr/local/bin/air_sdk";

    var airPlatform = null;
    var filename = "AIRSDK_Compiler";
    if (process.platform.startsWith("darwin")) {
      airPlatform = "mac";
      filename += ".tbz2";
    } else if (process.platform.startsWith("win")) {
      airPlatform = "win";
      filename += ".zip";
    } else {
      throw new Error("Adobe AIR setup is not supported on Linux");
    }
    console.log("Adobe AIR platform: " + airPlatform);

    var archiveUrl = `https://airdownload.adobe.com/air/${airPlatform}/download/${airVersion}/${filename}`;

    var downloadedPath = await toolCache.downloadTool(archiveUrl, filename);
    fs.mkdirSync(installLocation);

    if (process.platform.startsWith("darwin")) {
      await toolCache.extractTar(downloadedPath, installLocation, "xj");
    } else if (process.platform.startsWith("win")) {
      await toolCache.extractZip(downloadedPath, installLocation);
    }

    core.addPath(path.resolve(installLocation, "bin"));
    core.exportVariable("AIR_HOME", installLocation);
  } catch (error) {
    core.setFailed(error.message);
  }
}
setupAdobeAIR();
