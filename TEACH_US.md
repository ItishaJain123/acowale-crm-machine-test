# TEACH_US.md

## The gap between "works on my machine" and "works in production" hides in TypeScript and your lockfile

The scariest bugs aren't in your code — they're in the seam between your laptop and your
deploy host. Building and deploying this project surfaced two non-obvious traps at exactly
that seam. Both passed every local test and still broke the first deploy. Here's what they
teach.

### Trap 1 — TypeScript's compiler is now platform-specific

TypeScript's newest compiler (v7, the native "tsgo" rewrite) is no longer a single pure
JavaScript file. It ships as **OS-specific native binaries** — `@typescript/typescript-linux-x64`,
`-win32-x64`, and so on — pulled in as optional dependencies.

My `package-lock.json` was generated on **Windows**, so it recorded the Windows binary but
not the Linux one. Locally, `tsc` ran fine. On the deploy host (Linux), `npm ci` installed
from that same lockfile and `tsc` crashed with:

```
Error: Unable to resolve @typescript/typescript-linux-x64.
```

**The lesson:** a lockfile is only as portable as the platform that created it, and tools
that ship native binaries turn that into a build failure. The fix here was to pin
**TypeScript 5.x** — a pure-JavaScript compiler that runs identically everywhere. The
general principle: for anything with per-platform binaries, either pin to a
platform-neutral version, or generate your lockfile in the *same* environment you deploy to
(e.g. inside a Linux container).

### Trap 2 — `NODE_ENV=production` silently deletes your build tools

The next deploy failed differently: `tsc` couldn't find *any* type definitions —
`@types/node`, `@types/express`, all "cannot find module."

The cause: I'd set `NODE_ENV=production`. Under that flag, `npm ci` **skips
`devDependencies`** — and `typescript` and every `@types/*` package live there. So the very
tools needed to *build* the app were omitted from the build.

**The lesson:** "production" means two different things at two different times. At *runtime*
you want production mode. At *build* time you still need your dev tooling. The fix was to
build with `npm ci --include=dev`, keeping `NODE_ENV=production` for the running server but
guaranteeing the compiler survives the install.

### Why this matters for Acowale

Both bugs are invisible until the exact moment code leaves your machine — and both are the
kind of thing a green CI check can miss if CI runs on your OS but production runs on
another. The habit worth teaching: **treat the build environment as production's twin, not
your laptop's.** Generate lockfiles where you deploy, assume `NODE_ENV=production` will trim
your `node_modules`, and prefer platform-neutral build tools. The cheapest place to catch a
"works on my machine" bug is *before* it becomes a red deploy at 2 AM.
