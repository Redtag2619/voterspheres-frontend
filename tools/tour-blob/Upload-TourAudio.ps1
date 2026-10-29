param(
    [Parameter(Mandatory=$true)][ValidatePattern('^[a-f0-9]{64}$')][string]$Plan,
    [ValidateRange(1,5000)][int]$MaxFiles = 4000
)
$ErrorActionPreference = "Stop"
if ($env:BLOB_READ_WRITE_TOKEN) { throw "A Blob token is already set. Review it or clear it before using this prompt." }
$secret = Read-Host "Paste the voterspheres-tour-audio BLOB_READ_WRITE_TOKEN (hidden input)" -AsSecureString
$pointer = [IntPtr]::Zero
try {
    $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
    $env:BLOB_READ_WRITE_TOKEN = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
    node tools/tour-blob/upload.mjs --apply "--plan=$Plan" "--max-files=$MaxFiles"
    if ($LASTEXITCODE -ne 0) { throw "Upload stopped. Existing recordings and uploaded objects remain." }
} finally {
    Remove-Item Env:BLOB_READ_WRITE_TOKEN -ErrorAction SilentlyContinue
    if ($pointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer) }
    $secret.Dispose()
}
