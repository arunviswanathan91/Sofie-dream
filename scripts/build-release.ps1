# build-release.ps1 — Load .env.local into the current session, then run Gradle assembleRelease.
#
# Usage (from project root):
#   .\scripts\build-release.ps1
#
# Why this is needed:
#   Gradle's assembleRelease does not run Metro/Expo's JS bundler through the
#   normal "expo start" path, so EXPO_PUBLIC_* variables declared in .env.local
#   are never injected unless they are already present in the shell environment
#   that launches Gradle.

$ErrorActionPreference = "Stop"

$envFile = Join-Path $PSScriptRoot ".." ".env.local"
$envFile = [System.IO.Path]::GetFullPath($envFile)

if (-Not (Test-Path $envFile)) {
    Write-Warning ".env.local not found at $envFile — EXPO_PUBLIC_* vars will be empty."
} else {
    Write-Host "Loading environment from .env.local ..."
    Get-Content $envFile | ForEach-Object {
        $line = $_.Trim()
        # Skip blank lines and comments
        if ([string]::IsNullOrWhiteSpace($line) -or $line.StartsWith("#")) { return }
        # Only process lines that look like KEY=VALUE
        if ($line -match '^([A-Za-z_][A-Za-z0-9_]*)=(.*)$') {
            $key   = $Matches[1]
            $value = $Matches[2].Trim('"').Trim("'")
            [System.Environment]::SetEnvironmentVariable($key, $value, "Process")
            Write-Host "  Set $key"
        }
    }
    Write-Host "Done loading .env.local"
}

Write-Host "Running Gradle assembleRelease ..."
$androidDir = Join-Path $PSScriptRoot ".." "android"
$androidDir = [System.IO.Path]::GetFullPath($androidDir)

Push-Location $androidDir
try {
    & .\gradlew assembleRelease @args
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} finally {
    Pop-Location
}
