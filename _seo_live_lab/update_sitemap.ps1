param([string]$LastModified)

$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot
$origin = 'https://www.twcreatorcalc.xyz'
$sitemapPath = Join-Path $root 'sitemap.xml'
if ($LastModified -and $LastModified -notmatch '^\d{4}-\d{2}-\d{2}$') {
    throw 'LastModified must use YYYY-MM-DD.'
}

$dates = @{}
if (Test-Path $sitemapPath) {
    [xml]$previous = Get-Content -Raw -LiteralPath $sitemapPath
    foreach ($entry in $previous.urlset.url) { $dates[[string]$entry.loc] = [string]$entry.lastmod }
}

$settings = [System.Xml.XmlWriterSettings]::new()
$settings.Indent = $true
$settings.Encoding = [Text.UTF8Encoding]::new($false)
$buffer = [IO.MemoryStream]::new()
$writer = [Xml.XmlWriter]::Create($buffer, $settings)
$writer.WriteStartDocument()
$writer.WriteStartElement('urlset', 'http://www.sitemaps.org/schemas/sitemap/0.9')
try {
    foreach ($page in Get-ChildItem -LiteralPath $root -Filter '*.html' -File) {
        $html = [IO.File]::ReadAllText($page.FullName)
        $canonical = [regex]::Match($html, '<link rel="canonical" href="([^"]+)"').Groups[1].Value
        if (!$canonical -or $html -match '<meta name="robots" content="[^"]*\bnoindex\b') { continue }
        if (!$canonical.StartsWith($origin + '/')) { throw "Unexpected canonical in $($page.Name)" }
        $writer.WriteStartElement('url')
        $writer.WriteElementString('loc', $canonical)
        $date = if ($LastModified) { $LastModified } else { $dates[$canonical] }
        if ($date) { $writer.WriteElementString('lastmod', $date) }
        $writer.WriteEndElement()
    }
    $writer.WriteEndDocument()
} finally {
    $writer.Dispose()
}
[IO.File]::WriteAllBytes($sitemapPath, $buffer.ToArray())
$buffer.Dispose()
