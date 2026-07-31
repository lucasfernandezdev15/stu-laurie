#!/usr/bin/env node
/**
 * Local Android release builds (phone and TV).
 *
 * `expo prebuild` always wipes android/ (the folder is gitignored, so Expo
 * treats it as disposable), which throws away ~27 min of C++/Kotlin output.
 * The only cheap path is to not run prebuild at all, so we keep one native
 * directory per target under .native-cache/ and swap them when switching.
 *
 * Prebuild is only required when the native config actually changes: app.json,
 * config plugins, native dependencies, or an Expo upgrade. Pass --clean then.
 *
 * Usage:
 *   node scripts/build-android.mjs [--tv] [--clean] [--all-abis] [--abi=a,b] [--lint]
 */

import { spawnSync } from 'node:child_process';
import {
  cpSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const androidDir = join(root, 'android');
const targetMarker = join(androidDir, '.build-target');
const cacheRoot = join(root, '.native-cache');
const cacheDirFor = (name) => join(cacheRoot, `android-${name}`);

const argv = process.argv.slice(2);
const hasFlag = (name) => argv.includes(`--${name}`);
const flagValue = (name) => {
  const match = argv.find((arg) => arg.startsWith(`--${name}=`));
  return match ? match.slice(name.length + 3) : null;
};

const isTV = hasFlag('tv');
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

const gradlew = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function stopGradleDaemon(cwd) {
  if (!existsSync(join(cwd, process.platform === 'win32' ? 'gradlew.bat' : 'gradlew'))) {
    return;
  }
  console.log('Stopping the Gradle daemon so the native folder can be moved.');
  spawnSync(gradlew, ['--stop'], { cwd, stdio: 'inherit', shell: true });
  sleep(1500);
}

/**
 * On Windows, rename often fails (EPERM) while something still holds the folder.
 * Prefer rename; on Windows fall back to robocopy /MOVE so timestamps survive
 * (a plain copy dirties Gradle and turns a ~40s restore into a ~10 min rebuild).
 */
function moveDir(from, to) {
  mkdirSync(dirname(to), { recursive: true });
  if (existsSync(to)) {
    rmSync(to, { recursive: true, force: true });
  }

  stopGradleDaemon(from);

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      renameSync(from, to);
      return;
    } catch (err) {
      console.log(`Rename attempt ${attempt}/3 failed (${err.code ?? err.message}).`);
      sleep(1000 * attempt);
    }
  }

  if (process.platform === 'win32') {
    console.log('Falling back to robocopy /MOVE (keeps file timestamps).');
    const result = spawnSync(
      'robocopy',
      [from, to, '/E', '/MOVE', '/NFL', '/NDL', '/NJH', '/NJS', '/NC', '/NS', '/R:2', '/W:2'],
      { stdio: 'inherit', shell: true },
    );
    // robocopy: 0–7 = success, >= 8 = failure
    if ((result.status ?? 16) >= 8) {
      throw new Error(`robocopy failed with exit code ${result.status}`);
    }
    if (existsSync(from)) {
      rmSync(from, { recursive: true, force: true });
    }
    return;
  }

  console.log('Falling back to copy + delete.');
  cpSync(from, to, { recursive: true });
  rmSync(from, { recursive: true, force: true });
}

function stashNative(current) {
  const slot = cacheDirFor(current);
  mkdirSync(cacheRoot, { recursive: true });
  moveDir(androidDir, slot);
  console.log(`Cached the ${current} native build in .native-cache/`);
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

let needsPrebuild = false;

if (forceClean) {
  needsPrebuild = true;
} else if (currentTarget === target) {
  console.log(`Reusing the ${target} native build already in android/.`);
} else {
  if (currentTarget) {
    stashNative(currentTarget);
  } else if (existsSync(androidDir)) {
    rmSync(androidDir, { recursive: true, force: true });
  }

  const slot = cacheDirFor(target);
  if (existsSync(slot)) {
    moveDir(slot, androidDir);
    console.log(`Restored the ${target} native build from .native-cache/`);
  } else {
    needsPrebuild = true;
  }
}

if (needsPrebuild) {
  console.log(`Generating native code for ${target} — this takes ~25 min the first time.`);
  run('npx', ['expo', 'prebuild', '--clean', '--platform', 'android']);
  writeFileSync(targetMarker, target);
}

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
copyFileSync(apk, join(root, 'dist', outputName));

const minutes = ((Date.now() - startedAt) / 60000).toFixed(1);
console.log(`\nAPK ready: dist/${outputName}`);
console.log(`ABIs: ${abis} · Gradle took ${minutes} min`);
