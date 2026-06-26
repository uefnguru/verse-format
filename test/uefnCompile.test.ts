import fs from "node:fs";
import http from "node:http";
import path from "node:path";

import { describe, expect, it, type TestContext } from "vitest";

import { formatVerseDocument } from "../src/formatter";
import type { FormatterOptions, VerseBlockStyle, VerseSpacingStyle } from "../src/formatter";

const FIXTURE_ROOT = path.join(__dirname, "verse-fixtures");
const LISTENER_PORTS = [8785, 8786, 8787, 8788, 8789, 8790, 8791];
const COMPILE_TIMEOUT_SECONDS = 240;
const COMPILE_HTTP_TIMEOUT_MS = 250_000;
const REQUEST_TIMEOUT_MS = 30_000;
const TEST_TIMEOUT_MS = 600_000;
const SHOULD_RUN_UEFN_TEST =
    process.env.VERSE_FORMATTER_RUN_UEFN === "1" || process.env.npm_lifecycle_event === "test:uefn";
const STYLE_COMBINATIONS: StyleCombination[] = [
    { blockStyle: "braced", name: "braced-wide", spacingStyle: "wide" },
    { blockStyle: "colon", name: "colon-wide", spacingStyle: "wide" },
    { blockStyle: "braced", name: "braced-dense", spacingStyle: "dense" },
    { blockStyle: "colon", name: "colon-dense", spacingStyle: "dense" }
];

const describeUefn = SHOULD_RUN_UEFN_TEST ? describe : describe.skip;

describeUefn("UEFN compile fixtures", () => {
    it(
        "deploys formatted Verse fixture outputs and compiles both block styles",
        async (context) => {
            const listener = await discoverListener();
            const fixtureFiles = loadGeneratedFixtureFiles();

            for (const combination of STYLE_COMBINATIONS) {
                await compileFiles(
                    context,
                    listener.port,
                    combination.name,
                    fixtureFiles[combination.name]
                );
            }
        },
        TEST_TIMEOUT_MS
    );
});

interface BridgePing {
    ok: boolean;
    kind?: string;
    port: number;
    contentRoot?: string;
    testRoot?: string;
}

interface FixtureFiles {
    [styleName: string]: BridgeFile[];
}

interface StyleCombination {
    blockStyle: VerseBlockStyle;
    name: `${VerseBlockStyle}-${VerseSpacingStyle}`;
    spacingStyle: VerseSpacingStyle;
}

interface BridgeFile {
    path: string;
    content: string;
}

async function discoverListener(): Promise<BridgePing> {
    const results = await Promise.all(
        LISTENER_PORTS.map(async (port) => {
            try {
                return await getBridge(port);
            } catch {
                return null;
            }
        })
    );
    const listener = results.find((result): result is BridgePing =>
        Boolean(result?.ok && result.kind === "verse_formatter_test_listener")
    );

    if (!listener) {
        throw new Error(
            `No Verse formatter test listener found on ports ${LISTENER_PORTS.join(
                ", "
            )}. Run "pnpm run uefn:install-test-bridge -- <project-folder-or-.uefnproject>", then reopen the project in UEFN.`
        );
    }

    return listener;
}

function loadGeneratedFixtureFiles(): FixtureFiles {
    const filesByStyle = Object.fromEntries(
        STYLE_COMBINATIONS.map((combination) => [combination.name, [] as BridgeFile[]])
    ) as FixtureFiles;

    for (const fixtureName of fs.readdirSync(FIXTURE_ROOT)) {
        const fixturePath = path.join(FIXTURE_ROOT, fixtureName);
        if (!fs.statSync(fixturePath).isDirectory()) {
            continue;
        }

        for (const source of loadFixtureSources(fixtureName, fixturePath)) {
            const original = fs.readFileSync(source.path, "utf8");
            for (const combination of STYLE_COMBINATIONS) {
                filesByStyle[combination.name].push({
                    content: formatVerseDocument(original, formatOptions(combination)),
                    path: source.outputPath
                });
            }
        }
    }

    return filesByStyle;
}

interface FixtureSource {
    path: string;
    outputPath: string;
}

function loadFixtureSources(fixtureName: string, fixturePath: string): FixtureSource[] {
    const singleOriginal = path.join(fixturePath, "original.verse");
    if (fs.existsSync(singleOriginal)) {
        return [
            {
                path: singleOriginal,
                outputPath: `${fixtureName}.verse`
            }
        ];
    }

    const originalRoot = path.join(fixturePath, "original");
    return collectVerseFiles(originalRoot).map((sourcePath) => {
        const relativePath = path.relative(originalRoot, sourcePath).replace(/\\/g, "/");
        return {
            path: sourcePath,
            outputPath: `${fixtureName}/${relativePath}`
        };
    });
}

