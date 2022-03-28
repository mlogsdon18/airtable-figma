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
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ([{"Name":"primary_color","Value":"#0000FF"},{"Name":"secondary_color","Value":"#efefef"},{"Name":"error_color","Value":"#FF0000"}]);

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
    return result;
}
function hslToRGB(hsl) {
    var hslValues = hsl.substring(4).split(")")[0].split(", ");
    let h = parseInt(hsl[0]), s = parseInt(hsl[1].substring(0, hsl[1].length - 1)) / 100, l = parseInt(hsl[2].substring(0, hsl[2].length - 1)) / 100;
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
    console.log(result);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUFBLGlFQUFlLEVBQUUseUNBQXlDLEVBQUUsMkNBQTJDLEVBQUUsdUNBQXVDOzs7Ozs7VUNBaEo7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTs7VUFFQTtVQUNBOztVQUVBO1VBQ0E7VUFDQTs7Ozs7V0N0QkE7V0FDQTtXQUNBO1dBQ0E7V0FDQSx5Q0FBeUMsd0NBQXdDO1dBQ2pGO1dBQ0E7V0FDQTs7Ozs7V0NQQTs7Ozs7V0NBQTtXQUNBO1dBQ0E7V0FDQSx1REFBdUQsaUJBQWlCO1dBQ3hFO1dBQ0EsZ0RBQWdELGFBQWE7V0FDN0Q7Ozs7Ozs7Ozs7OztBQ05BO0FBQ0E7QUFDQTtBQUN1QztBQUN2QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSx1REFBTztBQUNYO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSwrREFBZTtBQUNuQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXMiOlsid2VicGFjazovL0FpcnRhYmxlLy4vc3JjL3VuaWZ5LmFpcnRhYmxlIiwid2VicGFjazovL0FpcnRhYmxlL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL0FpcnRhYmxlL3dlYnBhY2svcnVudGltZS9kZWZpbmUgcHJvcGVydHkgZ2V0dGVycyIsIndlYnBhY2s6Ly9BaXJ0YWJsZS93ZWJwYWNrL3J1bnRpbWUvaGFzT3duUHJvcGVydHkgc2hvcnRoYW5kIiwid2VicGFjazovL0FpcnRhYmxlL3dlYnBhY2svcnVudGltZS9tYWtlIG5hbWVzcGFjZSBvYmplY3QiLCJ3ZWJwYWNrOi8vQWlydGFibGUvLi9zcmMvY29kZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgZGVmYXVsdCBbe1wiTmFtZVwiOlwicHJpbWFyeV9jb2xvclwiLFwiVmFsdWVcIjpcIiMwMDAwRkZcIn0se1wiTmFtZVwiOlwic2Vjb25kYXJ5X2NvbG9yXCIsXCJWYWx1ZVwiOlwiI2VmZWZlZlwifSx7XCJOYW1lXCI6XCJlcnJvcl9jb2xvclwiLFwiVmFsdWVcIjpcIiNGRjAwMDBcIn1dIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIi8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb25zIGZvciBoYXJtb255IGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uZCA9IChleHBvcnRzLCBkZWZpbml0aW9uKSA9PiB7XG5cdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG5cdFx0fVxuXHR9XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSkiLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCIvLyBUaGlzIGZpbGUgaG9sZHMgdGhlIG1haW4gY29kZSBmb3IgdGhlIHBsdWdpbnMuIEl0IGhhcyBhY2Nlc3MgdG8gdGhlICpkb2N1bWVudCouXG4vLyBZb3UgY2FuIGFjY2VzcyBicm93c2VyIEFQSXMgc3VjaCBhcyB0aGUgbmV0d29yayBieSBjcmVhdGluZyBhIFVJIHdoaWNoIGNvbnRhaW5zXG4vLyBhIGZ1bGwgYnJvd3NlciBlbnZpcm9ubWVudCAoc2VlIGRvY3VtZW50YXRpb24pLlxuaW1wb3J0IHJlY29yZHMgZnJvbSAnLi91bmlmeS5haXJ0YWJsZSc7XG5mdW5jdGlvbiBoZXhUb1JHQihoZXgpIHtcbiAgICBjb25zdCByID0gKHBhcnNlSW50KGhleC5zbGljZSgxLCAzKSwgMTYpIC8gMjU1KTtcbiAgICBjb25zdCBnID0gKHBhcnNlSW50KGhleC5zbGljZSgzLCA1KSwgMTYpIC8gMjU1KTtcbiAgICBjb25zdCBiID0gKHBhcnNlSW50KGhleC5zbGljZSg1LCA3KSwgMTYpIC8gMjU1KTtcbiAgICBjb25zdCByZXN1bHQgPSB7XG4gICAgICAgIHI6IHIsXG4gICAgICAgIGc6IGcsXG4gICAgICAgIGI6IGJcbiAgICB9O1xuICAgIHJldHVybiByZXN1bHQ7XG59XG5mdW5jdGlvbiBoc2xUb1JHQihoc2wpIHtcbiAgICB2YXIgaHNsVmFsdWVzID0gaHNsLnN1YnN0cmluZyg0KS5zcGxpdChcIilcIilbMF0uc3BsaXQoXCIsIFwiKTtcbiAgICBsZXQgaCA9IHBhcnNlSW50KGhzbFswXSksIHMgPSBwYXJzZUludChoc2xbMV0uc3Vic3RyaW5nKDAsIGhzbFsxXS5sZW5ndGggLSAxKSkgLyAxMDAsIGwgPSBwYXJzZUludChoc2xbMl0uc3Vic3RyaW5nKDAsIGhzbFsyXS5sZW5ndGggLSAxKSkgLyAxMDA7XG4gICAgbGV0IGMgPSAoMSAtIE1hdGguYWJzKDIgKiBsIC0gMSkpICogcywgeCA9IGMgKiAoMSAtIE1hdGguYWJzKChoIC8gNjApICUgMiAtIDEpKSwgbSA9IGwgLSBjIC8gMiwgciA9IDAsIGcgPSAwLCBiID0gMDtcbiAgICBpZiAoMCA8PSBoICYmIGggPCA2MCkge1xuICAgICAgICByID0gYztcbiAgICAgICAgZyA9IHg7XG4gICAgICAgIGIgPSAwO1xuICAgIH1cbiAgICBlbHNlIGlmICg2MCA8PSBoICYmIGggPCAxMjApIHtcbiAgICAgICAgciA9IHg7XG4gICAgICAgIGcgPSBjO1xuICAgICAgICBiID0gMDtcbiAgICB9XG4gICAgZWxzZSBpZiAoMTIwIDw9IGggJiYgaCA8IDE4MCkge1xuICAgICAgICByID0gMDtcbiAgICAgICAgZyA9IGM7XG4gICAgICAgIGIgPSB4O1xuICAgIH1cbiAgICBlbHNlIGlmICgxODAgPD0gaCAmJiBoIDwgMjQwKSB7XG4gICAgICAgIHIgPSAwO1xuICAgICAgICBnID0geDtcbiAgICAgICAgYiA9IGM7XG4gICAgfVxuICAgIGVsc2UgaWYgKDI0MCA8PSBoICYmIGggPCAzMDApIHtcbiAgICAgICAgciA9IHg7XG4gICAgICAgIGcgPSAwO1xuICAgICAgICBiID0gYztcbiAgICB9XG4gICAgZWxzZSBpZiAoMzAwIDw9IGggJiYgaCA8IDM2MCkge1xuICAgICAgICByID0gYztcbiAgICAgICAgZyA9IDA7XG4gICAgICAgIGIgPSB4O1xuICAgIH1cbiAgICByID0gciArIG07XG4gICAgZyA9IGcgKyBtO1xuICAgIGIgPSBiICsgbTtcbiAgICBjb25zdCByZXN1bHQgPSB7XG4gICAgICAgIHI6IHIsXG4gICAgICAgIGc6IGcsXG4gICAgICAgIGI6IGJcbiAgICB9O1xuICAgIGNvbnNvbGUubG9nKHJlc3VsdCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cbmNvbnN0IGlzSGV4ID0gKGNvbG9yVmFsdWUpID0+IHtcbiAgICByZXR1cm4gY29sb3JWYWx1ZS5pbmNsdWRlcygnIycpO1xufTtcbmNvbnN0IGlzSHNsID0gKGNvbG9yVmFsdWUpID0+IHtcbiAgICByZXR1cm4gY29sb3JWYWx1ZS5pbmNsdWRlcygnaHNsJyk7XG59O1xuaWYgKHJlY29yZHMpIHtcbiAgICAvLyBHZXQgZXhpc3Rpbmcgc3R5bGVzIGZyb20gRmlnbWFcbiAgICBjb25zdCBjb2xvcnMgPSBmaWdtYS5nZXRMb2NhbFBhaW50U3R5bGVzKCk7XG4gICAgY29uc3QgY29sb3JzQXJyYXkgPSBbXTtcbiAgICBjb2xvcnMubWFwKChwYWludCkgPT4gY29sb3JzQXJyYXkucHVzaChwYWludC5uYW1lKSk7XG4gICAgLy8gVE9ETzogQ2hlY2sgaWYgc3R5bGVzIGFscmVhZHkgZXhpc3QgYW5kIHVwZGF0ZSB0aGVtIGJlZm9yZSBhZGRpbmcgZHVwbGljYXRlc1xuICAgIC8vIFRPRE86IENoZWNrIGZvciB3aGljaCBmb3JtYXQgdGhlIGNvbG9yIGlzIGluIChoZXgsIHJnYiwgcmdiYSwgaHNsLCBoc2xhKVxuICAgIGNvbnN0IG5ld1N0eWxlcyA9IFtdO1xuICAgIHJlY29yZHMuZm9yRWFjaCgocmVjb3JkKSA9PiB7XG4gICAgICAgIHZhciBjb2xvclJHQjtcbiAgICAgICAgLy8gQ2hlY2sgZm9ybWF0IG9mIGNvbG9yIGFuZCBjb252ZXJ0IHRvIFJHQiB3aXRoIGEgc2VwYXJhdGUgb3BhY2l0eSB2YWx1ZVxuICAgICAgICBpZiAoaXNIZXgocmVjb3JkLlZhbHVlKSkge1xuICAgICAgICAgICAgY29sb3JSR0IgPSBoZXhUb1JHQihyZWNvcmQuVmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGlzSHNsKHJlY29yZC5WYWx1ZSkpIHtcbiAgICAgICAgICAgIGNvbG9yUkdCID0gaHNsVG9SR0IocmVjb3JkLlZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBDaGVjayBpZiBzdHlsZSBhbHJlYWR5IGV4aXN0cyBpbiBGaWdtYSBmaWxlXG4gICAgICAgIGlmIChjb2xvcnNBcnJheS5pbmNsdWRlcyhyZWNvcmQuTmFtZSkpIHtcbiAgICAgICAgICAgIC8vIFdlIG5lZWQgdG8gb3ZlcndyaXRlIHRoZSBjdXJyZW50IHN0eWxlIGlmIGl0IGFscmVhZHkgZXhpc3RzIFxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY29uc3Qgc3R5bGUgPSBmaWdtYS5jcmVhdGVQYWludFN0eWxlKCk7XG4gICAgICAgICAgICBzdHlsZS5uYW1lID0gcmVjb3JkLk5hbWU7XG4gICAgICAgICAgICBjb25zdCBwYWludCA9IHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnU09MSUQnLFxuICAgICAgICAgICAgICAgIHZpc2libGU6IHRydWUsXG4gICAgICAgICAgICAgICAgb3BhY2l0eTogMSxcbiAgICAgICAgICAgICAgICBibGVuZE1vZGU6IFwiTk9STUFMXCIsXG4gICAgICAgICAgICAgICAgY29sb3I6IGNvbG9yUkdCXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgbmV3U3R5bGVzLnB1c2gocGFpbnQpO1xuICAgICAgICAgICAgc3R5bGUucGFpbnRzID0gbmV3U3R5bGVzO1xuICAgICAgICB9XG4gICAgfSk7XG59XG4vLyBNYWtlIHN1cmUgdG8gY2xvc2UgdGhlIHBsdWdpbiB3aGVuIHlvdSdyZSBkb25lLiBPdGhlcndpc2UgdGhlIHBsdWdpbiB3aWxsXG4vLyBrZWVwIHJ1bm5pbmcsIHdoaWNoIHNob3dzIHRoZSBjYW5jZWwgYnV0dG9uIGF0IHRoZSBib3R0b20gb2YgdGhlIHNjcmVlbi5cbmZpZ21hLmNsb3NlUGx1Z2luKCk7XG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=