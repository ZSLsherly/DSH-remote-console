[CmdletBinding()]
param(
  [string]$Profile = 'web'
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$shimDirectory = Join-Path $PSScriptRoot 'bin'
$env:Path = "$shimDirectory;$env:Path"

function Invoke-Checked {
  param(
    [Parameter(Mandatory)]
    [scriptblock]$Command,
    [Parameter(Mandatory)]
    [string]$Description
  )

  & $Command
  if ($LASTEXITCODE -ne 0) {
    throw "$Description failed with exit code $LASTEXITCODE"
  }
}

Push-Location $projectRoot
try {
  Invoke-Checked { corepack.cmd pnpm install --frozen-lockfile=false } 'Dependency installation'
  Invoke-Checked { corepack.cmd pnpm run check } 'Project verification'
  Invoke-Checked { dsh.cmd plugin --profile $Profile add $projectRoot } 'DSH plugin installation'

  $config = & dsh.cmd --profile $Profile --dump-config 2>&1 | Out-String
  if ($LASTEXITCODE -ne 0) {
    throw "DSH profile validation failed with exit code $LASTEXITCODE`n$config"
  }
  if ($config -notmatch 'dsh-mobile') {
    throw "DSH profile '$Profile' does not contain dsh-mobile after installation"
  }

  Write-Host "dsh-mobile is installed in the '$Profile' profile."
}
finally {
  Pop-Location
}