function collectVerseFiles(directory: string): string[] {
    const files: string[] = [];

    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const entryPath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            files.push(...collectVerseFiles(entryPath));
        } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".verse")) {
            files.push(entryPath);
        }
    }

    return files.sort();
}

function formatOptions(combination: StyleCombination): FormatterOptions {
    return {
        blockStyle: combination.blockStyle,
        spacingStyle: combination.spacingStyle
    };
}

async function compileFiles(
    context: TestContext,
    port: number,
    styleName: string,
    files: BridgeFile[]
): Promise<void> {
    const compileResult = await compileWithRetry(port, files);
    await reportCompileResult(context, styleName, compileResult);
    expect(compileResult.ok, describeCompileFailure(styleName, compileResult)).toBe(true);
    expect(compileResult.numErrors, describeCompileFailure(styleName, compileResult)).toBe(0);
}

async function compileWithRetry(
    port: number,
    files: BridgeFile[]
): Promise<Record<string, unknown>> {
    let lastResult: Record<string, unknown> | null = null;

    for (let attempt = 1; attempt <= 5; attempt += 1) {
        lastResult = await callBridge(
            port,
            "compile_verse_files",
            { files, timeout: COMPILE_TIMEOUT_SECONDS },
            COMPILE_HTTP_TIMEOUT_MS
        );
        if (lastResult.ok || !String(lastResult.warning ?? "").includes("UEFN process is busy")) {
            return lastResult;
        }
        await delay(2_000);
    }

    return lastResult ?? { ok: false, error: "compile_verse did not return a result" };
}

async function delay(milliseconds: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function describeCompileFailure(styleName: string, payload: unknown): string {
    return `UEFN Verse compile failed for ${styleName} output:\n${JSON.stringify(payload, null, 2)}`;
}

async function reportCompileResult(
    context: TestContext,
    styleName: string,
    payload: Record<string, unknown>
): Promise<void> {
    const written = Array.isArray(payload.written) ? payload.written.length : 0;
    const message = String(payload.message ?? payload.warning ?? payload.error ?? "").trim();
    const lines = [
        `[UEFN:${styleName}] ok=${String(payload.ok)} warnings=${String(
            payload.numWarnings ?? "unknown"
        )} errors=${String(payload.numErrors ?? "unknown")} files=${written}`,
        ...message
            .split(/\r?\n/)
            .filter(Boolean)
            .map((line) => `[UEFN:${styleName}] ${line}`)
    ];
    const output = lines.join("\n");

    for (const line of lines) {
        console.log(line);
    }
    process.stdout.write(`${output}\n`);

    try {
        await context.annotate(`UEFN ${styleName} compile output`, "notice", {
            body: output,
            bodyEncoding: "utf-8",
            contentType: "text/plain"
        });
    } catch (error) {
        console.warn(
            `[UEFN:${styleName}] Vitest annotation unavailable: ${
                error instanceof Error ? error.message : String(error)
            }`
        );
    }
}

async function getBridge(port: number): Promise<BridgePing> {
    return requestJson("GET", port, "/");
}

async function callBridge(
    port: number,
    command: string,
    params: Record<string, unknown> = {},
    timeoutMs = REQUEST_TIMEOUT_MS
): Promise<Record<string, unknown>> {
    return requestJson("POST", port, "/", { command, params }, timeoutMs);
}

async function requestJson<T>(
    method: "GET" | "POST",
    port: number,
    pathName: string,
    body?: unknown,
    timeoutMs = 1_000
): Promise<T> {
    const payload = body === undefined ? undefined : Buffer.from(JSON.stringify(body));

    return new Promise<T>((resolve, reject) => {
        const request = http.request(
            {
                headers: payload
                    ? {
                          "Content-Length": String(payload.byteLength),
                          "Content-Type": "application/json"
                      }
                    : undefined,
                hostname: "127.0.0.1",
                method,
                path: pathName,
                port,
                timeout: timeoutMs
            },
            (response) => {
                const chunks: Buffer[] = [];
                response.on("data", (chunk: Buffer) => chunks.push(chunk));
                response.on("end", () => {
                    const text = Buffer.concat(chunks).toString("utf8");
                    if (!response.statusCode || response.statusCode >= 400) {
                        reject(new Error(`HTTP ${response.statusCode}: ${text}`));
                        return;
                    }
                    try {
                        resolve(JSON.parse(text) as T);
                    } catch (error) {
                        reject(error);
                    }
                });
            }
        );

        request.on("error", reject);
        request.on("timeout", () => {
            request.destroy(new Error(`Request to port ${port} timed out`));
        });
        if (payload) {
            request.write(payload);
        }
        request.end();
    });
}
