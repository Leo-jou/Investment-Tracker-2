#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const contextPath = path.join(repoRoot, "context.md");
const isCheck = process.argv.includes("--check");
const maxCommits = 8;
const maxTodoItems = 20;

function run(command: string, args: string[]): string | null {
  try {
    return execFileSync(command, args, {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
}

function isGitRepo(): boolean {
  return run("git", ["rev-parse", "--is-inside-work-tree"]) === "true";
}

function recentCommits(): string[] {
  const output = run("git", ["log", `-${maxCommits}`, "--pretty=format:%h %ad %s", "--date=short"]);
  return output ? output.split("\n").filter(Boolean) : [];
}

function changedFiles(): string[] {
  const output = run("git", ["log", `-${maxCommits}`, "--name-only", "--pretty=format:"]);
  if (!output) return [];
  return Array.from(new Set(output.split("\n").map((line) => line.trim()).filter(Boolean))).sort();
}

function areaForFile(file: string): string {
  if (file.startsWith("app/api/")) return "API routes";
  if (file.startsWith("app/")) return "App pages";
  if (file.startsWith("components/")) return "UI components";
  if (file.startsWith("lib/db/") || file.startsWith("drizzle/")) return "Database";
  if (file.startsWith("lib/pricing/")) return "Pricing providers";
  if (file.startsWith("lib/performance/") || file.startsWith("lib/metrics")) return "Metrics";
  if (file.startsWith("docs/") || file === "README.md" || file === "AGENTS.md" || file === "context.md") return "Documentation";
  if (file.startsWith("scripts/") || file.startsWith(".github/")) return "Tooling";
  return "Other";
}

function summarizeAreas(files: string[]): string[] {
  const counts = new Map<string, number>();
  for (const file of files) {
    const area = areaForFile(file);
    counts.set(area, (counts.get(area) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([area, count]) => `${area}: ${count} file${count === 1 ? "" : "s"}`);
}

function walkFiles(dir: string, output: string[] = []): string[] {
  const ignored = new Set([".git", ".next", "node_modules", "dist", "build", "coverage"]);
  const ignoredFiles = new Set(["AGENTS.md", "README.md", "context.md", "package-lock.json"]);
  for (const entry of readdirSync(dir)) {
    if (ignored.has(entry)) continue;
    const absolute = path.join(dir, entry);
    const relative = path.relative(repoRoot, absolute);
    if (ignoredFiles.has(relative) || relative.startsWith("scripts/") || relative.startsWith(".github/")) continue;
    const stat = statSync(absolute);
    if (stat.isDirectory()) {
      walkFiles(absolute, output);
    } else if (/\.(ts|tsx|js|jsx|md|mjs|cjs|css|sql)$/.test(entry)) {
      output.push(relative);
    }
  }
  return output;
}

function todoItems(): string[] {
  const matches: string[] = [];
  for (const file of walkFiles(repoRoot)) {
    const lines = readFileSync(path.join(repoRoot, file), "utf8").split("\n");
    lines.forEach((line, index) => {
      if (/\b(TODO|FIXME)\b/i.test(line)) {
        matches.push(`${file}:${index + 1} ${line.trim()}`);
      }
    });
  }
  return matches.slice(0, maxTodoItems);
}

function replaceBlock(content: string, name: string, lines: string[]): string {
  const start = `<!-- context:auto:start:${name} -->`;
  const end = `<!-- context:auto:end:${name} -->`;
  const block = `${start}\n${lines.join("\n")}\n${end}`;
  const pattern = new RegExp(`${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}`);
  if (pattern.test(content)) return content.replace(pattern, block);
  return content;
}

function replaceLastUpdated(content: string, timestamp: string, summary: string): string {
  const next = `## Last Updated\n\n${timestamp} - ${summary}`;
  return content.replace(/## Last Updated[\s\S]*$/u, next);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function bulletList(items: string[], empty: string): string[] {
  if (items.length === 0) return [`- ${empty}`];
  return items.map((item) => `- ${item}`);
}

if (!existsSync(contextPath)) {
  throw new Error("context.md does not exist. Create it before running this script.");
}

const gitAvailable = isGitRepo();
const commits = gitAvailable ? recentCommits() : [];
const files = gitAvailable ? changedFiles() : [];
const areas = summarizeAreas(files);
const todos = todoItems();
let nextContent = readFileSync(contextPath, "utf8");

nextContent = replaceBlock(nextContent, "implementation-status", [
  "Generated refresh summary:",
  ...bulletList(
    areas,
    gitAvailable
      ? "No changed files found in recent git history."
      : "Git history unavailable in this workspace; initialize or connect `.git` for changed-area summaries.",
  ),
  "",
  "Recent commits:",
  ...bulletList(
    commits,
    gitAvailable
      ? "No recent commits found."
      : "Git history unavailable in this workspace.",
  ),
]);

nextContent = replaceBlock(nextContent, "known-issues", [
  "Generated TODO/FIXME scan:",
  ...bulletList(todos, "No TODO/FIXME comments found in scanned source files."),
]);

nextContent = replaceBlock(nextContent, "next-steps", [
  "Generated suggestions:",
  ...(gitAvailable
    ? ["- Review recent changed areas above and manually fold durable decisions into the appropriate sections."]
    : ["- Initialize or connect the Git repository so this script can summarize recent commits and changed files."]),
  ...(todos.length > 0
    ? ["- Triage TODO/FIXME items and promote real unresolved work into Known Bugs / Issues."]
    : ["- Keep updating context after meaningful implementation work; no TODO/FIXME-driven action is currently visible."]),
  "- Keep product and technical decisions manually curated; this script only updates bounded generated blocks.",
]);

const summary = gitAvailable
  ? `Refreshed generated context from ${commits.length} recent commits, ${files.length} changed files, and ${todos.length} TODO/FIXME items.`
  : `Refreshed generated context without git history; scanned ${todos.length} TODO/FIXME items.`;

if (isCheck) {
  const current = readFileSync(contextPath, "utf8");
  if (current !== nextContent) {
    console.error("context.md is stale. Run `npm run context:update`.");
    process.exit(1);
  }
  console.log("context.md is current.");
} else {
  const timestamp = new Date().toISOString();
  nextContent = replaceLastUpdated(nextContent, timestamp, summary);
  writeFileSync(contextPath, nextContent.endsWith("\n") ? nextContent : `${nextContent}\n`);
  console.log(`Updated context.md at ${timestamp}.`);
}
