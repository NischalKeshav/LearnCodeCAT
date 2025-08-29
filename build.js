#!/usr/bin/env node

/** 
 * LittleJS Build System
 */

'use strict';

const PROGRAM_TITLE = 'Little JS Starter Project';
const PROGRAM_NAME = 'game';
const BUILD_FOLDER = 'build';
const USE_ROADROLLER = true; // enable for extra compression
const sourceFiles =
[
    'game.js',
    // add your game's files here
];
const dataFiles =
[
    // no data files needed for minimal version
];

console.log(`Building ${PROGRAM_NAME}...`);
const startTime = Date.now();
const fs = require('node:fs');
const child_process = require('node:child_process');

// rebuild engine
//child_process.execSync(`npm run build`, { stdio: 'inherit' });

// remove old files and setup build folder
fs.rmSync(BUILD_FOLDER, { recursive: true, force: true });
fs.rmSync(`${PROGRAM_NAME}.zip`, { force: true });
fs.mkdirSync(BUILD_FOLDER);

// copy data files
for(const file of dataFiles)
    fs.copyFileSync(file, `${BUILD_FOLDER}/${file}`);

Build
(
    `${BUILD_FOLDER}/index.js`,
    sourceFiles,
    USE_ROADROLLER ? 
        [closureCompilerStep, uglifyBuildStep, roadrollerBuildStep, htmlBuildStep, zipBuildStep] :
        [closureCompilerStep, uglifyBuildStep, htmlBuildStep, zipBuildStep]
);

console.log('');
console.log(`Build Completed in ${((Date.now() - startTime)/1e3).toFixed(2)} seconds!`);
console.log(`Size of ${PROGRAM_NAME}.zip: ${fs.statSync(`${PROGRAM_NAME}.zip`).size} bytes`);

///////////////////////////////////////////////////////////////////////////////

// A single build with its own source files, build steps, and output file
// - each build step is a callback that accepts a single filename
function Build(outputFile, files=[], buildSteps=[])
{
    // copy files into a buffer
    let buffer = '';
    for (const file of files)
        buffer += fs.readFileSync(file) + '\n';

    // output file
    fs.writeFileSync(outputFile, buffer, {flag: 'w+'});

    // execute build steps in order
    for (const buildStep of buildSteps)
        buildStep(outputFile);
}

function closureCompilerStep(filename)
{
    console.log(`Running closure compiler...`);

    // use closer compiler to minify the code
    const filenameTemp = filename + '.tmp';
    fs.copyFileSync(filename, filenameTemp);
    child_process.execSync(`npx google-closure-compiler --js=${filenameTemp} --js_output_file=${filename} --compilation_level=ADVANCED --warning_level=VERBOSE --jscomp_off=* --assume_function_wrapper`, {stdio: 'inherit'});
    fs.rmSync(filenameTemp);
};

function uglifyBuildStep(filename)
{
    console.log(`Running uglify...`);
    child_process.execSync(`npx uglifyjs ${filename} -c -m -o ${filename}`, {stdio: 'inherit'});
};

function roadrollerBuildStep(filename)
{
    console.log(`Running roadroller...`);
    child_process.execSync(`npx roadroller ${filename} -o ${filename}`, {stdio: 'inherit'});
};

function htmlBuildStep(filename)
{
    console.log(`Building html...`);

    // create html file with canvas
    let buffer = '<!DOCTYPE html>';
    buffer += '<head>';
    buffer += `<title>${PROGRAM_TITLE}</title>`;
    buffer += '<style>body{margin:0;padding:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#111;font-family:Arial}canvas{border:2px solid #444;background:#222}</style>';
    buffer += '</head>';
    buffer += '<body>';
    buffer += '<canvas id="gameCanvas"></canvas>';
    buffer += '<script>';
    buffer += fs.readFileSync(filename) + '\n';
    buffer += '</script>';
    buffer += '</body>';

    // output html file
    fs.writeFileSync(`${BUILD_FOLDER}/index.html`, buffer, {flag: 'w+'});
};

function zipBuildStep(filename)
{
    console.log(`Zipping...`);
    
    // zip the build folder using standard zip command
    const args = ['-r', `../${PROGRAM_NAME}.zip`, 'index.html', ...dataFiles];
    child_process.spawnSync('zip', args, {stdio: 'inherit', cwd: BUILD_FOLDER});
};