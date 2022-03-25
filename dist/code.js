/******/ (() => { // webpackBootstrap
var __webpack_exports__ = {};
/*!*********************!*\
  !*** ./src/code.ts ***!
  \*********************/
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
    };
    return result;
}
// Get data from Airtable
var base = new Airtable({ apiKey: 'keybFJbuq3xnPLGX9' }).base('appblz15LnTqipptS');
base('Unify').select({
    view: "Grid view"
}).firstPage(function (err, records) {
    if (err) {
        console.error(err);
        return;
    }
    if (records) {
        const newStyles = [];
        console.log('records', records);
        records.forEach((record) => {
            const style = figma.createPaintStyle();
            style.name = record.get("Name");
            const colorRGB = hexToRGB(record.get("Value"));
            const paint = {
                type: 'SOLID',
                visible: true,
                opacity: 1,
                blendMode: "NORMAL",
                color: colorRGB
            };
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

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZS5qcyIsIm1hcHBpbmdzIjoiOzs7OztBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDBCQUEwQiw2QkFBNkI7QUFDdkQ7QUFDQTtBQUNBLENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxDQUFDO0FBQ0Q7QUFDQSxtQkFBbUIsd0JBQXdCO0FBQzNDO0FBQ0E7QUFDQSxvQkFBb0IsdUJBQXVCLG9CQUFvQjtBQUMvRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vQWlydGFibGUvLi9zcmMvY29kZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBUaGlzIGZpbGUgaG9sZHMgdGhlIG1haW4gY29kZSBmb3IgdGhlIHBsdWdpbnMuIEl0IGhhcyBhY2Nlc3MgdG8gdGhlICpkb2N1bWVudCouXG4vLyBZb3UgY2FuIGFjY2VzcyBicm93c2VyIEFQSXMgc3VjaCBhcyB0aGUgbmV0d29yayBieSBjcmVhdGluZyBhIFVJIHdoaWNoIGNvbnRhaW5zXG4vLyBhIGZ1bGwgYnJvd3NlciBlbnZpcm9ubWVudCAoc2VlIGRvY3VtZW50YXRpb24pLlxuZnVuY3Rpb24gaGV4VG9SR0IoaGV4KSB7XG4gICAgY29uc3QgciA9IChwYXJzZUludChoZXguc2xpY2UoMSwgMyksIDE2KSAvIDI1NSk7XG4gICAgY29uc3QgZyA9IChwYXJzZUludChoZXguc2xpY2UoMywgNSksIDE2KSAvIDI1NSk7XG4gICAgY29uc3QgYiA9IChwYXJzZUludChoZXguc2xpY2UoNSwgNyksIDE2KSAvIDI1NSk7XG4gICAgY29uc3QgcmVzdWx0ID0ge1xuICAgICAgICByOiByLFxuICAgICAgICBnOiBnLFxuICAgICAgICBiOiBiXG4gICAgfTtcbiAgICByZXR1cm4gcmVzdWx0O1xufVxuLy8gR2V0IGRhdGEgZnJvbSBBaXJ0YWJsZVxudmFyIGJhc2UgPSBuZXcgQWlydGFibGUoeyBhcGlLZXk6ICdrZXliRkpidXEzeG5QTEdYOScgfSkuYmFzZSgnYXBwYmx6MTVMblRxaXBwdFMnKTtcbmJhc2UoJ1VuaWZ5Jykuc2VsZWN0KHtcbiAgICB2aWV3OiBcIkdyaWQgdmlld1wiXG59KS5maXJzdFBhZ2UoZnVuY3Rpb24gKGVyciwgcmVjb3Jkcykge1xuICAgIGlmIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChyZWNvcmRzKSB7XG4gICAgICAgIGNvbnN0IG5ld1N0eWxlcyA9IFtdO1xuICAgICAgICBjb25zb2xlLmxvZygncmVjb3JkcycsIHJlY29yZHMpO1xuICAgICAgICByZWNvcmRzLmZvckVhY2goKHJlY29yZCkgPT4ge1xuICAgICAgICAgICAgY29uc3Qgc3R5bGUgPSBmaWdtYS5jcmVhdGVQYWludFN0eWxlKCk7XG4gICAgICAgICAgICBzdHlsZS5uYW1lID0gcmVjb3JkLmdldChcIk5hbWVcIik7XG4gICAgICAgICAgICBjb25zdCBjb2xvclJHQiA9IGhleFRvUkdCKHJlY29yZC5nZXQoXCJWYWx1ZVwiKSk7XG4gICAgICAgICAgICBjb25zdCBwYWludCA9IHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnU09MSUQnLFxuICAgICAgICAgICAgICAgIHZpc2libGU6IHRydWUsXG4gICAgICAgICAgICAgICAgb3BhY2l0eTogMSxcbiAgICAgICAgICAgICAgICBibGVuZE1vZGU6IFwiTk9STUFMXCIsXG4gICAgICAgICAgICAgICAgY29sb3I6IGNvbG9yUkdCXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgbmV3U3R5bGVzLnB1c2gocGFpbnQpO1xuICAgICAgICAgICAgc3R5bGUucGFpbnRzID0gbmV3U3R5bGVzO1xuICAgICAgICB9KTtcbiAgICAgICAgY29uc29sZS5sb2cobmV3U3R5bGVzKTtcbiAgICB9XG59KTtcbi8vIGNvbnN0IG5vZGVzOiBTY2VuZU5vZGVbXSA9IFtdO1xuLy8gZm9yIChsZXQgaSA9IDA7IGkgPCBudW1iZXJPZlJlY3RhbmdsZXM7IGkrKykge1xuLy8gICBjb25zdCByZWN0ID0gZmlnbWEuY3JlYXRlUmVjdGFuZ2xlKCk7XG4vLyAgIHJlY3QueCA9IGkgKiAxNTA7XG4vLyAgIHJlY3QuZmlsbHMgPSBbe3R5cGU6ICdTT0xJRCcsIGNvbG9yOiB7cjogMSwgZzogMC41LCBiOiAwfX1dO1xuLy8gICBmaWdtYS5jdXJyZW50UGFnZS5hcHBlbmRDaGlsZChyZWN0KTtcbi8vICAgbm9kZXMucHVzaChyZWN0KTtcbi8vIH1cbi8vIGZpZ21hLmN1cnJlbnRQYWdlLnNlbGVjdGlvbiA9IG5vZGVzO1xuLy8gZmlnbWEudmlld3BvcnQuc2Nyb2xsQW5kWm9vbUludG9WaWV3KG5vZGVzKTtcbi8vIE1ha2Ugc3VyZSB0byBjbG9zZSB0aGUgcGx1Z2luIHdoZW4geW91J3JlIGRvbmUuIE90aGVyd2lzZSB0aGUgcGx1Z2luIHdpbGxcbi8vIGtlZXAgcnVubmluZywgd2hpY2ggc2hvd3MgdGhlIGNhbmNlbCBidXR0b24gYXQgdGhlIGJvdHRvbSBvZiB0aGUgc2NyZWVuLlxuZmlnbWEuY2xvc2VQbHVnaW4oKTtcbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==