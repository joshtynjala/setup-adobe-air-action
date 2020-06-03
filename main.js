const core = require("@actions/core");
const github = require("@actions/github");
const fs = require("fs");
const path = require("path");
const child_process = require("child_process");

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

  if (process.platform.startsWith("darwin")) {
    console.log("Downloading Adobe AIR SDK & Compiler from: " + archiveUrl);

    child_process.execSync("wget --no-verbose " + archiveUrl, {
      stdio: "inherit",
    });
    fs.mkdirSync(installLocation);
    child_process.execSync("tar -C " + installLocation + " -xjf " + filename, {
      stdio: "inherit",
    });
    child_process.execSync("chmod 777 " + installLocation, {
      stdio: "inherit",
    });
  } else if (process.platform.startsWith("win")) {
    child_process.execSync(
      "powershell " +
        __dirname +
        "/download-file-windows.ps1 -url " +
        archiveUrl +
        " -output " +
        filename,
      { stdio: "inherit" }
    );
    fs.mkdirSync(installLocation);
    child_process.execSync(
      "powershell " +
        __dirname +
        "/unzip-file-windows.ps1 -file " +
        filename +
        " -output " +
        installLocation,
      { stdio: "inherit" }
    );
  }

  core.addPath(path.resolve(installLocation, "bin"));
  core.exportVariable("AIR_HOME", installLocation);
} catch (error) {
  core.setFailed(error.message);
}
