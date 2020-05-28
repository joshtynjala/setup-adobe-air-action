const core = require("@actions/core");
const github = require("@actions/github");
const fs = require("fs");
const path = require("path");
const child_process = require("child_process");

try {
  if (process.platform.startsWith("linux")) {
    throw new Error("Adobe AIR setup is not supported on Linux");
  }

  var airVersion = "latest";
  console.log("airVersion: " + airVersion);

  var installLocation = process.platform.startsWith("win")
    ? "c:\\AIR_SDK"
    : "/usr/local/bin/air_sdk";

  var archiveUrl =
    "https://airdownload.adobe.com/air/win/download/" +
    airVersion +
    "/AIRSDK_Compiler";

  if (process.platform.startsWith("darwin")) {
    archiveUrl += ".tbz2";
    console.log("Downloading Adobe AIR SDK & Compiler from: " + archiveUrl);

    child_process.execSync("wget " + archiveUrl, { stdio: "inherit" });
    fs.mkdirSync(installLocation);
    child_process.execSync("tar -C " + installLocation + " -xjf " + filename, {
      stdio: "inherit",
    });
    child_process.execSync("chmod 777 " + installLocation, {
      stdio: "inherit",
    });
  } else if (process.platform.startsWith("win")) {
    archiveUrl += ".zip";
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
