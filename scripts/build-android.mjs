#!/usr/bin/env node
/**
 * Local Android release builds (phone and TV).
 *
 * Native (CMake/NDK) compilation dominates the build, so by default we only
 * build the ABIs that ship on real devices — x86/x86_64 exist for emulators.
 *
 * A full `--clean` prebuild costs ~27 min because it discards every native build
 * output. We only clean when switching between the phone and TV targets, since
 * that is the one case where stale native config would produce a wrong APK.
 *
 * Usage:
 *   node scripts/build-android.mjs [--tv] [--js-only] [--clean] [--all-abis] [--abi=a,b] [--lint]
 */

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const androidDir = join(root, 'android');
const targetMarker = join(androidDir, '.build-target');

const argv = process.argv.slice(2);
const hasFlag = (name) => argv.includes(`--${name}`);
const flagValue = (name) => {
  const match = argv.find((arg) => arg.startsWith(`--${name}=`));
  return match ? match.slice(name.length + 3) : null;
};

const isTV = hasFlag('tv');
const jsOnly = hasFlag('js-only');
const forceClean = hasFlag('clean');
const runLint = hasFlag('lint');
const target = isTV ? 'tv' : 'phone';
const abis = hasFlag('all-abis')
  ? 'armeabi-v7a,arm64-v8a,x86,x86_64'
  : flagValue('abi') ?? 'arm64-v8a,armeabi-v7a';

const outputName = isTV
  ? 'stu-laurie-streaming-androidtv-release.apk'
  : 'stu-laurie-streaming-release.apk';

function loadDotEnv() {
  const envFile = join(root, '.env');
  if (!existsSync(envFile)) {
    return;
  }
  for (const line of readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, '');
    }
  }
}

function buildEnv() {
  const env = { ...process.env };
  if (isTV) {
    env.EXPO_TV = '1';
  } else {
    // The config-tv plugin reads presence, not value — an empty string still enables TV.
    delete env.EXPO_TV;
  }
  return env;
}

function run(command, args, cwd = root) {
  const label = [command, ...args].join(' ');
  console.log(`\n> ${label}\n`);
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: true,
    env: buildEnv(),
  });
  if (result.status !== 0) {
    console.error(`\nFailed: ${label}`);
    process.exit(result.status ?? 1);
  }
}

loadDotEnv();

if (!process.env.EXPO_PUBLIC_API_URL) {
  console.error(
    'EXPO_PUBLIC_API_URL is not set and no .env was found.\n' +
      'The APK would ship without a backend URL. Copy .env.example to .env first.',
  );
  process.exit(1);
}

const currentTarget = existsSync(targetMarker)
  ? readFileSync(targetMarker, 'utf8').trim()
  : null;
const matchesTarget = currentTarget === target;

if (jsOnly) {
  if (!matchesTarget) {
    console.error(
      `Cannot reuse android/ — it was generated for "${currentTarget ?? 'unknown'}" ` +
        `but you asked for "${target}". Run the full build once.`,
    );
    process.exit(1);
  }
  console.log(`Reusing existing android/ (${target}) — skipping prebuild.`);
} else {
  const clean = forceClean || !matchesTarget;
  const args = ['expo', 'prebuild', '--platform', 'android'];
  if (clean) {
    args.push('--clean');
    console.log(
      currentTarget && !matchesTarget
        ? `Switching ${currentTarget} -> ${target}: native code must be regenerated.`
        : 'Clean prebuild.',
    );
  } else {
    console.log(`Reusing native build outputs for ${target}.`);
  }
  run('npx', args);
  writeFileSync(targetMarker, target);
}

const gradlew = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
const startedAt = Date.now();

const gradleArgs = [
  'assembleRelease',
  `-PreactNativeArchitectures=${abis}`,
  '--build-cache',
];
if (!runLint) {
  // Lint on release adds minutes and reports nothing we act on for test APKs.
  gradleArgs.push('-x', 'lintVitalRelease', '-x', 'lintVitalAnalyzeRelease');
}

run(gradlew, gradleArgs, androidDir);

const apk = join(androidDir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
if (!existsSync(apk)) {
  console.error(`APK not found at ${apk}`);
  process.exit(1);
}

mkdirSync(join(root, 'dist'), { recursive: true });
const destination = join(root, 'dist', outputName);
copyFileSync(apk, destination);

const minutes = ((Date.now() - startedAt) / 60000).toFixed(1);
console.log(`\nAPK ready: dist/${outputName}`);
console.log(`ABIs: ${abis} · Gradle took ${minutes} min`);
