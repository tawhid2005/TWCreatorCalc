param(
    [string]$BaseUrl,
    [string]$Output = '04_verification_report.json',
    [switch]$Verify,
    [switch]$Baseline
)

$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot
$origin = 'https://www.twcreatorcalc.xyz'
$routes = [ordered]@{
    '/' = 'index.html'
    '/youtube-tools' = 'youtube-tools.html'
    '/sponsorship' = 'sponsorship.html'
    '/tax' = 'tax.html'
    '/growth' = 'growth.html'
    '/analytics' = 'analytics.html'
    '/academy' = 'academy.html'
    '/benchmarks' = 'benchmarks.html'
}
if (!$Baseline -and (Test-Path (Join-Path $root 'youtube-rpm-calculator.html'))) {
    $routes['/youtube-rpm-calculator'] = 'youtube-rpm-calculator.html'
}

function Read-Page($Path, $File) {
    if ($BaseUrl) {
        $response = Invoke-WebRequest -UseBasicParsing -Uri ($BaseUrl.TrimEnd('/') + $Path) -TimeoutSec 20
        return [Text.Encoding]::UTF8.GetString($response.RawContentStream.ToArray())
    }
    return [IO.File]::ReadAllText((Join-Path $root $File))
}

function Get-Text($Html) {
    [System.Net.WebUtility]::HtmlDecode(([regex]::Replace($Html, '(?s)<[^>]+>', ' '))) -replace '\s+', ' '
}

function Get-Match($Html, $Pattern) {
    [System.Net.WebUtility]::HtmlDecode([regex]::Match($Html, $Pattern).Groups[1].Value)
}

