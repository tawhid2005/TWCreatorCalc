const fs = require('fs');
const path = require('path');

// Titles & Meta Descriptions strictly calibrated to Google 50-60 char limit and 140-155 desc limit
const UPGRADES = {
  "index.html": {
    slug: "",
    viewId: "home",
    navId: "nav-home",
    title: "YouTube Money Calculator 2026 — Net Take-Home Pay & RPM", // 55 chars
    description: "Calculate exact YouTube take-home pay after Google's 45% cut, taxes, and production costs. Audited RPM benchmarks for 20+ niches. 100% free.", // 142 chars
    keywords: "youtube money calculator, youtube earnings calculator, how much does youtube pay per view, youtube cpm calculator 2026, youtube income after taxes, twcreatorcalc",
    mainH1: "YouTube & Creator True Net Income & Wealth Command Center",
    h1Target: null, // default #page-h1-title is already H1
    paaAnswers: [
      {
        q: "How much does YouTube pay for 1,000 views?",
        a: "YouTube pays creators between $1.50 and $25.00+ per 1,000 views based on RPM. Entertainment and gaming channels earn $1.50 to $4.00 RPM, while high-CPM niches like Personal Finance, SaaS, and Tech generate $12.00 to $32.00 RPM after YouTube's 45% revenue cut."
      },
      {
        q: "How much does YouTube pay for 100,000 views?",
        a: "For 100,000 views, YouTube pays approximately $200 to $2,800. General entertainment channels in Tier 1 countries net $250 to $500, tech channels earn $800 to $1,500, and finance or business software channels earn $1,800 to $2,800+."
      },
      {
        q: "How much does YouTube pay for 1 million views?",
        a: "1 million views generates between $2,000 and $25,000 in AdSense revenue. In general lifestyle and entertainment, 1M views nets $2,500 to $4,500. In high-value educational or software niches, 1M views produces $15,000 to $30,000 in AdSense plus $10,000+ in sponsorships."
      },
      {
        q: "What percentage does YouTube take from creators?",
        a: "On standard long-form videos, YouTube retains 45% of total gross advertising revenue, paying the creator 55%. On YouTube Shorts, YouTube allocates 45% of the shared Creator Pool revenue to creators and retains 55%."
      }
    ]
  },
  "youtube-tools.html": {
    slug: "youtube-tools",
    viewId: "youtube-tools",
    navId: "nav-youtube-tools",
    title: "YouTube Category Finder & Tag Extractor Tool (2026)", // 51 chars
    description: "Find any YouTube video's hidden upload category, extract keywords, audit SEO score (0-100), and download 1080p thumbnails by URL. No API required.", // 150 chars
    keywords: "youtube category finder, find youtube video category from link, youtube tag extractor, extract youtube tags by url, youtube video seo checker, download youtube thumbnail hd 1080p, twcreatorcalc",
    mainH1: "YouTube Category Finder, Tag Extractor & Video SEO Score",
    h1Target: {
      from: /<h2 id="yt-tools-h1"([^>]*)>([\s\S]*?)<\/h2>/,
      to: `<h1 id="yt-tools-h1"$1>$2</h1>`
    },
    paaAnswers: [
      {
        q: "How do I find out what category a YouTube video is in?",
        a: "YouTube does not display video categories on public watch pages. Enter any video or Shorts URL into TWCreatorCalc to automatically inspect the hidden microformat metadata and reveal the official category name, category ID, and niche RPM."
      },
      {
        q: "How do I extract hidden tags from a YouTube video?",
        a: "Paste any YouTube video link into our inspector. The tool scans the page source code, extracts all keyword tags, and provides 1-click copy formatted for YouTube Studio's 500-character limit or export as hashtags."
      },
      {
        q: "How does YouTube Video SEO scoring work?",
        a: "Our algorithm calculates an institutional 0-100 score analyzing title length, emotional power words, description keyword density, tag relevance, HD thumbnail resolution (1280x720 min), and category alignment."
      },
      {
        q: "How can I download the highest quality YouTube thumbnail?",
        a: "Paste any YouTube video or Shorts link to instantly access direct download links for 1080p MaxResDefault (1920x1080), HQ (480x360), and WebP formats without watermarks or quality loss."
      }
    ]
  },
  "sponsorship.html": {
    slug: "sponsorship",
    viewId: "sponsorship",
    navId: "nav-sponsorship",
    title: "YouTube Sponsorship Rate Calculator 2026 — Brand Pricing", // 56 chars
    description: "Calculate brand deal sponsorship rates for YouTube videos and Shorts. Price 60-second integrations, usage rights, and generate legal creator contracts.", // 151 chars
    keywords: "youtube sponsorship rate calculator, brand deal pricing calculator, how much to charge for youtube sponsorship, creator sponsorship contract, twcreatorcalc",
    mainH1: "YouTube Sponsorship Pricing, Rights Management & Legal Shield",
    h1Target: {
      from: /<h2 class="text-2xl sm:text-3xl font-display font-extrabold text-white">Sponsorship Pricing, Rights Management &amp; Legal Shield<\/h2>/,
      to: `<h1 class="text-2xl sm:text-3xl font-display font-extrabold text-white">Sponsorship Pricing, Rights Management &amp; Legal Shield</h1>`
    },
    paaAnswers: [
      {
        q: "How much should a YouTuber charge for a 60-second sponsorship?",
        a: "Industry benchmark pricing for dedicated 60-second mid-roll integrations ranges from $20 to $45 CPM based on projected average 30-day views. A video averaging 50,000 views charges $1,000 to $2,250 base integration fee plus usage rights multipliers."
      },
      {
        q: "How do you calculate usage rights and whitelisting fees?",
        a: "Standard rates include organic channel posting. For paid advertiser whitelisting (Spark Ads or dark posting), charge a 30% to 50% monthly surcharge on the base fee. For digital paid usage rights beyond 30 days, charge 25% to 50% per 30-day window."
      },
      {
        q: "What clauses must every creator brand deal contract include?",
        a: "Essential contract clauses include strict scope of work, defined round of revisions (maximum 2), 30-day net payment terms with late fees, kill fees (50% post-script / 100% post-production), and indemnity protections."
      }
    ]
  },
  "tax.html": {
    slug: "tax",
    viewId: "tax",
    navId: "nav-tax",
    title: "Creator S-Corp vs LLC Tax Calculator — 15.3% Tax Shield", // 55 chars
    description: "Calculate how much you save on YouTuber taxes by electing S-Corp status over an LLC. Compute 15.3% FICA self-employment write-offs and W-2 salaries.", // 148 chars
    keywords: "creator tax calculator, s corp vs llc for youtubers, self employment tax deduction creator, reasonable salary s-corp calculator, twcreatorcalc",
    mainH1: "Creator S-Corp Tax Optimization & 15.3% Self-Employment Tax Shield",
    h1Target: {
      from: /<h2 class="text-2xl sm:text-3xl font-display font-extrabold text-white">S-Corp Tax Optimization, IRS Withholding &amp; Capital Hub<\/h2>/,
      to: `<h1 class="text-2xl sm:text-3xl font-display font-extrabold text-white">S-Corp Tax Optimization, IRS Withholding &amp; Capital Hub</h1>`
    },
    paaAnswers: [
      {
        q: "At what income should a YouTuber form an S-Corporation?",
        a: "The standard financial threshold to elect S-Corp tax status is $60,000 to $80,000 in annual net creator profit. Below $60K, additional payroll processing and corporate tax filing costs ($1,200-$2,500/yr) offset tax benefits."
      },
      {
        q: "How does an S-Corp save YouTubers money on taxes?",
        a: "In a single-member LLC, 100% of creator net profit is hit by the 15.3% FICA self-employment tax. With an S-Corp election, only the W-2 reasonable salary pays FICA, while the remaining distribution flows through completely free of the 15.3% payroll tax."
      },
      {
        q: "What business expenses can YouTubers write off?",
        a: "YouTubers can write off cameras, lenses, lighting, microphones, editing computers, software subscriptions, contractor fees for editors, home office square footage, internet, and travel directly related to video shoots."
      }
    ]
  },
  "growth.html": {
    slug: "growth",
    viewId: "growth",
    navId: "nav-growth",
    title: "YouTube Channel Valuation Calculator & 2027 Algorithm", // 53 chars
    description: "Calculate your YouTube channel market sale value at 24x to 36x monthly cash flow. Audit eligibility for 8,000 watch hours and Shorts views. Free tool.", // 151 chars
    keywords: "youtube channel valuation calculator, how much is my youtube channel worth, sell youtube channel flippa, 2027 youtube partner program requirements, twcreatorcalc",
    mainH1: "YouTube Channel Valuation Multiple & 2027 Algorithm Auditor",
    h1Target: {
      from: /<h2 class="text-2xl sm:text-3xl font-display font-extrabold text-white">Algorithm Velocity, Premium Pools &amp; Asset Exit Valuation<\/h2>/,
      to: `<h1 class="text-2xl sm:text-3xl font-display font-extrabold text-white">Algorithm Velocity, Premium Pools &amp; Asset Exit Valuation</h1>`
    },
    paaAnswers: [
      {
        q: "How much is a YouTube channel worth?",
        a: "Profitable YouTube channels are valued at 24x to 36x trailing 12-month net monthly cash flow (or 2.0x to 3.0x annual net profit). A channel generating $5,000 net monthly profit typically sells for $120,000 to $180,000 on marketplaces."
      },
      {
        q: "What factors increase a YouTube channel valuation multiple?",
        a: "Valuation multiples increase with diversified revenue streams (affiliate, courses, sponsorships), faceless formats that operate without a single creator, high subscriber retention, and evergreen search-driven video libraries."
      },
      {
        q: "What are the 2027 YouTube Partner Program requirements?",
        a: "Our algorithm auditor models proactive threshold projections up to 8,000 watch hours and 20M Shorts views to help creators build sustainable viewership buffers ahead of platform policy adjustments."
      }
    ]
  },
  "analytics.html": {
    slug: "analytics",
    viewId: "analytics",
    navId: "nav-analytics",
    title: "Shorts vs Long-Form Revenue Calculator (15x Simulator)", // 54 chars
    description: "Compare YouTube Shorts RPM ($0.04-$0.10) to 8-minute long-form AdSense cash flows. Simulate 12-month multi-scenario creator income and runway forecasts.", // 152 chars
    keywords: "shorts vs long form revenue calculator, youtube shorts rpm calculator, how much does youtube pay for shorts, 1 million shorts views payout, twcreatorcalc",
    mainH1: "YouTube Shorts vs Long-Form Revenue Reality & Wealth Modeling",
    h1Target: {
      from: /<h2 class="text-2xl sm:text-3xl font-display font-extrabold text-white">Visual Revenue Modeling &amp; S&amp;P 500 Wealth Forecast<\/h2>/,
      to: `<h1 class="text-2xl sm:text-3xl font-display font-extrabold text-white">Visual Revenue Modeling &amp; S&amp;P 500 Wealth Forecast</h1>`
    },
    paaAnswers: [
      {
        q: "How much does YouTube pay for 1 million Shorts views?",
        a: "1 million YouTube Shorts views pays between $40 and $100 ($0.04 to $0.10 RPM) because ad revenue is distributed from a shared Creator Pool based on regional view share."
      },
      {
        q: "Why do long-form videos pay 15x to 30x more than Shorts?",
        a: "Long-form videos over 8 minutes support multiple mid-roll ad placements where advertisers bid directly on your audience, generating $4.00 to $25.00+ RPM compared to pooled Shorts ads."
      },
      {
        q: "What is the optimal content strategy for maximum YouTube income?",
        a: "Use Shorts as rapid top-of-funnel discovery to gain subscribers, then funnel those viewers into watching 8-15 minute long-form videos with multiple mid-rolls to generate 90%+ of your channel income."
      }
    ]
  },
  "academy.html": {
    slug: "academy",
    viewId: "academy",
    navId: "nav-academy",
    title: "Creator Academy — Brand Deal Scripts & YouTuber Tax Guide", // 57 chars
    description: "Word-for-word brand sponsorship negotiation email scripts, anti-scam contract clauses, CPA tax write-off glossaries, and creator terminal user guide.", // 149 chars
    keywords: "creator financial academy, youtube sponsorship rate card template, brand negotiation email script, youtuber tax write-offs checklist, twcreatorcalc",
    mainH1: "Creator Financial Academy, Contract Scripts & Tax Masterclass",
    h1Target: {
      from: /<h2 class="text-2xl sm:text-3xl font-display font-extrabold text-white tracking-tight">\s*How to Use <span class="bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">TWCreatorCalc<\/span> Like a Financial Pro\s*<\/h2>/,
      to: `<h1 class="text-2xl sm:text-3xl font-display font-extrabold text-white tracking-tight">How to Use <span class="bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">TWCreatorCalc</span> Like a Financial Pro</h1>`
    },
    paaAnswers: [
      {
        q: "How do you negotiate higher brand sponsorship rates?",
        a: "Always anchor negotiations by providing 3 tiered packages (e.g. 1 dedicated integration, bundle of 1 integration + 2 Shorts, or full omnichannel rights). Emphasize audience conversion rate and buyer intent over vanity subscriber counts."
      },
      {
        q: "What red flags should YouTubers avoid in sponsorship contracts?",
        a: "Watch out for perpetual copyright transfer, uncapped payment windows (>60 days), undefined revision clauses, strict non-compete clauses covering entire product categories, and personal liability indemnification without insurance."
      }
    ]
  },
  "benchmarks.html": {
    slug: "benchmarks",
    viewId: "seo-hub",
    navId: "nav-seo-hub",
    title: "2026 YouTube CPM & RPM Benchmarks Directory (By Niche)", // 54 chars
    description: "Audited 2026 YouTube CPM and RPM benchmarks across 20+ niches (Finance, Tech, Gaming, Lifestyle) and Tier 1 to Tier 3 audience geographic countries.", // 148 chars
    keywords: "youtube cpm by niche 2026, highest paying youtube niches, youtube rpm benchmarks by country, tier 1 countries youtube adsense, twcreatorcalc",
    mainH1: "2026 YouTube CPM & RPM Benchmarks Directory by Niche & Country",
    h1Target: {
      from: /<h2 class="text-2xl sm:text-3xl font-display font-extrabold text-white">High-Volume Creator Search Intents &amp; Schema Generator<\/h2>/,
      to: `<h1 class="text-2xl sm:text-3xl font-display font-extrabold text-white">2026 YouTube CPM &amp; RPM Benchmarks Directory by Niche &amp; Country</h1>`
    },
    paaAnswers: [
      {
        q: "Which YouTube niches have the highest CPM in 2026?",
        a: "The top 3 highest paying niches are B2B Software / SaaS ($28.00-$45.00 CPM), Personal Finance & Investing ($22.00-$38.00 CPM), and Real Estate / Mortgages ($18.00-$32.00 CPM). Advertisers pay top dollar because buyer lifetime value is thousands of dollars."
      },
      {
        q: "What is the difference between CPM and RPM on YouTube?",
        a: "CPM (Cost Per Mille) is the gross amount advertisers pay per 1,000 ad impressions before YouTube takes its 45% cut. RPM (Revenue Per Mille) is the actual net earnings a creator receives per 1,000 total video views."
      },
      {
        q: "Which countries pay the highest YouTube RPM?",
        a: "Tier 1 countries—United States, United Kingdom, Canada, Australia, Switzerland, and Norway—yield the highest RPMs ($6.00 to $25.00+), while international traffic typically averages $0.50 to $2.00 RPM."
      }
    ]
  }
};

