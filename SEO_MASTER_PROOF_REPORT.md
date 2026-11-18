# TWCreatorCalc SEO experiment report

**Date** November 18, 2026

**Production baseline** https://www.twcreatorcalc.xyz

**Change verification** Local static HTTP serving and headless Chrome

## Production observations

- The apex host redirected to `www`. The eight existing clean routes returned HTTP 200 after the redirect. Their HTML canonicals and sitemap still pointed to the apex host.
- The old `/seo-hub` URL returned HTTP 404. The update sends that URL to `/benchmarks` with a permanent redirect and lets Vercel handle extensionless HTML routes through `cleanUrls`. [Vercel configuration reference](https://vercel.com/docs/project-configuration)
- Several browser route titles diverged from the HTML metadata. The desktop navigation also used a different class from the click handler. The updated HTML exposes ordinary navigation links with an in-app handler, and the active heading, title, description, canonical and social metadata move together.
- Replaced unsupported aggregate-rating markup and removed FAQ rich-result markup. The on-page answers are visible in HTML. Google retired the FAQ search feature in May 2026. [Google Search documentation updates](https://developers.google.com/search/updates?product=crm)

## Search discovery and page mapping

Google Autocomplete returned responses for 363 of 363 English-language requests across 11 seeds. The sample includes 495 distinct suggestions. The requested seed, intent category, target route and A/B/C bucket are recorded per observation. The sample reflects the request context and time, and contains no search-volume or ranking data.

| Sample intent | Page and implementation |
| --- | --- |
| YouTube money calculator by views and earnings per view | The homepage addresses earnings from views and links to a user-input RPM calculation. |
| YouTube video category finder and tag extractor | The inspector explains the available category, tag and thumbnail results, and the scope of its metadata score. |
| How much should I charge for a YouTube sponsorship? | The sponsorship page explains the placement CPM calculation and charges for usage and exclusivity. The academy explains what to ask a brand before quoting. |
| S corp vs LLC tax savings calculator | The US calculator describes the scenarios and links to current IRS compensation rules. |
| YouTube channel value calculator and YouTube monetization requirements | The growth page describes valuation inputs and corrects the watch-hours control for the current YPP ad-revenue path. |
| YouTube Shorts earnings calculator and YouTube RPM by niche | The analytics page compares formats using explicit RPM examples. Benchmarks explain the difference between a CPM assumption and a channel's Studio RPM. |
| YouTube RPM calculator | The new route calculates RPM from revenue, forecasts revenue from views, and rounds up the views required for a revenue goal. |

Search-result samples were followed by direct requests to the source pages. The experiment retrieved 28 of 30 sampled URLs across six clusters. One fetch returned HTTP 308 and one returned HTTP 403. The competitor artifact records response status, titles, descriptions, H1–H3, visible-text proxies, frequent terms, interactive elements and JSON-LD from the returned HTML. Search result order is provider-dependent.

- [TappyTools](https://tappytools.com/youtube-money-calculator/) and [VISU](https://www.visu.network/tools/youtube-money-calculator/) explain how to move from views and RPM to earnings. TWCreatorCalc now includes a separate three-way calculator with an explicit rounding rule and zero-RPM handling.
- [TubeKit](https://tubekit.app/youtube-video-category-checker) and [YTKits](https://www.ytkits.com/data/) group category, tags and other available data around a public video URL. TWCreatorCalc now describes the same task clearly in its heading and metadata and explains missing results.
- [Ames Create](https://amescreate.com/tools/sponsorship-rate-calculator/youtube) and [yt.tools](https://yt.tools/youtube-money-calculator) serve sponsorship pricing intent. TWCreatorCalc adds a worked sponsored-placement quote and links it to negotiation guidance.

The page questions draw on the saved suggestions and observed search intent. People Also Ask placement and exact Google top-five positions were not verified. The competitor HTML sample for earnings had 786–3,668 words under the recorded method. Differences in markup and rendering limit cross-site word comparisons.

## Before and after

The word-count column uses source text from the active main pane. Other suite panes are excluded. The previous whole-document audit counted all suites on each URL.

| Route | Active main words before | Active main words after | Local technical score |
| --- | ---: | ---: | ---: |
| `/` | 1,188 | 1,238 | 100/100 |
| `/youtube-tools` | 946 | 985 | 100/100 |
| `/sponsorship` | 892 | 948 | 100/100 |
| `/tax` | 1,022 | 1,089 | 100/100 |
| `/growth` | 662 | 740 | 100/100 |
| `/analytics` | 508 | 577 | 100/100 |
| `/academy` | 1,109 | 1,159 | 100/100 |
| `/benchmarks` | 616 | 672 | 100/100 |
| `/youtube-rpm-calculator` | New | 279 | 100/100 |

The technical score gives 10 points each for a title, a description, one active H1, the serving-host canonical, matching social copy, social images and card, parseable JSON-LD, valid root-relative page links, image alt attributes and sitemap membership without `noindex`. The local Chrome test checks actual page loading, rendered metadata, clean URL redirects, navigation, RPM arithmetic, the 4,000-hour boundary and the RPM layout at a 390 px viewport. The static site has no package build step.

Current YPP ad eligibility is checked against YouTube's own documentation. The control measures progress on the watch-hour requirement, with subscriber count, the Shorts path and channel review explained separately. The RPM calculator uses creator RPM after the platform share. [YouTube Partner Program eligibility](https://support.google.com/youtube/answer/72851), [YouTube RPM documentation](https://support.google.com/youtube/answer/9314357)

The generated sitemap lists all nine canonical pages with modification dates. The generator can preserve previous dates on later runs. An IndexNow dry run lists the canonical URLs. Its submission mode checks the hosted key and live page canonicals. [Google sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap), [IndexNow documentation](https://www.indexnow.org/documentation)

## Evidence and repeatable checks

- [Original local source audit](_seo_live_lab/01_current_site_audit.json)
- [Production baseline](_seo_live_lab/01_production_before.json)
- [Google Autocomplete observations](_seo_live_lab/02_master_keyword_universe.json)
- [Public competitor HTML sample](_seo_live_lab/03_competitor_blueprint.json)
- [Final markup checks](_seo_live_lab/04_verification_report.json)
- [Headless Chrome results](_seo_live_lab/05_rendered_verification.json)

```powershell
powershell.exe -NoProfile -File _seo_live_lab/audit.ps1 -Verify
node _seo_live_lab/verify_rendered.mjs
node _seo_live_lab/indexnow.mjs
```

The updates are in the working tree. Production deployment, IndexNow submission, Google indexing, field Core Web Vitals, search positions and CTR remain unverified.
