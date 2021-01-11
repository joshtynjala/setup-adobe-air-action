const core = require("@actions/core");
const toolCache = require("@actions/tool-cache");
const fs = require("fs");
const path = require("path");
const child_process = require("child_process");

async function setupAdobeAIR() {
  try {
    var airVersion = core.getInput("air-version");
    if (!airVersion) {
      airVersion = "32.0";
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
      if (airVersion === "latest") {
        filename += ".tbz2";
      } else {
        filename += ".dmg";
      }
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
      if (path.extname(filename) === ".dmg") {
        child_process.execSync("hdiutil attach " + filename);
        child_process.execSync("cp -r /Volumes/AIR\\ SDK/* " + installLocation);
      } else {
        await toolCache.extractTar(downloadedPath, installLocation, "xj");
      }
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
