// This file holds the main code for the plugins. It has access to the *document*.
// You can access browser APIs such as the network by creating a UI which contains
// a full browser environment (see documentation).


function hexToRGB(hex) {
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

  // Get data from Airtable HERE
  var Airtable = require('airtable/build/airtable.browser');
  var base = new Airtable({ apiKey: 'keybFJbuq3xnPLGX9' }).base('appblz15LnTqipptS');  
  base('Unify').select({
    view: "Grid view"
  }).firstPage(function (err, records) {
    if (err) { console.error(err); return; }
    if (records) {
      const newStyles = [];

      console.log('records', records);
      records.forEach((record) => {
        const style = figma.createPaintStyle() 
        style.name = record.get("Name");
        const colorRGB = hexToRGB(record.get("Value"));
        const paint = 
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

figma.closePlugin();
