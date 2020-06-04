# Github Action to setup the Adobe AIR SDK

This action downloads the [Adobe AIR SDK & Compiler](https://www.adobe.com/devnet/air/air-sdk-download.html), adds the _bin_ folder to the `PATH`, and sets the `AIR_HOME` environment variable.

The version of the [Adobe AIR SDK provided by HARMAN](https://airsdk.harman.com/) is currently **not** supported.

## Inputs

### `air-version`

_(Optional)_ Version of the Adobe AIR SDK. This value must include both the major and minor parts, such as `32.0`.

## Example usage

```yml
uses: joshtynjala/setup-adobe-air-action@master
with:
  air-version: "32.0"
```
