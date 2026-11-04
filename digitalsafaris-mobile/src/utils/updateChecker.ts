import { Linking } from 'react-native';
import * as Application from 'expo-application';
import Constants from 'expo-constants';

const GITHUB_OWNER = 'johnnysally';
const GITHUB_REPO = 'digital-safaris';
const LATEST_RELEASE_API = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;
const CACHE_MS = 1000 * 60 * 60 * 6;

export interface GithubReleaseAsset {
  id: number;
  name: string;
  browser_download_url: string;
  content_type: string;
  size: number;
  digest?: string;
}

export interface GithubRelease {
  tag_name: string;
  name: string;
  body: string | null;
  html_url: string;
  published_at: string;
  assets: GithubReleaseAsset[];
}

export interface UpdateInfo {
  available: boolean;
  currentVersion: string;
  latestVersion: string;
  downloadUrl: string | null;
  notes: string | null;
  release: GithubRelease | null;
}

let lastFetchAt = 0;
let lastResult: UpdateInfo | null = null;

function compareVersions(a: string, b: string): number {
  const clean = (v: string) => v.replace(/^v/i, '');
  const pa = clean(a).split('.').map((n) => parseInt(n, 10) || 0);
  const pb = clean(b).split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] ?? 0;
    const y = pb[i] ?? 0;
    if (x < y) return -1;
    if (x > y) return 1;
  }
  return 0;
}

export function getCurrentVersion(): string {
  return (
    Application.nativeApplicationVersion ??
    Constants.expoConfig?.version ??
    '1.0.0'
  );
}

function pickApkAsset(release: GithubRelease): GithubReleaseAsset | null {
  if (!release.assets?.length) return null;
  const byType = release.assets.find(
    (a) =>
      a.content_type === 'application/vnd.android.package-archive' ||
      a.name.toLowerCase().endsWith('.apk')
  );
  if (byType) return byType;
  return release.assets.find((a) => /\.apk$/i.test(a.name)) ?? null;
}

export async function checkForUpdate(force = false): Promise<UpdateInfo | null> {
  const now = Date.now();
  if (!force && lastResult && now - lastFetchAt < CACHE_MS) {
    return lastResult;
  }

  try {
    const res = await fetch(LATEST_RELEASE_API, {
      headers: {
        'User-Agent': 'DigitalSafaris-Mobile/1.0',
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!res.ok) return null;

    const release = (await res.json()) as GithubRelease;
    const currentVersion = getCurrentVersion();
    const latestVersion = release.tag_name ?? currentVersion;
    const available = compareVersions(latestVersion, currentVersion) > 0;
    const apk = pickApkAsset(release);
    const downloadUrl = apk?.browser_download_url ?? release.html_url ?? null;

    const result: UpdateInfo = {
      available,
      currentVersion,
      latestVersion,
      downloadUrl: available ? downloadUrl : null,
      notes: release.body ?? null,
      release,
    };

    lastResult = result;
    lastFetchAt = now;
    return result;
  } catch {
    return null;
  }
}

export async function openUpdateDownload(url: string): Promise<void> {
  try {
    await Linking.openURL(url);
  } catch {}
}