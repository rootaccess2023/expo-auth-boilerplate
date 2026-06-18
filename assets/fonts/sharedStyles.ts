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
  [Hamburg.REGULAR]: require("./fonnts.com-hamburg_serial-regular.otf"),
  [Hamburg.ITALIC]: require("./fonnts.com-hamburg_serial-italic.otf"),
  [Hamburg.LIGHT]: require("./fonnts.com-hamburg_serial-light.otf"),
  [Hamburg.LIGHT_ITALIC]: require("./fonnts.com-hamburg_serial-lightitalic.otf"),
  [Hamburg.XLIGHT]: require("./fonnts.com-hamburg_serial-xlight.otf"),
  [Hamburg.XLIGHT_ITALIC]: require("./fonnts.com-hamburg_serial-xlightitalic.otf"),
  [Hamburg.MEDIUM]: require("./fonnts.com-hamburg_serial-medium.otf"),
  [Hamburg.MEDIUM_ITALIC]: require("./fonnts.com-hamburg_serial-mediumitalic.otf"),
  [Hamburg.BOLD]: require("./fonnts.com-hamburg_serial-bold.otf"),
  [Hamburg.BOLD_ITALIC]: require("./fonnts.com-hamburg_serial-bolditalic.otf"),
  [Hamburg.XBOLD]: require("./fonnts.com-hamburg_serial-xbold.otf"),
  [Hamburg.XBOLD_ITALIC]: require("./fonnts.com-hamburg_serial-xbolditalic.otf"),
  [Hamburg.HEAVY]: require("./fonnts.com-hamburg_serial-heavy.otf"),
  [Hamburg.HEAVY_ITALIC]: require("./fonnts.com-hamburg_serial-heavyitalic.otf"),
};
