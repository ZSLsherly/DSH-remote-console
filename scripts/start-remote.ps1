[CmdletBinding()]
param(
  [ValidateRange(1, 65535)]
  [int]$Port = 3080,
  [ValidateRange(1, 65535)]
  [int]$HttpsPort = 8443,
  [switch]$ConfigureServe
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Net.Http
$tailscale = Get-Command tailscale.exe -ErrorAction Stop
$dsh = Get-Command dsh.cmd -ErrorAction Stop

$statusText = & $tailscale.Source status --json
if ($LASTEXITCODE -ne 0) {
  throw "Could not read Tailscale status (exit code $LASTEXITCODE)"
}
$status = $statusText | ConvertFrom-Json
$dnsName = [string]$status.Self.DNSName
$dnsName = $dnsName.Trim().TrimEnd('.')
if ([string]::IsNullOrWhiteSpace($dnsName)) {
  throw 'Tailscale did not report a MagicDNS name for this device'
}

$authority = "${dnsName}:$HttpsPort"
$upstream = "http://127.0.0.1:$Port"

function Enable-TailscaleServe {
  & $tailscale.Source serve --bg "--https=$HttpsPort" $upstream
  if ($LASTEXITCODE -ne 0) {
    throw "Tailscale Serve configuration failed with exit code $LASTEXITCODE"
  }
}

Write-Host "Local DSH:  $upstream"
Write-Host "Mobile URL: https://$authority"

$listeners = @(Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
if ($listeners.Count -gt 0) {
  $unsafeListener = $listeners | Where-Object { $_.LocalAddress -notin @('127.0.0.1', '::1') } | Select-Object -First 1
  if ($null -ne $unsafeListener) {
    throw "Port $Port is already exposed on $($unsafeListener.LocalAddress); dsh-mobile requires a loopback-only DSH"
  }

  $client = [System.Net.Http.HttpClient]::new()
  $request = [System.Net.Http.HttpRequestMessage]::new(
    [System.Net.Http.HttpMethod]::Get,
    "$upstream/api"
  )
  $request.Headers.Host = $authority
  $response = $null
  try {
    $response = $client.SendAsync($request).GetAwaiter().GetResult()
    if ([int]$response.StatusCode -eq 403) {
      throw "Port $Port already runs DSH without trusted host '$authority'; stop it and run this script again"
    }
  }
  finally {
    if ($null -ne $response) {
      $response.Dispose()
    }
    $request.Dispose()
    $client.Dispose()
  }

  if ($ConfigureServe) {
    Enable-TailscaleServe
  }
  Write-Host "Reusing the loopback DSH already listening on port $Port."
  return
}

if ($ConfigureServe) {
  Enable-TailscaleServe
}

Write-Host 'DSH remains loopback-only; press Ctrl+C to stop it.'

& $dsh.Source --profile web --port $Port --trusted-host $authority
exit $LASTEXITCODE
