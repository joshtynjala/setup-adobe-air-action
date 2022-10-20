// @ts-check
const core = require("@actions/core");
const toolCache = require("@actions/tool-cache");
const fs = require("fs");
const path = require("path");
const child_process = require("child_process");
const fetch = require("node-fetch").default;

const ENV_AIR_HOME = "AIR_HOME";

function setupAIR() {
  try {
    const acceptLicense = core.getInput("accept-license", { required: true });
    if (!acceptLicense) {
      throw new Error(
        "Parameter `accept-license` must be true to accept the Adobe AIR SDK License Agreement. Find it here: https://airsdk.harman.com/assets/pdfs/HARMAN%20AIR%20SDK%20License%20Agreement.pdf"
      );
    }
    const airVersion = core.getInput("air-version", { required: true });
    const parsedMajorVersion = parseInt(airVersion.split(".")[0], 10);
    if (parsedMajorVersion <= 32) {
      // try to set up an old Adobe version of the AIR SDK
      setupAdobeAIR(airVersion);
      return;
    }
    setupHarmanAIR(airVersion);
  } catch (error) {
    core.setFailed(error.message);
  }
}

async function setupHarmanAIR(/** @type string */ airVersion) {
  const releasesResponse = await fetch(
    "https://dcdu3ujoji.execute-api.us-east-1.amazonaws.com/production/releases"
  );
  const releases = await releasesResponse.json();

  let bestMatch = null;
  const requestedParts = airVersion.split(".");
  for (let release of releases.releases) {
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
      // this assumes that the releases are in order from newest to oldest
      bestMatch = releaseName;
      break;
    }
  }
  if (bestMatch == null) {
    throw new Error(`Adobe AIR SDK (HARMAN) version '${airVersion}' not found`);
  }
  airVersion = bestMatch;

  console.log(`Adobe AIR SDK (HARMAN) version: ${airVersion}`);

  const urlsResponse = await fetch(
    `https://dcdu3ujoji.execute-api.us-east-1.amazonaws.com/production/releases/${airVersion}/urls`
  );
  const urls = await urlsResponse.json();

  var urlField = null;
  if (process.platform.startsWith("darwin")) {
    urlField = "AIR_Mac";
  } else if (process.platform.startsWith("win")) {
    urlField = "AIR_Win";
  } else {
    urlField = "AIR_Linux";
  }
  if (!urlField) {
    // this probably shouldn't happen, but best to be safe
    throw new Error(
      `Adobe AIR SDK version '${airVersion}' not found for platform ${process.platform}`
    );
  }
  console.log(`Adobe AIR SDK type: ${urlField}`);

  const archiveUrl = `https://airsdk.harman.com${urls[urlField]}?license=accepted`;
  const filename = path.basename(new URL(archiveUrl).pathname);
  const installLocation = getInstallLocation();
  installSdkFromUrl(archiveUrl, filename, installLocation);
}

async function setupAdobeAIR(/** @type string */ airVersion) {
  if (airVersion == "32") {
    airVersion += ".0";
  }
  if (airVersion != "32.0") {
    throw new Error(
      `Expected Adobe AIR major version 32 or newer. Received version: ${airVersion}`
    );
  }
  console.log(`Adobe AIR SDK version: ${airVersion}`);
  let airPlatform = null;
  let filename = "AIRSDK_Compiler";
  if (process.platform.startsWith("darwin")) {
    airPlatform = "mac";
    filename += ".dmg";
  } else if (process.platform.startsWith("win")) {
    airPlatform = "win";
    filename += ".zip";
  } else {
    throw new Error(
      `Adobe AIR SDK ${airVersion} setup is not supported on Linux`
    );
  }
  console.log(`Adobe AIR SDK type: ${airPlatform}`);

  const archiveUrl = `https://airdownload.adobe.com/air/${airPlatform}/download/${airVersion}/${filename}`;
  const installLocation = getInstallLocation();
  installSdkFromUrl(archiveUrl, filename, installLocation);
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
      child_process.execSync(`hdiutil attach ${filename}`);
      child_process.execSync(`cp -r /Volumes/AIR\\ SDK/* ${installLocation}`);
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
