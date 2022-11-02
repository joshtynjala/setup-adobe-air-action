# Github Action to setup the Adobe AIR SDK

This action downloads the [Adobe AIR SDK by HARMAN](https://airsdk.harman.com/), adds the SDK's _bin_ folder to the `PATH`, and sets the `AIR_HOME` environment variable.

**Note:** Purchasing a [commercial license](https://airsdk.harman.com/pricing) is required to unlock certain new, restricted features of the Adobe AIR SDK by HARMAN. However, "compiling SWFs and using other utilities such as the ATF tools remain a free activity."

## Inputs

### `air-version`

_(Required)_ The version of the Adobe AIR SDK to set up. An exact version, such as `50.0.1.1`, is recommended. However, a less specific version, like `50.0` or `50`, is allowed.

### `accept-license`

_(Required)_ Set to `true` if you accept the [Adobe AIR SDK License Agreement](https://airsdk.harman.com/assets/pdfs/HARMAN%20AIR%20SDK%20License%20Agreement.pdf). The action will fail if the agreement is not accepted.

### `license-base64`

_(Optional)_ Use with an [encrypted secret](https://docs.github.com/en/actions/security-guides/encrypted-secrets) to optionally provide a valid _adt.lic_ file, [encoded as a Base64 string](https://docs.github.com/en/actions/security-guides/encrypted-secrets#storing-base64-binary-blobs-as-secrets), to unlock new, restricted features.

**Warning!** Never include the raw Base64-encoded string value directly in your Github Actions _.yml_ file. You **must** use an [encrypted secret](https://docs.github.com/en/actions/security-guides/encrypted-secrets) to prevent your license file from being leaked publicly.

## Example usage

Use the AIR SDK by HARMAN for free activities:

```yml
uses: joshtynjala/setup-adobe-air-action@v2
with:
  air-version: "50.0.1.1"
  accept-license: true
```

Specify an encypted secret containing a Base64-encoded license file to unlock new, restricted features:

```yml
uses: joshtynjala/setup-adobe-air-action@v2
with:
  air-version: "50.0.1.1"
  accept-license: true
  license-base64: ${{ secrets.AIR_SDK_LICENSE_FILE }}
```


