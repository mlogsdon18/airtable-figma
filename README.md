Below are the steps to get your plugin running. You can also find instructions at:

  https://www.figma.com/plugin-docs/setup/

This plugin template uses Typescript and NPM, two standard tools in creating JavaScript applications.

Using TypeScript requires a compiler to convert TypeScript (code.ts) into JavaScript (code.js)
for the browser to run.

We recommend writing TypeScript code using Visual Studio code:

Compile TypeScript to JavaScript: Run the "Terminal > Run Build Task..." menu item,
then select "tsc: watch - tsconfig.json". You will have to do this again every time
you reopen Visual Studio Code.

That's it! Visual Studio Code will regenerate the JavaScript file every time you save.

## Additional Helpful Links

- Figma Plugin Documentation: https://www.figma.com/plugin-docs/setup/
- Airtable API Documentation: https://airtable.com/appblz15LnTqipptS/api/docs#javascript/introduction
- Discussion Board on connecting to Airtable API: https://community.airtable.com/t/help-connecting-to-airtable-api-to-make-a-basic-console-log-output/33730/4
- Creating a Figma Style progammatically: https://forum.figma.com/t/dynamically-create-palette-with-createpaintstyle-locked-on-hextorgba-javascipt-function/5367

## Log
- Initially imported Airtable from node modules to run code, but I got a "process not defined" error SO
- I switched to use the airtable.browser.js version, but Figma was not happy with "import" or "require" from separate files since it only wants a single JS file, SO
- I followed the Figma documentation to add Webpack to the project to compile Airtable and my Typescript code into a single file, but Figma did not like the way Airtable was being added and was giving me a "not a constructor" error for creating a new Airtable, SO
- We tried creating a vanilla.js file and embedded the airtable.browser.js inside rather than importing. This fixed the constructor error but broke all of the imports inside the airtable.browser.js code, SO 
- 
