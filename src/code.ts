// This file holds the main code for the plugins. It has access to the *document*.
// You can access browser APIs such as the network by creating a UI which contains
// a full browser environment (see documentation).

import records from './records.airtable';


function hexToRGB(hex: string) {
  const r = (parseInt(hex.slice(1, 3), 16) / 255);
  const g = (parseInt(hex.slice(3, 5), 16) / 255);
  const b = (parseInt(hex.slice(5, 7), 16) / 255);

  const result = {
    r: r,
    g: g,
    b: b
  }

  return result;
}

function rgbtoRGB(rgb: String) {
  var rgbValues = rgb.substring(4).split(")")[0].split(",");

  let r = parseInt(rgbValues[0]) / 255,
  g = parseInt(rgbValues[1].substring(0,rgbValues[1].length - 1)) / 255,
  b = parseInt(rgbValues[2].substring(0,rgbValues[2].length - 1)) / 255;

  const result = {
    r: r,
    g: g,
    b: b
  }

  return result;
}

function hslToRGB(hsl: String) {
  var hslValues = hsl.substring(4).split(")")[0].split(",");

  let h = parseInt(hslValues[0]),
  s = parseInt(hslValues[1].substring(0,hslValues[1].length - 1)) / 100,
  l = parseInt(hslValues[2].substring(0,hslValues[2].length - 1)) / 100;

  let c = (1 - Math.abs(2 * l - 1)) * s,
      x = c * (1 - Math.abs((h / 60) % 2 - 1)),
      m = l - c/2,
      r = 0,
      g = 0,
      b = 0;
      if (0 <= h && h < 60) {
        r = c; g = x; b = 0;  
      } else if (60 <= h && h < 120) {
        r = x; g = c; b = 0;
      } else if (120 <= h && h < 180) {
        r = 0; g = c; b = x;
      } else if (180 <= h && h < 240) {
        r = 0; g = x; b = c;
      } else if (240 <= h && h < 300) {
        r = x; g = 0; b = c;
      } else if (300 <= h && h < 360) {
        r = c; g = 0; b = x;
      }
      r = r + m;
      g = g + m;
      b = b + m;

      const result = {
        r: r,
        g: g,
        b: b
      }

      return result;
}

const isHex = (colorValue: string) => {
  return colorValue.includes('#');
}

const isHsl = (colorValue: string) => {
  return colorValue.includes('hsl');
}

const isRgb = (colorValue: string) => {
  return colorValue.includes('rgb');
}

if (records) {

  // Get existing styles from Figma
  const colors = figma.getLocalPaintStyles();

  const colorsArray: String[] = [];

  colors.map((paint: PaintStyle ) => 
    colorsArray.push(paint.name)
  );

  
  const newStyles: SolidPaint[] = [];

  records.forEach((record) => {
    var colorRGB;

    // Check format of color and convert to RGB object
    if (isHex(record.Value)) {
      colorRGB = hexToRGB(record.Value);
    } else if (isHsl(record.Value)) {
      colorRGB = hslToRGB(record.Value);
    } else {
      colorRGB = rgbtoRGB(record.Value);
    }

    // Check if style already exists in Figma file
    if (colorsArray.includes(record.Name)) { 
      // We need to overwrite the current style if it already exists 
      const existingStyle = colors.filter((paint: PaintStyle ) => {
        return paint.name == record.Name;
      });
      const existingStyleColor: PaintStyle = existingStyle[0];
      const paint: SolidPaint = 
      {
        type: 'SOLID',
        visible: true,
        opacity: record.Opacity, 
        blendMode: "NORMAL",
        color: colorRGB
      }
      existingStyleColor.paints = [paint];
    
    // Otherwise create the new style
    } else {
      const style = figma.createPaintStyle() 
      style.name = record.Name;
      const paint: SolidPaint = 
      {
        type: 'SOLID',
        visible: true,
        opacity: record.Opacity, 
        blendMode: "NORMAL",
        color: colorRGB
      }
      newStyles.push(paint);
      style.paints = newStyles;
    }

  });

}

// Make sure to close the plugin when you're done. Otherwise the plugin will
// keep running, which shows the cancel button at the bottom of the screen.
figma.closePlugin();
