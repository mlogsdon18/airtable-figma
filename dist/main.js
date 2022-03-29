/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/unify.airtable":
/*!****************************!*\
  !*** ./src/unify.airtable ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ([{"Name":"primary_color","Value":"#ffd900"},{"Name":"secondary_color","Value":"#efefef"},{"Name":"error_color","Value":"hsl(0, 100%, 50%)"}]);

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!*********************!*\
  !*** ./src/code.ts ***!
  \*********************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _unify_airtable__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./unify.airtable */ "./src/unify.airtable");
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
    console.log(hex);
    return result;
}
function hslToRGB(hsl) {
    var hslValues = hsl.substring(4).split(")")[0].split(",");
    let h = parseInt(hslValues[0]), s = parseInt(hslValues[1].substring(0, hslValues[1].length - 1)) / 100, l = parseInt(hslValues[2].substring(0, hslValues[2].length - 1)) / 100;
    let c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2, r = 0, g = 0, b = 0;
    if (0 <= h && h < 60) {
        r = c;
        g = x;
        b = 0;
    }
    else if (60 <= h && h < 120) {
        r = x;
        g = c;
        b = 0;
    }
    else if (120 <= h && h < 180) {
        r = 0;
        g = c;
        b = x;
    }
    else if (180 <= h && h < 240) {
        r = 0;
        g = x;
        b = c;
    }
    else if (240 <= h && h < 300) {
        r = x;
        g = 0;
        b = c;
    }
    else if (300 <= h && h < 360) {
        r = c;
        g = 0;
        b = x;
    }
    r = r + m;
    g = g + m;
    b = b + m;
    const result = {
        r: r,
        g: g,
        b: b
    };
    return result;
}
const isHex = (colorValue) => {
    return colorValue.includes('#');
};
const isHsl = (colorValue) => {
    return colorValue.includes('hsl');
};
if (_unify_airtable__WEBPACK_IMPORTED_MODULE_0__["default"]) {
    // Get existing styles from Figma
    const colors = figma.getLocalPaintStyles();
    const colorsArray = [];
    colors.map((paint) => colorsArray.push(paint.name));
    // TODO: Check if styles already exist and update them before adding duplicates
    // TODO: Check for which format the color is in (hex, rgb, rgba, hsl, hsla)
    const newStyles = [];
    _unify_airtable__WEBPACK_IMPORTED_MODULE_0__["default"].forEach((record) => {
        var colorRGB;
        // Check format of color and convert to RGB with a separate opacity value
        if (isHex(record.Value)) {
            colorRGB = hexToRGB(record.Value);
        }
        else if (isHsl(record.Value)) {
            colorRGB = hslToRGB(record.Value);
        }
        // Check if style already exists in Figma file
        if (colorsArray.includes(record.Name)) {
            // We need to overwrite the current style if it already exists 
            const existingStyle = colors.filter((paint) => {
                return paint.name == record.Name;
            });
            const existingStyleColor = existingStyle[0];
            const paint = {
                type: 'SOLID',
                visible: true,
                opacity: 1,
                blendMode: "NORMAL",
                color: colorRGB
            };
            existingStyleColor.paints = [paint];
        }
        else {
            const style = figma.createPaintStyle();
            style.name = record.Name;
            const paint = {
                type: 'SOLID',
                visible: true,
                opacity: 1,
                blendMode: "NORMAL",
                color: colorRGB
            };
            newStyles.push(paint);
            style.paints = newStyles;
        }
    });
}
// Make sure to close the plugin when you're done. Otherwise the plugin will
// keep running, which shows the cancel button at the bottom of the screen.
figma.closePlugin();

})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUFBLGlFQUFlLEVBQUUseUNBQXlDLEVBQUUsMkNBQTJDLEVBQUUsaURBQWlEOzs7Ozs7VUNBMUo7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTs7VUFFQTtVQUNBOztVQUVBO1VBQ0E7VUFDQTs7Ozs7V0N0QkE7V0FDQTtXQUNBO1dBQ0E7V0FDQSx5Q0FBeUMsd0NBQXdDO1dBQ2pGO1dBQ0E7V0FDQTs7Ozs7V0NQQTs7Ozs7V0NBQTtXQUNBO1dBQ0E7V0FDQSx1REFBdUQsaUJBQWlCO1dBQ3hFO1dBQ0EsZ0RBQWdELGFBQWE7V0FDN0Q7Ozs7Ozs7Ozs7OztBQ05BO0FBQ0E7QUFDQTtBQUN1QztBQUN2QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSx1REFBTztBQUNYO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSwrREFBZTtBQUNuQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vQWlydGFibGUvLi9zcmMvdW5pZnkuYWlydGFibGUiLCJ3ZWJwYWNrOi8vQWlydGFibGUvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vQWlydGFibGUvd2VicGFjay9ydW50aW1lL2RlZmluZSBwcm9wZXJ0eSBnZXR0ZXJzIiwid2VicGFjazovL0FpcnRhYmxlL3dlYnBhY2svcnVudGltZS9oYXNPd25Qcm9wZXJ0eSBzaG9ydGhhbmQiLCJ3ZWJwYWNrOi8vQWlydGFibGUvd2VicGFjay9ydW50aW1lL21ha2UgbmFtZXNwYWNlIG9iamVjdCIsIndlYnBhY2s6Ly9BaXJ0YWJsZS8uL3NyYy9jb2RlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBkZWZhdWx0IFt7XCJOYW1lXCI6XCJwcmltYXJ5X2NvbG9yXCIsXCJWYWx1ZVwiOlwiI2ZmZDkwMFwifSx7XCJOYW1lXCI6XCJzZWNvbmRhcnlfY29sb3JcIixcIlZhbHVlXCI6XCIjZWZlZmVmXCJ9LHtcIk5hbWVcIjpcImVycm9yX2NvbG9yXCIsXCJWYWx1ZVwiOlwiaHNsKDAsIDEwMCUsIDUwJSlcIn1dIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIi8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb25zIGZvciBoYXJtb255IGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uZCA9IChleHBvcnRzLCBkZWZpbml0aW9uKSA9PiB7XG5cdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG5cdFx0fVxuXHR9XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSkiLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCIvLyBUaGlzIGZpbGUgaG9sZHMgdGhlIG1haW4gY29kZSBmb3IgdGhlIHBsdWdpbnMuIEl0IGhhcyBhY2Nlc3MgdG8gdGhlICpkb2N1bWVudCouXG4vLyBZb3UgY2FuIGFjY2VzcyBicm93c2VyIEFQSXMgc3VjaCBhcyB0aGUgbmV0d29yayBieSBjcmVhdGluZyBhIFVJIHdoaWNoIGNvbnRhaW5zXG4vLyBhIGZ1bGwgYnJvd3NlciBlbnZpcm9ubWVudCAoc2VlIGRvY3VtZW50YXRpb24pLlxuaW1wb3J0IHJlY29yZHMgZnJvbSAnLi91bmlmeS5haXJ0YWJsZSc7XG5mdW5jdGlvbiBoZXhUb1JHQihoZXgpIHtcbiAgICBjb25zdCByID0gKHBhcnNlSW50KGhleC5zbGljZSgxLCAzKSwgMTYpIC8gMjU1KTtcbiAgICBjb25zdCBnID0gKHBhcnNlSW50KGhleC5zbGljZSgzLCA1KSwgMTYpIC8gMjU1KTtcbiAgICBjb25zdCBiID0gKHBhcnNlSW50KGhleC5zbGljZSg1LCA3KSwgMTYpIC8gMjU1KTtcbiAgICBjb25zdCByZXN1bHQgPSB7XG4gICAgICAgIHI6IHIsXG4gICAgICAgIGc6IGcsXG4gICAgICAgIGI6IGJcbiAgICB9O1xuICAgIGNvbnNvbGUubG9nKGhleCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cbmZ1bmN0aW9uIGhzbFRvUkdCKGhzbCkge1xuICAgIHZhciBoc2xWYWx1ZXMgPSBoc2wuc3Vic3RyaW5nKDQpLnNwbGl0KFwiKVwiKVswXS5zcGxpdChcIixcIik7XG4gICAgbGV0IGggPSBwYXJzZUludChoc2xWYWx1ZXNbMF0pLCBzID0gcGFyc2VJbnQoaHNsVmFsdWVzWzFdLnN1YnN0cmluZygwLCBoc2xWYWx1ZXNbMV0ubGVuZ3RoIC0gMSkpIC8gMTAwLCBsID0gcGFyc2VJbnQoaHNsVmFsdWVzWzJdLnN1YnN0cmluZygwLCBoc2xWYWx1ZXNbMl0ubGVuZ3RoIC0gMSkpIC8gMTAwO1xuICAgIGxldCBjID0gKDEgLSBNYXRoLmFicygyICogbCAtIDEpKSAqIHMsIHggPSBjICogKDEgLSBNYXRoLmFicygoaCAvIDYwKSAlIDIgLSAxKSksIG0gPSBsIC0gYyAvIDIsIHIgPSAwLCBnID0gMCwgYiA9IDA7XG4gICAgaWYgKDAgPD0gaCAmJiBoIDwgNjApIHtcbiAgICAgICAgciA9IGM7XG4gICAgICAgIGcgPSB4O1xuICAgICAgICBiID0gMDtcbiAgICB9XG4gICAgZWxzZSBpZiAoNjAgPD0gaCAmJiBoIDwgMTIwKSB7XG4gICAgICAgIHIgPSB4O1xuICAgICAgICBnID0gYztcbiAgICAgICAgYiA9IDA7XG4gICAgfVxuICAgIGVsc2UgaWYgKDEyMCA8PSBoICYmIGggPCAxODApIHtcbiAgICAgICAgciA9IDA7XG4gICAgICAgIGcgPSBjO1xuICAgICAgICBiID0geDtcbiAgICB9XG4gICAgZWxzZSBpZiAoMTgwIDw9IGggJiYgaCA8IDI0MCkge1xuICAgICAgICByID0gMDtcbiAgICAgICAgZyA9IHg7XG4gICAgICAgIGIgPSBjO1xuICAgIH1cbiAgICBlbHNlIGlmICgyNDAgPD0gaCAmJiBoIDwgMzAwKSB7XG4gICAgICAgIHIgPSB4O1xuICAgICAgICBnID0gMDtcbiAgICAgICAgYiA9IGM7XG4gICAgfVxuICAgIGVsc2UgaWYgKDMwMCA8PSBoICYmIGggPCAzNjApIHtcbiAgICAgICAgciA9IGM7XG4gICAgICAgIGcgPSAwO1xuICAgICAgICBiID0geDtcbiAgICB9XG4gICAgciA9IHIgKyBtO1xuICAgIGcgPSBnICsgbTtcbiAgICBiID0gYiArIG07XG4gICAgY29uc3QgcmVzdWx0ID0ge1xuICAgICAgICByOiByLFxuICAgICAgICBnOiBnLFxuICAgICAgICBiOiBiXG4gICAgfTtcbiAgICByZXR1cm4gcmVzdWx0O1xufVxuY29uc3QgaXNIZXggPSAoY29sb3JWYWx1ZSkgPT4ge1xuICAgIHJldHVybiBjb2xvclZhbHVlLmluY2x1ZGVzKCcjJyk7XG59O1xuY29uc3QgaXNIc2wgPSAoY29sb3JWYWx1ZSkgPT4ge1xuICAgIHJldHVybiBjb2xvclZhbHVlLmluY2x1ZGVzKCdoc2wnKTtcbn07XG5pZiAocmVjb3Jkcykge1xuICAgIC8vIEdldCBleGlzdGluZyBzdHlsZXMgZnJvbSBGaWdtYVxuICAgIGNvbnN0IGNvbG9ycyA9IGZpZ21hLmdldExvY2FsUGFpbnRTdHlsZXMoKTtcbiAgICBjb25zdCBjb2xvcnNBcnJheSA9IFtdO1xuICAgIGNvbG9ycy5tYXAoKHBhaW50KSA9PiBjb2xvcnNBcnJheS5wdXNoKHBhaW50Lm5hbWUpKTtcbiAgICAvLyBUT0RPOiBDaGVjayBpZiBzdHlsZXMgYWxyZWFkeSBleGlzdCBhbmQgdXBkYXRlIHRoZW0gYmVmb3JlIGFkZGluZyBkdXBsaWNhdGVzXG4gICAgLy8gVE9ETzogQ2hlY2sgZm9yIHdoaWNoIGZvcm1hdCB0aGUgY29sb3IgaXMgaW4gKGhleCwgcmdiLCByZ2JhLCBoc2wsIGhzbGEpXG4gICAgY29uc3QgbmV3U3R5bGVzID0gW107XG4gICAgcmVjb3Jkcy5mb3JFYWNoKChyZWNvcmQpID0+IHtcbiAgICAgICAgdmFyIGNvbG9yUkdCO1xuICAgICAgICAvLyBDaGVjayBmb3JtYXQgb2YgY29sb3IgYW5kIGNvbnZlcnQgdG8gUkdCIHdpdGggYSBzZXBhcmF0ZSBvcGFjaXR5IHZhbHVlXG4gICAgICAgIGlmIChpc0hleChyZWNvcmQuVmFsdWUpKSB7XG4gICAgICAgICAgICBjb2xvclJHQiA9IGhleFRvUkdCKHJlY29yZC5WYWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoaXNIc2wocmVjb3JkLlZhbHVlKSkge1xuICAgICAgICAgICAgY29sb3JSR0IgPSBoc2xUb1JHQihyZWNvcmQuVmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIC8vIENoZWNrIGlmIHN0eWxlIGFscmVhZHkgZXhpc3RzIGluIEZpZ21hIGZpbGVcbiAgICAgICAgaWYgKGNvbG9yc0FycmF5LmluY2x1ZGVzKHJlY29yZC5OYW1lKSkge1xuICAgICAgICAgICAgLy8gV2UgbmVlZCB0byBvdmVyd3JpdGUgdGhlIGN1cnJlbnQgc3R5bGUgaWYgaXQgYWxyZWFkeSBleGlzdHMgXG4gICAgICAgICAgICBjb25zdCBleGlzdGluZ1N0eWxlID0gY29sb3JzLmZpbHRlcigocGFpbnQpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFpbnQubmFtZSA9PSByZWNvcmQuTmFtZTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY29uc3QgZXhpc3RpbmdTdHlsZUNvbG9yID0gZXhpc3RpbmdTdHlsZVswXTtcbiAgICAgICAgICAgIGNvbnN0IHBhaW50ID0ge1xuICAgICAgICAgICAgICAgIHR5cGU6ICdTT0xJRCcsXG4gICAgICAgICAgICAgICAgdmlzaWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICBvcGFjaXR5OiAxLFxuICAgICAgICAgICAgICAgIGJsZW5kTW9kZTogXCJOT1JNQUxcIixcbiAgICAgICAgICAgICAgICBjb2xvcjogY29sb3JSR0JcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBleGlzdGluZ1N0eWxlQ29sb3IucGFpbnRzID0gW3BhaW50XTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IHN0eWxlID0gZmlnbWEuY3JlYXRlUGFpbnRTdHlsZSgpO1xuICAgICAgICAgICAgc3R5bGUubmFtZSA9IHJlY29yZC5OYW1lO1xuICAgICAgICAgICAgY29uc3QgcGFpbnQgPSB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ1NPTElEJyxcbiAgICAgICAgICAgICAgICB2aXNpYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgIG9wYWNpdHk6IDEsXG4gICAgICAgICAgICAgICAgYmxlbmRNb2RlOiBcIk5PUk1BTFwiLFxuICAgICAgICAgICAgICAgIGNvbG9yOiBjb2xvclJHQlxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIG5ld1N0eWxlcy5wdXNoKHBhaW50KTtcbiAgICAgICAgICAgIHN0eWxlLnBhaW50cyA9IG5ld1N0eWxlcztcbiAgICAgICAgfVxuICAgIH0pO1xufVxuLy8gTWFrZSBzdXJlIHRvIGNsb3NlIHRoZSBwbHVnaW4gd2hlbiB5b3UncmUgZG9uZS4gT3RoZXJ3aXNlIHRoZSBwbHVnaW4gd2lsbFxuLy8ga2VlcCBydW5uaW5nLCB3aGljaCBzaG93cyB0aGUgY2FuY2VsIGJ1dHRvbiBhdCB0aGUgYm90dG9tIG9mIHRoZSBzY3JlZW4uXG5maWdtYS5jbG9zZVBsdWdpbigpO1xuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9