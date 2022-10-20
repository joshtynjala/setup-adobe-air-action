# Github Action to setup the Adobe AIR SDK

This action downloads the [Adobe AIR SDK by HARMAN](https://airsdk.harman.com/), adds the SDK's _bin_ folder to the `PATH`, and sets the `AIR_HOME` environment variable.

## Inputs

### `air-version`

_(Required)_ The version of the Adobe AIR SDK to set up. An exact version, such as `50.0.1.1`, is recommended. However, a less specific version, like `50.0` or `50`, is allowed.

### `accept-license`

_(Required)_ Set to `true` if you accept the [Adobe AIR SDK License Agreement](https://airsdk.harman.com/assets/pdfs/HARMAN%20AIR%20SDK%20License%20Agreement.pdf). The action will fail if the license is not accepted.

## Example usage

```yml
uses: joshtynjala/setup-adobe-air-action@v2
with:
  air-version: "50.0.1.1"
  accept-license: true
```
