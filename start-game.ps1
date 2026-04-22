param(
  [int]$Port = 8080,
  [switch]$NoBrowser
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-AvailablePort {
  param(
    [int]$StartPort,
    [int]$Attempts = 20
  )

  for ($candidate = $StartPort; $candidate -lt ($StartPort + $Attempts); $candidate += 1) {
    $tcpListener = $null

    try {
      $tcpListener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $candidate)
      $tcpListener.Start()
      return $candidate
    } catch {
      continue
    } finally {
      if ($tcpListener) {
        $tcpListener.Stop()
      }
    }
  }

  throw "No available port found. Close services using ports 8080-8099 and try again."
}

function Get-ContentType {
  param(
    [string]$FilePath
  )

  $extension = [System.IO.Path]::GetExtension($FilePath).ToLowerInvariant()
  $contentTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".js" = "application/javascript; charset=utf-8"
    ".css" = "text/css; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".png" = "image/png"
    ".jpg" = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".svg" = "image/svg+xml"
    ".ico" = "image/x-icon"
    ".txt" = "text/plain; charset=utf-8"
  }

  if ($contentTypes.ContainsKey($extension)) {
    return $contentTypes[$extension]
  }

  return "application/octet-stream"
}

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootFullPath = [System.IO.Path]::GetFullPath($projectRoot)
$actualPort = Get-AvailablePort -StartPort $Port
$baseUrl = "http://localhost:$actualPort/"
$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add($baseUrl)

try {
  $listener.Start()
  Write-Host ""
  Write-Host "English Game local server started:" -ForegroundColor Cyan
  Write-Host "  $baseUrl" -ForegroundColor Green
  Write-Host ""
  if ($NoBrowser) {
    Write-Host "Browser auto-open disabled (-NoBrowser)." -ForegroundColor Yellow
  } else {
    Write-Host "The browser will open automatically. Close this window or press Ctrl+C to stop the server." -ForegroundColor Yellow
  }
  Write-Host ""

  if (-not $NoBrowser) {
    Start-Process "$baseUrl`index.html" | Out-Null
  }

  while ($listener.IsListening) {
    try {
      $context = $listener.GetContext()
    } catch {
      if ($listener.IsListening) {
        Write-Warning $_.Exception.Message
      }
      break
    }

    $request = $context.Request
    $response = $context.Response

    try {
      if ($request.HttpMethod -notin @("GET", "HEAD")) {
        $response.StatusCode = 405
        $response.Close()
        continue
      }

      $relativePath = [System.Uri]::UnescapeDataString($request.Url.AbsolutePath.TrimStart("/"))

      if ([string]::IsNullOrWhiteSpace($relativePath)) {
        $relativePath = "index.html"
      }

      $sanitizedRelativePath = $relativePath -replace "/", "\"
      $candidatePath = Join-Path $projectRoot $sanitizedRelativePath
      $fullPath = [System.IO.Path]::GetFullPath($candidatePath)

      if (-not $fullPath.StartsWith($rootFullPath, [System.StringComparison]::OrdinalIgnoreCase)) {
        $response.StatusCode = 403
        $response.Close()
        continue
      }

      if (Test-Path $fullPath -PathType Container) {
        $fullPath = Join-Path $fullPath "index.html"
      }

      if (-not (Test-Path $fullPath -PathType Leaf)) {
        $response.StatusCode = 404
        $response.Close()
        continue
      }

      $bytes = [System.IO.File]::ReadAllBytes($fullPath)
      $response.StatusCode = 200
      $response.ContentType = Get-ContentType -FilePath $fullPath
      $response.ContentLength64 = $bytes.Length

      if ($request.HttpMethod -eq "GET") {
        $response.OutputStream.Write($bytes, 0, $bytes.Length)
      }
    } catch {
      $response.StatusCode = 500
      $errorBytes = [System.Text.Encoding]::UTF8.GetBytes("Server error")
      $response.ContentType = "text/plain; charset=utf-8"
      $response.ContentLength64 = $errorBytes.Length
      $response.OutputStream.Write($errorBytes, 0, $errorBytes.Length)
      Write-Warning $_.Exception.Message
    } finally {
      $response.OutputStream.Close()
    }
  }
} finally {
  if ($listener.IsListening) {
    $listener.Stop()
  }

  $listener.Close()
}
