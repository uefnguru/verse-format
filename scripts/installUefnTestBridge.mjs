#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const templateRoot = path.join(repoRoot, "templates", "uefn-test-bridge");

const projectArg = process.argv[2];
if (!projectArg) {
    console.error("Usage: pnpm run uefn:install-test-bridge -- <project-folder-or-.uefnproject>");
    process.exit(1);
}

const projectFile = resolveProjectFile(projectArg);
const projectRoot = path.dirname(projectFile);
const contentPythonRoot = path.join(projectRoot, "Content", "Python");

enablePython(projectFile);
installBridgeFiles(contentPythonRoot);
updateLoreIgnore(path.join(projectRoot, ".loreignore"));

const project = JSON.parse(fs.readFileSync(projectFile, "utf8"));
console.log("Installed Verse formatter test bridge.");
console.log(`Project: ${project.title ?? path.basename(projectRoot)}`);
console.log(`Project file: ${projectFile}`);
console.log(`Python folder: ${contentPythonRoot}`);
console.log(
    "Restart or reload this UEFN project so Content/Python/init_unreal.py starts the listener."
);

function resolveProjectFile(input) {
    const resolved = path.resolve(input);
    if (!fs.existsSync(resolved)) {
        throw new Error(`Project path does not exist: ${resolved}`);
    }

    const stat = fs.statSync(resolved);
    if (stat.isFile()) {
        if (path.extname(resolved).toLowerCase() !== ".uefnproject") {
            throw new Error(`Expected a .uefnproject file: ${resolved}`);
        }
        return resolved;
    }

    if (!stat.isDirectory()) {
        throw new Error(`Expected a directory or .uefnproject file: ${resolved}`);
    }

    const projectFiles = fs
        .readdirSync(resolved)
        .filter((entry) => entry.toLowerCase().endsWith(".uefnproject"))
        .map((entry) => path.join(resolved, entry));

    if (projectFiles.length !== 1) {
        throw new Error(
            `Expected exactly one .uefnproject in ${resolved}, found ${projectFiles.length}`
        );
    }

    return projectFiles[0];
}

function enablePython(projectFilePath) {
    const project = JSON.parse(fs.readFileSync(projectFilePath, "utf8"));
    project.dataSets ??= {};
    project.dataSets.experimental ??= {};
    project.dataSets.experimental.pythonExperimental ??= {};
    project.dataSets.experimental.pythonExperimental.bEnablePythonForProject = true;

    fs.writeFileSync(projectFilePath, `${JSON.stringify(project, null, "\t")}\n`);
}

function installBridgeFiles(destinationRoot) {
    fs.mkdirSync(destinationRoot, { recursive: true });

    for (const fileName of ["init_unreal.py", "verse_formatter_test_listener.py"]) {
        fs.copyFileSync(path.join(templateRoot, fileName), path.join(destinationRoot, fileName));
    }
}

function updateLoreIgnore(loreIgnorePath) {
    const requiredPatterns = [
        "**/__pycache__",
        "**/__pycache__/**",
        "**/*.pyc",
        "**/*.pyo",
        "**/*.pyd"
    ];
    const current = fs.existsSync(loreIgnorePath) ? fs.readFileSync(loreIgnorePath, "utf8") : "";
    const lines = current.split(/\r?\n/);
    const missing = requiredPatterns.filter((pattern) => !lines.includes(pattern));

    if (missing.length === 0) {
        return;
    }

    const prefix = current.trimEnd().length > 0 ? `${current.trimEnd()}\n` : "";
    fs.writeFileSync(loreIgnorePath, `${prefix}${missing.join("\n")}\n`);
}