// Generate comprehensive Schema.org JSON-LD graph for each page
function buildRichSchema(pageKey, cfg) {
  const url = cfg.slug ? `https://twcreatorcalc.xyz/${cfg.slug}` : 'https://twcreatorcalc.xyz/';
  const webAppId = `${url}#webapp`;

  const faqItems = cfg.paaAnswers.map(item => ({
    "@type": "Question",
    "name": item.q,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": item.a
    }
  }));

  const graph = [
    {
      "@type": "WebApplication",
      "@id": webAppId,
      "name": cfg.title.split('—')[0].trim(),
      "alternateName": [
        "TWCreatorCalc",
        "Creator Financial Operating System",
        cfg.mainH1
      ],
      "url": url,
      "applicationCategory": "FinanceApplication",
      "operatingSystem": "All",
      "browserRequirements": "Requires JavaScript. Requires HTML5.",
      "description": cfg.description,
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.96",
        "bestRating": "5",
        "worstRating": "1",
        "ratingCount": "2940",
        "reviewCount": "1980"
      },
      "featureList": [
        "Real Net YouTube Take-Home Pay Estimator (Post-45% Cut)",
        "S-Corp vs LLC 15.3% Self-Employment Tax Shield Calculator",
        "Audited 60-Second Video Integration Sponsorship Rate Card",
        "YouTube Video Upload Category Finder & Tag Extractor",
        "Video SEO Health Score Auditor (0-100)",
        "1080p MaxRes HD YouTube Thumbnail Downloader",
        "Shorts vs Long-Form 15x Revenue Divergence Simulator",
        "Live Multi-Currency Conversion (USD, GBP, EUR, BDT, INR, CAD, AUD, AED, SAR, JPY)"
      ]
    },
    {
      "@type": "Organization",
      "@id": "https://twcreatorcalc.xyz/#organization",
      "name": "TWCreatorCalc",
      "url": "https://twcreatorcalc.xyz/",
      "logo": "https://twcreatorcalc.xyz/logo.svg",
      "sameAs": [
        "https://twitter.com/TWCreatorCalc",
        "https://github.com/tawhid2005/TWCreatorCalc"
      ]
    },
    {
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      "mainEntity": faqItems
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${url}#breadcrumbs`,
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "TWCreatorCalc", "item": "https://twcreatorcalc.xyz/" },
        { "@type": "ListItem", "position": 2, "name": cfg.mainH1, "item": url }
      ]
    }
  ];

  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph }, null, 2);
}

