$ErrorActionPreference = 'Stop'

$trivyPath = $env:TRIVY_BIN
if (-not $trivyPath) {
  $trivy = Get-Command trivy -ErrorAction SilentlyContinue
  if ($trivy) { $trivyPath = $trivy.Source }
}
if (-not $trivyPath) {
  throw 'Trivy is not installed or is not on PATH. Install it from the official Windows release ZIP first.'
}

$fixtureDirectory = Join-Path ([System.IO.Path]::GetTempPath()) ("trivy-secret-fixture-" + [guid]::NewGuid().ToString('N'))
$fixturePath = Join-Path $fixtureDirectory 'synthetic.env'
$reportPath = Join-Path $fixtureDirectory 'report.json'
New-Item -ItemType Directory -Path $fixtureDirectory | Out-Null

try {
  # Synthetic test value only; concatenate so repository scans cannot match a credential pattern.
  $fakeAccessKey = 'AKIA' + ('A' * 16)
  Set-Content -LiteralPath $fixturePath -Value "AWS_ACCESS_KEY_ID=$fakeAccessKey" -NoNewline

  & $trivyPath fs --scanners secret --severity HIGH,CRITICAL --exit-code 1 --format json --output $reportPath $fixtureDirectory
  $scanExitCode = $LASTEXITCODE
  if (-not (Test-Path -LiteralPath $reportPath)) {
    throw "Trivy did not create a report (exit code $scanExitCode); scanner execution was not verified."
  }

  $report = Get-Content -LiteralPath $reportPath -Raw | ConvertFrom-Json
  $secretCount = @($report.Results | ForEach-Object { $_.Secrets } | Where-Object { $_ }).Count
  if ($scanExitCode -ne 1 -or $secretCount -lt 1) {
    throw "Expected Trivy to exit 1 and report the synthetic fixture; got exit $scanExitCode and $secretCount findings."
  }

  Write-Output 'PASS: Trivy detected the synthetic secret fixture and returned the configured blocking exit code.'
}
finally {
  Remove-Item -LiteralPath $fixtureDirectory -Recurse -Force
}
