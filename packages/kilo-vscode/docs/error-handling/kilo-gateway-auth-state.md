# Kilo Gateway Auth State in Providers UI

**Priority:** P1
**Status:** Planned

## Goal

Keep the legacy Kilo semantics in the new extension:

- Kilo stays available even when the user logs out
- Kilo auth drives the `Connect` vs `Log out` action
- No explicit `Disable Kilo` feature in this PR

This plan is meant to fix these two bugs together:

1. After disconnecting Kilo Gateway, the settings screen stays stuck on `Disconnect` instead of switching back to `Connect`
2. After logout/restart, stale Kilo auth can remain or be re-imported, leaving the user effectively logged out for calls but unable to cleanly re-enable from the UI

## Current Problem

- The CLI/provider layer still exposes Kilo as an available provider after logout because free models remain available
- The extension webview currently treats Kilo availability as if it were Kilo auth, so the providers tab keeps showing Kilo in the `Disconnect` state
- Legacy Kilo auth migration can restore a token on startup after an explicit logout, which reintroduces stale auth state

## Plan

### 1. Keep Kilo availability separate from Kilo auth

- Do not change the provider-list semantics that keep Kilo available for anonymous/free usage
- Do not add a Kilo disable toggle in this PR
- Keep the fallback order as `top selection -> CLI config -> kilo-auto`

### 2. Drive the Kilo action from auth state, not provider availability

- Update `packages/kilo-vscode/webview-ui/src/components/settings/ProvidersTab.tsx`
- Stop using `provider.connected()` as the source of truth for the Kilo row action
- Use `provider.authStates()["kilo"]` and the existing profile state to decide whether Kilo should show `Connect` or `Log out`
- Leave the existing connected/disconnect behavior unchanged for non-Kilo providers

### 3. Make logout refresh the webview immediately and consistently

- Keep the existing logout call in `packages/kilo-vscode/src/KiloProvider.ts`
- Ensure Kilo logout always pushes both:
  - `profileData: null`
  - a fresh `providersLoaded` payload with updated `authStates`
- If needed, adjust the Kilo row grouping so Kilo can remain available while still showing `Connect` immediately after logout

### 4. Prevent legacy auth from being silently restored after explicit logout

- Update the legacy Kilo auth migration path so an explicit logout is respected on restart
- Likely touchpoints:
  - `packages/opencode/src/index.ts`
  - `packages/kilo-gateway/src/auth/legacy-migration.ts`
- Preferred fix direction: clear or suppress the legacy Kilo auth source after explicit logout so startup does not re-import stale credentials

### 5. Verify anonymous Kilo still works

- Confirm Kilo free models remain selectable when logged out
- Confirm paid models still surface the existing credit/sign-in behavior instead of breaking the provider state
- Confirm the fallback chain still lands on `kilo-auto` when no stronger selection is valid

## Files Expected to Change

- `packages/kilo-vscode/webview-ui/src/components/settings/ProvidersTab.tsx`
- `packages/kilo-vscode/src/KiloProvider.ts`
- `packages/kilo-vscode/webview-ui/src/context/provider.tsx`
- `packages/opencode/src/index.ts`
- `packages/kilo-gateway/src/auth/legacy-migration.ts`

## Validation

- Logging out from the providers/settings UI changes the Kilo action back to `Connect` without reloading the extension
- Restarting the extension does not resurrect stale Kilo auth after an explicit logout
- Anonymous/free Kilo usage still works
- Kilo can be reconnected cleanly after logout
- Relevant VS Code extension tests and CLI-side auth tests cover the new behavior
