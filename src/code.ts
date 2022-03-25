

// This file holds the main code for the plugins. It has access to the *document*.
// You can access browser APIs such as the network by creating a UI which contains
// a full browser environment (see documentation).


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

// Get data from Airtable
var Airtable = require('./airtable');
var base = new Airtable({ apiKey: 'keybFJbuq3xnPLGX9' }).base('appblz15LnTqipptS');  
base('Unify').select({
  view: "Grid view"
}).firstPage(function (err: string, records: any[]|undefined) {
  if (err) { console.error(err); return; }
  if (records) {
    const newStyles: SolidPaint[] = [];

    console.log('records', records);
    records.forEach((record) => {
      const style = figma.createPaintStyle() 
      style.name = <string>record.get("Name");
      const colorRGB = hexToRGB(<string>record.get("Value"));
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
    console.log(newStyles);

  }

});


// const nodes: SceneNode[] = [];
// for (let i = 0; i < numberOfRectangles; i++) {
//   const rect = figma.createRectangle();
//   rect.x = i * 150;
//   rect.fills = [{type: 'SOLID', color: {r: 1, g: 0.5, b: 0}}];
//   figma.currentPage.appendChild(rect);
//   nodes.push(rect);
// }
// figma.currentPage.selection = nodes;
// figma.viewport.scrollAndZoomIntoView(nodes);

// Make sure to close the plugin when you're done. Otherwise the plugin will
// keep running, which shows the cancel button at the bottom of the screen.
figma.closePlugin();
