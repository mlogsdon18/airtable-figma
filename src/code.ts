// This file holds the main code for the plugins. It has access to the *document*.
// You can access browser APIs such as the network by creating a UI which contains
// a full browser environment (see documentation).

import records from './unify.airtable';

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

if (records) {

  // TODO: Check if styles already exist and update them before adding duplicates

  console.log(records);
  const newStyles: SolidPaint[] = [];

  records.forEach((record) => {
    const style = figma.createPaintStyle() 
    style.name = record.Name;
    const colorRGB = hexToRGB(record.Value);
    const paint: SolidPaint = 
    {
      type: 'SOLID',
      visible: true,
      opacity: 1, 
      blendMode: "NORMAL",
      color: colorRGB
    }
    newStyles.push(paint);
    style.paints = newStyles;

  });

}

// Make sure to close the plugin when you're done. Otherwise the plugin will
// keep running, which shows the cancel button at the bottom of the screen.
figma.closePlugin();
