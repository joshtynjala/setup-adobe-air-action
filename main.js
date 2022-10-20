const core = require("@actions/core");
const toolCache = require("@actions/tool-cache");
const fs = require("fs");
const path = require("path");
const child_process = require("child_process");
const fetch = require("node-fetch");

const ENV_AIR_HOME = "AIR_HOME";

function setupAIR() {
  const airVersion = core.getInput("air-version");
  if (!airVersion || airVersion == "32.0") {
    setupAdobeAIR();
    return;
  }
  setupHarmanAIR();
}

async function setupHarmanAIR() {
  try {
    const acceptLicense = core.getInput("accept-license", { required: true });
    if (!acceptLicense) {
      core.setFailed(
        "Missing `accept-license: true`. Must accept the Adobe AIR SDK License Agreement: https://airsdk.harman.com/assets/pdfs/HARMAN%20AIR%20SDK%20License%20Agreement.pdf"
      );
      return;
    }
    let airVersion = core.getInput("air-version");
    if (!airVersion) {
      const latest = await fetch(
        "https://dcdu3ujoji.execute-api.us-east-1.amazonaws.com/production/releases/latest"
      ).json();
      airVersion = latest.name;
    } else {
      const releases = await fetch(
        "https://dcdu3ujoji.execute-api.us-east-1.amazonaws.com/production/releases"
      ).json().releases;

      let bestMatch = null;
      const requestedParts = airVersion.split(".");
      for (let release of releases) {
        const releaseName = release.name;
        const releaseParts = releaseName.split(".");
        let matched = true;
        for (let i = 0; i < requestedParts.length; i++) {
          if (requestedParts[i] != releaseParts[i]) {
            matched = false;
            break;
          }
        }
        if (matched) {
          bestMatch = releaseName;
          break;
        }
      }
      if (bestMatch == null) {
        core.setFailed(
          `Adobe AIR SDK (HARMAN) version '${airVersion}' not found`
        );
        return;
      }
      airVersion = bestMatch;
    }
    console.log("Adobe AIR SDK (HARMAN) version: " + airVersion);

    const urls = await fetch(
      `https://dcdu3ujoji.execute-api.us-east-1.amazonaws.com/production/releases/${airVersion}/urls`
    ).json();
    var urlField = null;
    if (process.platform.startsWith("darwin")) {
      urlField = "AIR_Mac";
    } else if (process.platform.startsWith("win")) {
      urlField = "AIR_Win";
    } else {
      urlField = "AIR_Linux";
    }
    if (!urlField) {
      core.setFailed(`Adobe AIR SDK version '${urlField}' not found`);
      return;
    }

    const archiveUrl = `https://airsdk.harman.com${urls[urlField]}?license=accepted`;
    const filename = path.basename(new URL(archiveUrl).pathname);
    installSdkFromUrl(archiveUrl, filename, installLocation);
  } catch (error) {
    core.setFailed(error.message);
  }
}

async function setupAdobeAIR() {
  try {
    let airVersion = core.getInput("air-version");
    if (!airVersion) {
      airVersion = "32.0";
    } else if (!/^\d{1,2}\.\d$/.test(airVersion)) {
      throw new Error("Invalid Adobe AIR version: " + airVersion);
    }
    console.log("Adobe AIR SDK version: " + airVersion);

    const installLocation = getInstallLocation();

    let airPlatform = null;
    let filename = "AIRSDK_Compiler";
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
      throw new Error(
        `Adobe AIR SDK ${airVersion} setup is not supported on Linux`
      );
    }
    console.log("Adobe AIR platform: " + airPlatform);

    const archiveUrl = `https://airdownload.adobe.com/air/${airPlatform}/download/${airVersion}/${filename}`;
    installSdkFromUrl(archiveUrl, filename, installLocation);
  } catch (error) {
    core.setFailed(error.message);
  }
}

function getInstallLocation() {
  return process.platform.startsWith("win")
    ? "c:\\AIR_SDK"
    : "/usr/local/bin/air_sdk";
}

async function installSdkFromUrl(archiveUrl, filename, installLocation) {
  const downloadedPath = await toolCache.downloadTool(archiveUrl, filename);
  fs.mkdirSync(installLocation);

  switch (path.extname(filename)) {
    case ".dmg":
      child_process.execSync("hdiutil attach " + filename);
      child_process.execSync("cp -r /Volumes/AIR\\ SDK/* " + installLocation);
      break;
    case ".zip":
      await toolCache.extractZip(downloadedPath, installLocation);
      break;
    default:
      await toolCache.extractTar(downloadedPath, installLocation, "xj");
  }

  core.addPath(path.resolve(installLocation, "bin"));
  core.exportVariable(ENV_AIR_HOME, installLocation);
}

setupAIR();
