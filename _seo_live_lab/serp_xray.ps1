$ErrorActionPreference = 'Stop'
$clusters = [ordered]@{
    'YouTube money calculator' = @(
        'https://tappytools.com/youtube-money-calculator/',
        'https://yt.tools/youtube-money-calculator',
        'https://creatoranalytics.com/youtube-money-calculator/?v=25',
        'https://outfeed.ai/tools/youtube-money-calculator/',
        'https://www.visu.network/tools/youtube-money-calculator/'
    )
    'YouTube category finder and tag extractor' = @(
        'https://www.ytkits.com/data/',
        'https://tubekit.app/youtube-video-category-checker',
        'https://yt.tools/youtube-tag-extractor',
        'https://rapidtag.app/extractor',
        'https://www.ytseohub.com/keyword/tag-extractor'
    )
    'YouTube revenue, RPM and sponsorship' = @(
        'https://hkdatalab.com/tools/en/youtube-calculator',
        'https://doany.ai/tools/youtube-money-calculator',
        'https://tubeanalytics.net/tools/youtube-revenue-calculator',
        'https://www.sonuker.com/tools/free-youtube-shorts-money-calculator',
        'https://leaxor.com/tools/youtube-revenue-calculator'
    )
    'YouTube sponsorship rates and negotiation' = @(
        'https://amescreate.com/tools/sponsorship-rate-calculator/youtube',
        'https://medialist.com/article/104/youtube-sponsorship-calculator',
        'https://yt.tools/youtube-money-calculator',
        'https://hkdatalab.com/tools/en/youtube-calculator',
        'https://support.google.com/youtube/answer/9385307?hl=en'
    )
    'YouTube channel valuation and monetization requirements' = @(
        'https://landing.flippa.com/youtube-channel-worth-calculator/',
        'https://tubemind.io/tools/youtube-channel-valuation',
        'https://playersells.com/tools/youtube-channel-value',
        'https://support.google.com/youtube/answer/72851',
        'https://support.google.com/youtube/answer/94522?hl=en-GB'
    )
    'US S corporation vs LLC tax calculator' = @(
        'https://gusto.com/resources/calculators/business/s-corp-tax-savings-calculator',
        'https://www.collective.com/free-tools/s-corp-vs-llc-calculator',
        'https://llcstanding.com/tools/s-corp-tax-calculator/',
        'https://www.oicpa.com/tools/s-corp-tax-savings/',
        'https://www.imaarassociates.com/tools/s-corp-savings-calculator/'
    )
}
function PageText([string]$Html) {
    ([Net.WebUtility]::HtmlDecode([regex]::Replace($Html, '(?s)<[^>]+>', ' ')) -replace '\s+', ' ').Trim()
}
$observations = foreach ($cluster in $clusters.Keys) {
    $pages = foreach ($url in $clusters[$cluster]) {
        try {
            $response = Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 12 -MaximumRedirection 5
            $html = [Text.Encoding]::UTF8.GetString($response.RawContentStream.ToArray())
            $body = [regex]::Replace($html, '(?is)<!--.*?-->|<(script|style|svg|template)\b[^>]*>.*?</\1>', ' ')
            $content = [regex]::Match($body, '(?is)<main\b[^>]*>(.*?)</main>').Groups[1].Value
            if (!$content) { $content = $body }
            $title = PageText ([regex]::Match($html, '(?is)<title\b[^>]*>(.*?)</title>').Groups[1].Value)
            $descriptionTag = [regex]::Match($html, '(?is)<meta\b(?=[^>]*\bname\s*=\s*(?:"description"|''description''|description\b))[^>]+>').Value
            $description = [Net.WebUtility]::HtmlDecode([regex]::Match($descriptionTag, '(?is)\bcontent\s*=\s*(["''])(.*?)\1').Groups[2].Value)
            $tokens = [regex]::Matches((PageText $content).ToLowerInvariant(), '\b[a-z][a-z-]{2,}\b')
            $terms = $tokens.Value | Where-Object { $_ -notmatch '^(?:the|and|for|you|your|are|with|from|how|can|this|that|what|have|into|will|use|any|each|more|than|when|our|their|not|was|were|they|which|all|out|used|about|get|does|these|also)$' }
            [ordered]@{
                url = $url; status = $response.StatusCode
                title = $title; titleCharacters = $title.Length
                description = $description; descriptionCharacters = $description.Length
                headings = @([regex]::Matches($content, '(?is)<h([1-3])\b[^>]*>(.*?)</h\1>') | ForEach-Object {
                    [ordered]@{ level = [int]$_.Groups[1].Value; text = PageText $_.Groups[2].Value }
                })
                wordScope = if ($content -eq $body) { 'HTML document text' } else { 'Main HTML text' }
                words = [regex]::Matches((PageText $content), '\b[\p{L}\p{N}]+\b').Count
                frequentTerms = @($terms | Group-Object | Sort-Object Count -Descending | Select-Object -First 40 Name,Count)
                tables = [regex]::Matches($content, '(?i)<table\b').Count
                lists = [regex]::Matches($content, '(?i)<(?:ul|ol)\b').Count
                inputs = [regex]::Matches($content, '(?i)<input\b').Count
                jsonLd = @([regex]::Matches($html, '(?is)<script\b[^>]*type=["'']application/ld\+json["''][^>]*>(.*?)</script>') | ForEach-Object { $_.Groups[1].Value.Trim() })
            }
        } catch {
            [ordered]@{ url = $url; error = $_.Exception.Message }
        }
    }
    [ordered]@{ cluster = $cluster; pages = @($pages) }
}
[ordered]@{
    capturedAt = [DateTime]::UtcNow.ToString('o')
    source = 'Public live web search result samples, followed by direct HTTP HTML fetch. Ordering is not a verified Google rank.'
    observations = @($observations)
} | ConvertTo-Json -Depth 15 | Set-Content (Join-Path $PSScriptRoot '03_competitor_blueprint.json') -Encoding UTF8
