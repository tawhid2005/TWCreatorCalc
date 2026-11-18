param([switch]$Expand)

$ErrorActionPreference = 'Stop'
$seeds = [ordered]@{
    'youtube money calculator' = @('/', 'Tool')
    'youtube category finder' = @('/youtube-tools', 'Tool')
    'youtube tag extractor' = @('/youtube-tools', 'Tool')
    'youtube sponsorship rate calculator' = @('/sponsorship', 'Commercial')
    's corp vs llc tax calculator' = @('/tax', 'Tool')
    'youtube channel valuation calculator' = @('/growth', 'Commercial')
    'youtube monetization requirements' = @('/growth', 'Informational')
    'youtube shorts revenue calculator' = @('/analytics', 'Tool')
    'youtube rpm by niche' = @('/benchmarks', 'Informational')
    'how to negotiate youtube sponsorships' = @('/academy', 'Problem-Solving')
    'youtube rpm calculator' = @('/youtube-rpm-calculator', 'Tool')
}

$results = foreach ($seed in $seeds.Keys) {
    $queries = @($seed)
    if ($Expand) {
        $queries += 97..122 | ForEach-Object { "$seed $([char]$_)" }
        $queries += @("how to $seed", "best $seed", "$seed vs", "$seed alternative", "free $seed", "fix $seed error")
    }
    foreach ($query in $queries) {
        $encoded = [uri]::EscapeDataString($query)
        $body = curl.exe --fail --silent --show-error --max-time 8 "https://suggestqueries.google.com/complete/search?client=firefox&hl=en&q=$encoded" 2>$null
        $success = $LASTEXITCODE -eq 0
        $suggestions = if ($success) { @(($body | ConvertFrom-Json)[1]) }
        $route, $intent = $seeds[$seed]
        [ordered]@{
            seed = $seed
            query = $query
            route = $route
            success = $success
            suggestions = @($suggestions | Where-Object { $_ } | ForEach-Object {
                $keywordIntent = if ($_ -match 'not working|error|fix|missing') { 'Problem-Solving' }
                    elseif ($_ -match '\b(?:how|what|why|when|requirements)\b') { 'Informational' }
                    elseif ($_ -match '\b(?:best|vs|alternative|rate card)\b') { 'Commercial' }
                    elseif ($_ -match '\b(?:buy|hire)\b') { 'Transactional' }
                    else { $intent }
                $bucket = if ($route -eq '/youtube-rpm-calculator') { 'C' }
                    elseif ($keywordIntent -in @('Informational', 'Problem-Solving')) { 'B' }
                    else { 'A' }
                [ordered]@{ keyword = $_; intent = $keywordIntent; bucket = $bucket }
            })
        }
    }
}
[ordered]@{
    source = 'Google Autocomplete, English, request location'
    capturedAt = [DateTime]::UtcNow.ToString('o')
    expanded = [bool]$Expand
    queries = @($results)
} | ConvertTo-Json -Depth 8 | Set-Content (Join-Path $PSScriptRoot '02_master_keyword_universe.json') -Encoding UTF8
