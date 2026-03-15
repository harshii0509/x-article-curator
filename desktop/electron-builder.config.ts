import type { Configuration } from "electron-builder";

const config: Configuration = {
  appId: "com.nightstand.app",
  productName: "Nightstand",
  directories: {
    buildResources: "resources",
    output: "dist",
  },
  files: ["out/**/*"],
  mac: {
    entitlementsInherit: "build/entitlements.mac.plist",
    extendInfo: {
      NSCameraUsageDescription: "Application requests access to the device's camera.",
      NSMicrophoneUsageDescription:
        "Application requests access to the device's microphone.",
      CFBundleURLTypes: [
        {
          CFBundleURLName: "com.nightstand.app",
          CFBundleURLSchemes: ["com.nightstand.app"],
        },
      ],
    },
    target: [{ target: "dmg", arch: ["arm64", "x64"] }],
  },
  win: {
    executableName: "Nightstand",
    target: [{ target: "nsis", arch: ["x64"] }],
  },
  linux: {
    target: [{ target: "AppImage", arch: ["x64"] }],
  },
  protocols: [
    {
      name: "Nightstand",
      schemes: ["com.nightstand.app"],
    },
  ],
};

export default config;