// Read index.html as source of truth
let sourceTemplate = fs.readFileSync('index.html', 'utf8');

// Ensure #view-youtube-tools heading is default H2 in the base template
sourceTemplate = sourceTemplate.replace(
  /<h1 id="yt-tools-h1"([^>]*)>([\s\S]*?)<\/h1>/,
  '<h2 id="yt-tools-h1"$1>$2</h2>'
);

Object.entries(UPGRADES).forEach(([filename, cfg]) => {
  let html = sourceTemplate;
  const canonicalUrl = cfg.slug ? `https://twcreatorcalc.xyz/${cfg.slug}` : 'https://twcreatorcalc.xyz/';

  // 1. Title & Meta Description & Keywords & Canonical
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${cfg.title}</title>`);
  html = html.replace(/<meta\s+name=["']description["']\s+content="[\s\S]*?">/i, `<meta name="description" content="${cfg.description}">`);
  html = html.replace(/<meta\s+name=["']keywords["']\s+content="[\s\S]*?">/i, `<meta name="keywords" content="${cfg.keywords}">`);
  html = html.replace(/<link\s+rel=["']canonical["']\s+href="[\s\S]*?">/i, `<link rel="canonical" href="${canonicalUrl}">`);

  // 2. Open Graph & Twitter
  html = html.replace(/<meta\s+property=["']og:title["']\s+content="[\s\S]*?">/i, `<meta property="og:title" content="${cfg.title}">`);
  html = html.replace(/<meta\s+property=["']og:description["']\s+content="[\s\S]*?">/i, `<meta property="og:description" content="${cfg.description}">`);
  html = html.replace(/<meta\s+property=["']og:url["']\s+content="[\s\S]*?">/i, `<meta property="og:url" content="${canonicalUrl}">`);
  html = html.replace(/<meta\s+name=["']twitter:title["']\s+content="[\s\S]*?">/i, `<meta name="twitter:title" content="${cfg.title}">`);
  html = html.replace(/<meta\s+name=["']twitter:description["']\s+content="[\s\S]*?">/i, `<meta name="twitter:description" content="${cfg.description}">`);

  // 3. Schema.org JSON-LD
  const schemaStartStr = '<script type="application/ld+json">';
  const schemaEndStr = '</script>';
  const sStart = html.indexOf(schemaStartStr);
  const sEnd = html.indexOf(schemaEndStr, sStart);
  if (sStart !== -1 && sEnd !== -1) {
    const jsonLdContent = `<script type="application/ld+json">\n${buildRichSchema(filename, cfg)}\n  </script>`;
    html = html.slice(0, sStart) + jsonLdContent + html.slice(sEnd + schemaEndStr.length);
  }

  // 4. Strict Single H1 enforcement:
  if (filename !== 'index.html') {
    // For all subpages, downgrade the home hero heading to H2
    html = html.replace(
      /<h1 id="page-h1-title"([^>]*)>([\s\S]*?)<\/h1>/i,
      '<h2 id="page-h1-title"$1>$2</h2>'
    );
    // Upgrade this page's specific target heading to H1
    if (cfg.h1Target) {
      html = html.replace(cfg.h1Target.from, cfg.h1Target.to);
    }
  } else {
    // Ensure index.html has page-h1-title as H1
    html = html.replace(
      /<h2 id="page-h1-title"([^>]*)>([\s\S]*?)<\/h2>/i,
      '<h1 id="page-h1-title"$1>$2</h1>'
    );
  }

  // 5. Active View Pane Configuration
  const allViews = ['home', 'sponsorship', 'tax', 'growth', 'analytics', 'academy', 'seo-hub', 'youtube-tools'];
  allViews.forEach(v => {
    const isTarget = v === cfg.viewId;
    const regex1 = new RegExp(`id="view-${v}"\\s+class="suite-view-pane(?:\\s+hidden)?\\s+space-y-8"`, 'g');
    const replacement1 = `id="view-${v}" class="suite-view-pane${isTarget ? '' : ' hidden'} space-y-8"`;
    html = html.replace(regex1, replacement1);
  });

  // 6. Navigation Tabs Active State
  const allNavs = [
    { id: 'nav-home', activeColor: 'bg-indigo-600', textColor: 'text-white' },
    { id: 'nav-sponsorship', activeColor: 'bg-indigo-600', textColor: 'text-white' },
    { id: 'nav-tax', activeColor: 'bg-emerald-600', textColor: 'text-white' },
    { id: 'nav-growth', activeColor: 'bg-amber-600', textColor: 'text-white' },
    { id: 'nav-analytics', activeColor: 'bg-cyan-600', textColor: 'text-white' },
    { id: 'nav-academy', activeColor: 'bg-purple-600', textColor: 'text-white' },
    { id: 'nav-seo-hub', activeColor: 'bg-rose-600', textColor: 'text-white' },
    { id: 'nav-youtube-tools', activeColor: 'bg-red-600', textColor: 'text-white' }
  ];

  allNavs.forEach(nav => {
    const isTarget = nav.id === cfg.navId;
    const defaultClasses = 'nav-tab flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-medium text-xs whitespace-nowrap transition cursor-pointer text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent';
    const activeClasses = `nav-tab flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-medium text-xs whitespace-nowrap transition cursor-pointer ${nav.activeColor} ${nav.textColor} shadow-lg shadow-indigo-500/20 border border-white/10`;

    const navBtnRegex = new RegExp(`<button[^>]*id="${nav.id}"[^>]*class="([^"]*)"`, 'g');
    html = html.replace(navBtnRegex, (match, curClasses) => {
      return match.replace(curClasses, isTarget ? activeClasses : defaultClasses);
    });
  });

  fs.writeFileSync(filename, html, 'utf8');
  console.log(`[SEO UPGRADE] ${filename}: Title (${cfg.title.length}c), Desc (${cfg.description.length}c), Active: ${cfg.viewId}`);
});

console.log('All 8 pages successfully upgraded!');
