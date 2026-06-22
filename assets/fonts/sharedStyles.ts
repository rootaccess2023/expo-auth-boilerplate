export const Hamburg = {
  REGULAR: "Hamburg-Regular",
  ITALIC: "Hamburg-Italic",
  LIGHT: "Hamburg-Light",
  LIGHT_ITALIC: "Hamburg-LightItalic",
  XLIGHT: "Hamburg-XLight",
  XLIGHT_ITALIC: "Hamburg-XLightItalic",
  MEDIUM: "Hamburg-Medium",
  MEDIUM_ITALIC: "Hamburg-MediumItalic",
  BOLD: "Hamburg-Bold",
  BOLD_ITALIC: "Hamburg-BoldItalic",
  XBOLD: "Hamburg-XBold",
  XBOLD_ITALIC: "Hamburg-XBoldItalic",
  HEAVY: "Hamburg-Heavy",
  HEAVY_ITALIC: "Hamburg-HeavyItalic",
} as const;

export const color = {
  PRIMARY: "#13B9B5",
  SURFACE: "#f4f6f8",
} as const;

export const hamburgFonts = {
  [Hamburg.REGULAR]: require("./Hamburg-Serial Regular.ttf"),
  [Hamburg.ITALIC]: require("./Hamburg-Serial RegularItalic.ttf"),
  [Hamburg.LIGHT]: require("./Hamburg-Serial-Light Regular.ttf"),
  [Hamburg.LIGHT_ITALIC]: require("./Hamburg-Serial-Light Regular.ttf"),
  [Hamburg.XLIGHT]: require("./Hamburg-Serial-ExtraLight Regular.ttf"),
  [Hamburg.XLIGHT_ITALIC]: require("./Hamburg-Serial-ExtraLight Regular.ttf"),
  [Hamburg.MEDIUM]: require("./Hamburg-Serial-Medium Regular.ttf"),
  [Hamburg.MEDIUM_ITALIC]: require("./Hamburg-Serial-Medium Regular.ttf"),
  [Hamburg.BOLD]: require("./Hamburg-Serial Bold.ttf"),
  [Hamburg.BOLD_ITALIC]: require("./Hamburg-Serial BoldItalic.ttf"),
  [Hamburg.XBOLD]: require("./Hamburg-Serial-ExtraBold Regular.ttf"),
  [Hamburg.XBOLD_ITALIC]: require("./Hamburg-Serial-ExtraBold Regular.ttf"),
  [Hamburg.HEAVY]: require("./Hamburg-Serial-Heavy Regular.ttf"),
  [Hamburg.HEAVY_ITALIC]: require("./Hamburg-Serial-Heavy RegularItalic.ttf"),
};
