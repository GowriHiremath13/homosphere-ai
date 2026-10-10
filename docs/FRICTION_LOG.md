# HomeSphere AI — Product Friction Log

This log tracks friction encountered while building HomeSphere AI, and — most importantly —
things that **must be verified on real Amazon Fire TV / Vega OS hardware** before the hackathon
demo. Everything below was written during development on a desktop Chrome + a phone browser
simulating the TV WebView. None of it is a confirmed claim about Fire TV / Vega OS SDK behavior;
treat every "UNVERIFIED" item as a task, not a fact.

Use the template at the bottom to add new entries.

---

## Entry 1

**Issue:** Fire TV remote key codes are not officially confirmed for this app's input handling.

**Environment:** Developed against desktop keyboard (ArrowUp/Down/Left/Right, Enter, Escape,
Backspace) in Chrome. `useTVNavigation` also listens for legacy numeric `keyCode`s (13, 23, 27,
8, 4, 461, 10009) that are commonly cited for Android TV / Fire TV D-pad and Back, gathered from
general web references — **not verified against real hardware**.

**Steps to reproduce:** N/A — this is a gap, not a bug yet.

**Expected behavior:** D-pad Up/Down/Left/Right, Select/OK, and Back on a real Fire TV remote (and
any Vega OS input service) map correctly to `up/down/left/right/select/back` in
`useTVNavigation.js`.

**Actual behavior:** Unknown until tested on a physical Fire TV / Vega OS device or emulator.

**Error message:** None observed in the browser; a real device could report different `key` or
`keyCode` values, or use a different event entirely (e.g. a native input bridge instead of
DOM `keydown`).

**Workaround:** The KEY_MAP/CODE_MAP in `client/src/hooks/useTVNavigation.js` intentionally lists
several historically-cited codes for maximum compatibility. The phone controller's Remote tab
(`/mobile` → Remote) sends the same logical actions over Socket.IO as a hardware-independent
fallback for the live demo.

**Suggested improvement:** Before the hackathon, run the app in the actual Fire TV WebView /
Vega OS browser shell and log every `keydown` event (key, keyCode, code) to confirm real values,
then trim `KEY_MAP`/`CODE_MAP` to match and remove guesses that don't apply.

---

## Entry 2

**Issue:** Behavior of `<meta name="viewport">` and CSS scaling inside the Fire TV / Vega OS
WebView is unverified.

**Environment:** Verified only in desktop Chrome and a phone browser at various widths. The TV UI
uses a fixed 1920×1080 canvas (`client/src/hooks/useStageScale.js`) scaled via CSS `transform` to
`window.innerWidth/innerHeight`.

**Steps to reproduce:** N/A.

**Expected behavior:** The TV WebView reports a viewport at or near the actual TV resolution
(1920×1080 or 3840×2160 scaled down), so the stage scales to fill the screen without letterboxing
or overflow.

**Actual behavior:** Unknown. Some TV WebViews report unusual `devicePixelRatio` or a fixed
non-native viewport size.

**Error message:** None yet.

**Workaround:** `useStageScale` recalculates on `resize`, and the design keeps a 40–50px safe
margin from all edges so minor scaling inaccuracies don't clip content.

**Suggested improvement:** Test on hardware and, if needed, add a Vega OS/Fire TV-specific
viewport detection (or a manual "TV size" override in Settings) rather than trusting
`window.innerWidth`.

---

## Entry 3

**Issue:** QR pairing URL depends on discovering the host machine's LAN IP address.

**Environment:** Verified on a single development machine with one active network interface. Cloud
containers, VPNs, or machines with multiple NICs may report the wrong IP or none at all.

**Steps to reproduce:** Run the server on a machine with a VPN active; `getLanIp()` in
`server/utils/network.js` may return the VPN's virtual interface address instead of the real LAN
IP the TV and phone can both reach.

**Expected behavior:** The QR code always encodes a URL that is reachable from a phone on the same
network as the TV.

**Actual behavior:** On multi-interface machines, the wrong interface can be selected.

**Error message:** The phone would show "Unable to connect to HomeSphere" after scanning.

**Workaround:** Set `CLIENT_URL` in `.env` explicitly to `http://<your-LAN-IP>:<port>` (or the
Vite dev URL) instead of relying on auto-detection, especially during the hackathon demo.

**Suggested improvement:** Add a Settings screen "Manual server address" override, and/or list all
candidate LAN IPs at startup so the presenter can pick the right one.

---

## Entry 4

**Issue:** No confirmed Amazon Vega OS / Fire TV packaging or deployment steps.

**Environment:** This build is a standard React (Vite) + Node/Express/Socket.IO web app. No Vega
OS SDK or Fire TV app packaging tooling was available while building this project.

**Steps to reproduce:** N/A.

**Expected behavior:** The built `client/dist` output (or the dev server URL) can be loaded inside
a Fire TV WebView-based app shell, or packaged per Amazon's Vega OS web-app guidelines.

**Actual behavior:** Unverified — packaging format, manifest requirements, and any required native
bridge APIs for Vega OS are not confirmed in this project.

**Error message:** N/A.

**Workaround:** For the hackathon demo, run the production build and open it directly in the Fire
TV's built-in browser (Silk Browser) or any installed WebView-based app shell, pointed at the
server's LAN URL, rather than a fully packaged native app.

**Suggested improvement:** Consult Amazon's official Fire TV/Vega OS web-app documentation and
adjust this section with confirmed packaging steps once available. Do not assume any specific
Amazon SDK behavior without checking the official docs first.

---

## Entry 5

**Issue:** AI provider errors and rate limits from a real LLM API are unverified end-to-end.

**Environment:** All AI features were developed and tested primarily in **Demo Mode**, which uses
deterministic local logic (`server/services/demoAI.js`) instead of a live model. The live path
(`server/services/aiService.js` → Anthropic or OpenAI-compatible endpoint) was exercised for
request/response shape and error handling, but not load-tested or checked against every real
provider error code.

**Steps to reproduce:** Set `AI_API_KEY` and turn Demo Mode off, then send several rapid AI
requests.

**Expected behavior:** Provider errors (rate limits, invalid key, timeouts) surface as a friendly
message ("The AI service could not answer right now...") without crashing the TV UI.

**Actual behavior:** The error-handling path exists and returns structured `HttpError`s, but has
only been exercised with simulated failures, not a real provider under load.

**Error message:** N/A yet.

**Workaround:** Demo Mode removes this dependency entirely for the hackathon video — recommended
for the actual demo recording to guarantee reliability.

**Suggested improvement:** Before relying on live AI during a real demo, run a short soak test
against the configured provider and confirm behavior for at least: invalid key, rate limit (429),
and timeout.

---

## Template for new entries

```
## Issue

## Environment

## Steps to reproduce

## Expected behavior

## Actual behavior

## Error message

## Workaround

## Suggested improvement
```