[xml]$sitemap = Read-Page '/sitemap.xml' 'sitemap.xml'
$locations = @($sitemap.DocumentElement.ChildNodes | Where-Object LocalName -eq 'url' | ForEach-Object { [string]$_.loc })
$robots = Read-Page '/robots.txt' 'robots.txt'
$pages = foreach ($path in $routes.Keys) {
    $html = Read-Page $path $routes[$path]
    $main = [regex]::Match($html, '(?is)<main\b[^>]*>(.*?)</main>').Groups[1].Value
    $panes = [regex]::Matches($main, '(?is)<div id="view-[^"]+" class="suite-view-pane[^"]*"')
    for ($i = $panes.Count - 1; $i -ge 0; $i--) {
        if ($panes[$i].Value -match '\bhidden\b') {
            $end = if ($i + 1 -eq $panes.Count) { $main.Length } else { $panes[$i + 1].Index }
            $main = $main.Remove($panes[$i].Index, $end - $panes[$i].Index)
        }
    }
    $main = [regex]::Replace($main, '(?is)<!--.*?-->|<(script|style)\b[^>]*>.*?</\1>', '')
    $headings = @([regex]::Matches($main, '(?is)<h([1-6])\b[^>]*>(.*?)</h\1>') | ForEach-Object {
        @{ level = [int]$_.Groups[1].Value; text = (Get-Text $_.Groups[2].Value).Trim() }
    })
    $meta = [ordered]@{}
    foreach ($tag in [regex]::Matches($html, '<meta\s+(?:name|property)="((?:og:|twitter:)[^"]+|description|robots)"\s+content="([^"]*)"')) {
        $meta[$tag.Groups[1].Value] = [System.Net.WebUtility]::HtmlDecode($tag.Groups[2].Value)
    }
    $title = Get-Match $html '(?is)<title>(.*?)</title>'
    $canonical = Get-Match $html '<link rel="canonical" href="([^"]+)"'
    $schema = @()
    $issues = [Collections.Generic.List[string]]::new()
    foreach ($block in [regex]::Matches($html, '(?is)<script type="application/ld\+json"[^>]*>(.*?)</script>')) {
        try { $schema += $block.Groups[1].Value | ConvertFrom-Json }
        catch { $issues.Add('Invalid JSON-LD') }
    }
    $links = @([regex]::Matches($html, '<a\b[^>]*href="(/[^"#?]*)[^"]*"') | ForEach-Object { $_.Groups[1].Value })
    $broken = @($links | Where-Object {
        $_ -notin $routes.Keys -and $_ -ne '/seo-hub' -and -not (Test-Path -LiteralPath (Join-Path $root $_.TrimStart('/')) -PathType Leaf)
    } | Sort-Object -Unique)
    $images = [regex]::Matches($html, '<img\b[^>]*>')
    $missingAlt = @($images | Where-Object Value -NotMatch '\balt="[^"]*"').Count
    $h1Count = @($headings | Where-Object level -eq 1).Count
    if ($h1Count -ne 1) { $issues.Add('Expected one H1 in the active page') }
    if (!$title -or !$meta.description) { $issues.Add('Missing title or description') }
    if ($canonical -ne "$origin$path" -or $meta['og:url'] -ne $canonical) { $issues.Add('Canonical or Open Graph URL mismatch') }
    if ($meta.robots -match '\bnoindex\b') { $issues.Add('Page has noindex') }
    if ($title -ne $meta['og:title'] -or $title -ne $meta['twitter:title'] -or
        $meta.description -ne $meta['og:description'] -or $meta.description -ne $meta['twitter:description']) {
        $issues.Add('Social and search metadata differ')
    }
    if (!$schema.Count) { $issues.Add('Missing JSON-LD') }
    if ($missingAlt) { $issues.Add("$missingAlt image tags missing alt") }
    if ($broken.Count) { $issues.Add("Broken internal links: $($broken -join ', ')") }
    if ($canonical -notin $locations) { $issues.Add('Missing from sitemap') }
    $scorecard = [ordered]@{
        titlePresent = [bool]$title
        descriptionPresent = [bool]$meta.description
        oneActiveH1 = $h1Count -eq 1
        canonicalMatchesServingHost = $canonical -eq "$origin$path" -and $meta['og:url'] -eq $canonical
        socialCopyMatches = $title -eq $meta['og:title'] -and $title -eq $meta['twitter:title'] -and
            $meta.description -eq $meta['og:description'] -and $meta.description -eq $meta['twitter:description']
        socialImagesPresent = [bool]($meta['og:image'] -and $meta['twitter:image'] -and $meta['twitter:card'])
        jsonLdPresentAndParseable = $schema.Count -gt 0 -and 'Invalid JSON-LD' -notin $issues
        noBrokenRootRelativeLinks = $broken.Count -eq 0
        imageAltAttributesPresent = $missingAlt -eq 0
        canonicalInSitemapAndIndexable = $canonical -in $locations -and $meta.robots -notmatch '\bnoindex\b'
    }
    $score = 10 * @($scorecard.Values | Where-Object { $_ }).Count
    if ($score -lt 100) { $issues.Add("Technical scorecard: $score / 100") }
    [ordered]@{
        route = $path; title = $title; canonical = $canonical; meta = $meta; headings = $headings
        activeMainWords = [regex]::Matches((Get-Text $main), '\b[\p{L}\p{N}]+\b').Count
        internalLinkCount = $links.Count; imageCount = $images.Count; imagesMissingAlt = $missingAlt
        schema = $schema; technicalScore = $score; scorecard = $scorecard; issues = @($issues.ToArray())
    }
}
$siteIssues = @()
if ($locations.Count -ne $routes.Count -or @($locations | Sort-Object -Unique).Count -ne $locations.Count) {
    $siteIssues += 'Sitemap route count mismatch or duplicate locations'
}
if ($robots -notmatch '(?m)^Sitemap:\s+https://www\.twcreatorcalc\.xyz/sitemap\.xml\s*$') {
    $siteIssues += 'Missing robots.txt sitemap directive'
}
if (@($pages.title | Sort-Object -Unique).Count -ne $routes.Count) { $siteIssues += 'Duplicate page titles' }
[ordered]@{
    source = if ($BaseUrl) { $BaseUrl } else { 'Local HTML source' }
    scoreScope = 'Ten equally weighted markup checks. This is not a ranking, CTR, or content-quality score.'
    scope = 'Eight application routes and any RPM calculator route; verification token and alias are excluded from indexing'
    audience = 'YouTube creators researching revenue, sponsorships, public video metadata, growth and US creator taxes'
    seedTopics = @('YouTube money calculator', 'YouTube category finder', 'YouTube sponsorship rate', 'Shorts RPM', 'YouTube monetization requirements')
    siteIssues = $siteIssues; pages = @($pages)
} | ConvertTo-Json -Depth 30 | Set-Content (Join-Path $PSScriptRoot $Output) -Encoding UTF8
$pages | ForEach-Object { Write-Host "$($_.route)  $($_.activeMainWords) words  $($_.issues -join '; ')" }
if ($Verify -and ($siteIssues.Count -or @($pages | Where-Object { $_.issues.Count }).Count)) { exit 1 }
