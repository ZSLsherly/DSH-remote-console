[CmdletBinding()]
param(
  [ValidateRange(1, 65535)]
  [int]$Port = 3080,
  [ValidateRange(1, 65535)]
  [int]$HttpsPort = 8443
)

$ErrorActionPreference = 'Stop'
$tailscale = Get-Command tailscale.exe -ErrorAction Stop
$status = (& $tailscale.Source status --json | ConvertFrom-Json)
if ($LASTEXITCODE -ne 0) {
  throw "Could not read Tailscale status (exit code $LASTEXITCODE)"
}
$dnsName = ([string]$status.Self.DNSName).Trim().TrimEnd('.')
if ([string]::IsNullOrWhiteSpace($dnsName)) {
  throw 'Tailscale did not report a MagicDNS name for this device'
}

$localUrl = "http://127.0.0.1:$Port/"
$remoteUrl = "https://${dnsName}:$HttpsPort/"

foreach ($url in @($localUrl, $remoteUrl)) {
  $response = Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 10
  if ($response.StatusCode -ne 200) {
    throw "$url returned HTTP $($response.StatusCode)"
  }
  if ($response.Content -notmatch 'dsh-mobile') {
    throw "$url is reachable but its boot document does not include dsh-mobile"
  }
  Write-Host "OK $url"
}

$clientUrl = "https://${dnsName}:$HttpsPort/plugins/@wahu/dsh-mobile/client.js"
$client = Invoke-WebRequest -UseBasicParsing -Uri $clientUrl -TimeoutSec 10
if ($client.StatusCode -ne 200 -or $client.Content -notmatch '__ModuleLoader__') {
  throw "The dsh-mobile browser bundle is not available at $clientUrl"
}
Write-Host "OK $clientUrl"
