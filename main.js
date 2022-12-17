// @ts-check
const core = require("@actions/core");
const toolCache = require("@actions/tool-cache");
const fs = require("fs");
const os = require("os");
const path = require("path");
const child_process = require("child_process");
const fetch = require("node-fetch").default;

const ENV_AIR_HOME = "AIR_HOME";
const AIR_TOOL_CACHE_NAME = "adobe-air";

async function setupAIR() {
  try {
    const acceptLicense = core.getInput("accept-license", { required: true });
    if (!acceptLicense) {
      throw new Error(
        "Parameter `accept-license` must be true to accept the Adobe AIR SDK License Agreement. Find it here: https://airsdk.harman.com/assets/pdfs/HARMAN%20AIR%20SDK%20License%20Agreement.pdf"
      );
    }
    const licenseFile = core.getInput("license-base64", { required: false });
    if (licenseFile) {
      const licenseBuffer = Buffer.from(licenseFile, "base64");
      const licensePath = path.join(os.homedir(), ".airsdk", "adt.lic");
      fs.mkdirSync(path.dirname(licensePath), { recursive: true });
      fs.writeFileSync(licensePath, licenseBuffer);
    }
    const airVersion = core.getInput("air-version", { required: true });
    const parsedMajorVersion = parseInt(airVersion.split(".")[0], 10);
    if (parsedMajorVersion <= 32) {
      // try to set up an old Adobe version of the AIR SDK
      await setupAdobeAIR(airVersion);
      return;
    }
    await setupHarmanAIR(airVersion);
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

  core.info(`Adobe AIR SDK (HARMAN) version: ${airVersion}`);

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
  core.info(`Adobe AIR SDK type: ${urlField}`);

  const archiveUrl = `https://airsdk.harman.com${urls[urlField]}?license=accepted`;
  const filename = path.basename(new URL(archiveUrl).pathname);
  const installLocation = getInstallLocation();
  await installSdkFromUrl(archiveUrl, filename, installLocation, airVersion);
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
  core.info(`Adobe AIR SDK version: ${airVersion}`);
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
  console.info(`Adobe AIR SDK type: ${airPlatform}`);

  const archiveUrl = `https://airdownload.adobe.com/air/${airPlatform}/download/${airVersion}/${filename}`;
  const installLocation = getInstallLocation();
  await installSdkFromUrl(archiveUrl, filename, installLocation, airVersion);
}

function getInstallLocation() {
  return process.platform.startsWith("win")
    ? "c:\\AIR_SDK"
    : "/usr/local/bin/air_sdk";
}

async function installSdkFromUrl(
  /** @type string */ archiveUrl,
  /** @type string */ filename,
  /** @type string */ installLocation,
  /** @type string */ airVersion
) {
  let cacheLocation = toolCache.find(AIR_TOOL_CACHE_NAME, airVersion);
  if (cacheLocation) {
    core.info(`Resolved Adobe AIR SDK ${airVersion} from tool-cache`);
  } else {
    core.info(
      `Adobe AIR SDK ${airVersion} was not found in tool-cache. Trying to download...`
    );
    const downloadedPath = await toolCache.downloadTool(archiveUrl, filename);
    fs.mkdirSync(installLocation, { recursive: true });

    if (process.platform.startsWith("win")) {
      await toolCache.extractZip(downloadedPath, installLocation);
    } else {
      const extname = path.extname(filename);
      switch (extname) {
        case ".dmg":
          child_process.execSync(`hdiutil attach ${downloadedPath}`);
          child_process.execSync(
            `cp -r /Volumes/AIR\\ SDK/* ${installLocation}`
          );
          break;
        case ".zip":
          // toolCache.extractZip() doesn't seem to work properly on macOS or Linux
          child_process.execSync(
            `/usr/bin/unzip -o -q ${downloadedPath} -d ${installLocation}`
          );
          break;
        default:
          throw new Error(
            `Failed to extract '${downloadedPath}' because the file extension is unrecognized: ${extname}`
          );
      }
    }

    cacheLocation = await toolCache.cacheDir(
      installLocation,
      AIR_TOOL_CACHE_NAME,
      airVersion
    );
  }
  core.addPath(path.resolve(cacheLocation, "bin"));
  core.exportVariable(ENV_AIR_HOME, cacheLocation);
}

setupAIR();
