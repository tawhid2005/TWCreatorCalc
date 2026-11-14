/**
 * TWCreatorCalc — YouTube Deep Video Inspector Serverless API (Vercel)
 * Extracts: Category, Tags, Title, Description, ViewCount, Thumbnails, Author, Upload Date,
 * and computes institutional Video SEO Health Score (0-100).
 */

const YOUTUBE_CATEGORIES = {
  "1": "Film & Animation",
  "2": "Autos & Vehicles",
  "10": "Music",
  "15": "Pets & Animals",
  "17": "Sports",
  "18": "Short Movies",
  "19": "Travel & Events",
  "20": "Gaming",
  "21": "Videoblogging",
  "22": "People & Blogs",
  "23": "Comedy",
  "24": "Entertainment",
  "25": "News & Politics",
  "26": "Howto & Style",
  "27": "Education",
  "28": "Science & Technology",
  "29": "Nonprofits & Activism",
  "30": "Movies",
  "31": "Anime/Animation",
  "32": "Action/Adventure",
  "33": "Classics",
  "34": "Comedy",
  "35": "Documentary",
  "36": "Drama",
  "37": "Family",
  "38": "Foreign",
  "39": "Horror",
  "40": "Sci-Fi/Fantasy",
  "41": "Thriller",
  "42": "Shorts",
  "43": "Shows",
  "44": "Trailers"
};

const CATEGORY_RPM_BENCHMARKS = {
  "Science & Technology": { rpmMin: 4.5, rpmMax: 18.0, avg: 9.5, tier: "High CPM" },
  "Education": { rpmMin: 3.5, rpmMax: 14.0, avg: 7.5, tier: "High CPM" },
  "Howto & Style": { rpmMin: 2.5, rpmMax: 9.0, avg: 5.2, tier: "Moderate CPM" },
  "Autos & Vehicles": { rpmMin: 3.0, rpmMax: 12.0, avg: 6.8, tier: "Moderate CPM" },
  "Travel & Events": { rpmMin: 2.8, rpmMax: 8.5, avg: 5.0, tier: "Moderate CPM" },
  "Gaming": { rpmMin: 1.2, rpmMax: 4.5, avg: 2.8, tier: "Volume / Lower CPM" },
  "Entertainment": { rpmMin: 1.5, rpmMax: 5.0, avg: 3.2, tier: "Volume / Lower CPM" },
  "Comedy": { rpmMin: 1.5, rpmMax: 4.8, avg: 3.0, tier: "Volume / Lower CPM" },
  "People & Blogs": { rpmMin: 1.8, rpmMax: 6.0, avg: 3.6, tier: "Moderate CPM" },
  "Music": { rpmMin: 0.8, rpmMax: 3.0, avg: 1.8, tier: "Volume / Low CPM" },
  "News & Politics": { rpmMin: 2.0, rpmMax: 7.5, avg: 4.2, tier: "Moderate CPM" },
  "Sports": { rpmMin: 2.2, rpmMax: 7.0, avg: 4.0, tier: "Moderate CPM" },
  "Pets & Animals": { rpmMin: 1.5, rpmMax: 4.5, avg: 2.8, tier: "Moderate CPM" },
  "Film & Animation": { rpmMin: 1.8, rpmMax: 5.5, avg: 3.4, tier: "Moderate CPM" },
  "Nonprofits & Activism": { rpmMin: 1.5, rpmMax: 4.0, avg: 2.5, tier: "Moderate CPM" }
};

function extractVideoId(input) {
  if (!input) return null;
  const str = String(input).trim();
  
  // Direct 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(str)) {
    return str;
  }

  // Regex patterns for standard, share, shorts, embed, mobile
  const patterns = [
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([a-zA-Z0-9_-]{11})/,
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /\/shorts\/([a-zA-Z0-9_-]{11})/,
    /\/embed\/([a-zA-Z0-9_-]{11})/
  ];

  for (const regex of patterns) {
    const match = str.match(regex);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

function calculateSeoScore(title, description, tags, category, viewCount) {
  let score = 0;
  const breakdown = [];

  // 1. Title Audit (Max 25 pts)
  const titleLen = (title || "").trim().length;
  if (titleLen >= 40 && titleLen <= 70) {
    score += 25;
    breakdown.push({ item: "Title Length (40-70 chars)", points: 25, max: 25, pass: true, note: `Optimal length (${titleLen} chars) — prevents mobile cutoff.` });
  } else if (titleLen >= 20 && titleLen <= 90) {
    score += 18;
    breakdown.push({ item: "Title Length (20-90 chars)", points: 18, max: 25, pass: true, note: `Good (${titleLen} chars), but aim for 50-70 for peak mobile CTR.` });
  } else {
    score += 8;
    breakdown.push({ item: "Title Length", points: 8, max: 25, pass: false, note: `Too short or long (${titleLen} chars). Recommended: 50-70 characters.` });
  }

  // 2. Power words & Number in title (Max 10 bonus in Title category)
  const hasNumber = /\d+/.test(title);
  const powerWords = ["how", "guide", "secret", "best", "top", "ultimate", "review", "free", "easy", "2026", "new", "truth", "why", "stop", "never", "hack", "tutorial"];
  const titleLower = (title || "").toLowerCase();
  const hasPowerWord = powerWords.some(w => titleLower.includes(w));
  
  if (hasNumber || hasPowerWord) {
    score += 10;
    breakdown.push({ item: "Title Click Trigger (Power Word / Number)", points: 10, max: 10, pass: true, note: "Title contains high-CTR curiosity triggers." });
  } else {
    score += 4;
    breakdown.push({ item: "Title Click Trigger", points: 4, max: 10, pass: false, note: "Consider adding a year, number, or strong action trigger." });
  }

  // 3. Tags Audit (Max 25 pts)
  const tagCount = (tags || []).length;
  const tagChars = (tags || []).join("").length;
  if (tagCount >= 10 && tagCount <= 35 && tagChars >= 150) {
    score += 25;
    breakdown.push({ item: `Tags Volume (${tagCount} tags, ${tagChars} chars)`, points: 25, max: 25, pass: true, note: "Excellent keyword coverage for discovery & suggested feed." });
  } else if (tagCount >= 5) {
    score += 16;
    breakdown.push({ item: `Tags Volume (${tagCount} tags)`, points: 16, max: 25, pass: true, note: "Decent tag list, but add more long-tail variants up to 250-400 chars." });
  } else if (tagCount > 0) {
    score += 8;
    breakdown.push({ item: `Tags Volume (${tagCount} tags)`, points: 8, max: 25, pass: false, note: "Low tag count. YouTube allows up to 500 characters of tags." });
  } else {
    score += 0;
    breakdown.push({ item: "Tags Volume (0 tags)", points: 0, max: 25, pass: false, note: "No tags found! Adding 15-25 targeted tags aids algorithmic categorization." });
  }

  // 4. Description Depth & Timestamps (Max 25 pts)
  const descWords = (description || "").trim().split(/\s+/).filter(Boolean).length;
  const hasTimestamps = /\b\d{1,2}:\d{2}\b/.test(description);
  const hasLinks = /https?:\/\//i.test(description);
  
  let descScore = 0;
  if (descWords >= 150) descScore += 12;
  else if (descWords >= 50) descScore += 8;
  else descScore += 3;

  if (hasTimestamps) descScore += 7;
  if (hasLinks) descScore += 6;

  score += descScore;
  breakdown.push({ 
    item: `Description Depth (${descWords} words, ${hasTimestamps ? "With Chapters" : "No Chapters"})`, 
    points: descScore, 
    max: 25, 
    pass: descWords >= 100 && hasTimestamps, 
    note: `${descWords} words. ${hasTimestamps ? "✓ Timestamps detected (boosts Google Key Moments)." : "✗ Add timestamps to unlock Google Key Moments."} ${hasLinks ? "✓ Social/CTA links present." : "✗ Add CTA links."}`
  });

  // 5. Category & Quality Verification (Max 15 pts)
  if (category && category !== "Unknown") {
    score += 15;
    breakdown.push({ item: `Upload Category (${category})`, points: 15, max: 15, pass: true, note: `Video is mapped to an active genre (${category}).` });
  } else {
    score += 5;
    breakdown.push({ item: "Upload Category", points: 5, max: 15, pass: false, note: "Category metadata was obscured or default." });
  }

  // Normalize final score to 100
  const finalScore = Math.min(100, Math.max(10, Math.round(score)));
  let grade = "C";
  let gradeColor = "text-amber-400";
  if (finalScore >= 85) { grade = "A+"; gradeColor = "text-emerald-400"; }
  else if (finalScore >= 75) { grade = "A"; gradeColor = "text-emerald-400"; }
  else if (finalScore >= 60) { grade = "B"; gradeColor = "text-cyan-400"; }
  else if (finalScore >= 45) { grade = "C"; gradeColor = "text-amber-400"; }
  else { grade = "D"; gradeColor = "text-rose-400"; }

  return { score: finalScore, grade, gradeColor, breakdown };
}

module.exports = async function handler(req, res) {
  // Global CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const rawUrl = req.query.url || (req.body && req.body.url) || req.query.v;
    if (!rawUrl) {
      return res.status(400).json({ error: "Missing YouTube URL or video ID parameter 'url'" });
    }

    const videoId = extractVideoId(rawUrl);
    if (!videoId) {
      return res.status(400).json({ error: "Invalid YouTube URL format. Could not extract 11-character Video ID." });
    }

    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const ytResponse = await fetch(watchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache'
      }
    });

    if (!ytResponse.ok) {
      return res.status(502).json({ error: `YouTube responded with status ${ytResponse.status}` });
    }

    const html = await ytResponse.text();

    let title = "";
    let category = "";
    let tags = [];
    let author = "";
    let authorUrl = "";
    let viewCount = 0;
    let description = "";
    let publishDate = "";
    let isLive = false;
    let categoryId = null;

    // 1. Parse ytInitialPlayerResponse JSON
    const playerMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});(?:var\s|const\s|let\s|<\/script>)/s) ||
                        html.match(/var ytInitialPlayerResponse\s*=\s*({.+?});/s);
    if (playerMatch) {
      try {
        const data = JSON.parse(playerMatch[1]);
        const details = data.videoDetails || {};
        const micro = (data.microformat && data.microformat.playerMicroformatRenderer) || {};
        
        title = details.title || "";
        category = micro.category || "";
        categoryId = micro.categoryId || null;
        tags = Array.isArray(details.keywords) ? details.keywords : [];
        author = details.author || "";
        authorUrl = details.channelId ? `https://www.youtube.com/channel/${details.channelId}` : "";
        viewCount = parseInt(details.viewCount, 10) || 0;
        description = details.shortDescription || "";
        publishDate = micro.publishDate || "";
        isLive = !!details.isLiveContent;
      } catch (err) {
        // Continue to fallbacks
      }
    }

    // 2. Fallbacks via meta tags and regex
    if (!category) {
      const catMatch = html.match(/itemprop="genre"\s+content="([^"]+)"/) || html.match(/"category":\s*"([^"]+)"/);
      if (catMatch) category = catMatch[1];
    }
    if (!category && categoryId && YOUTUBE_CATEGORIES[categoryId]) {
      category = YOUTUBE_CATEGORIES[categoryId];
    }
    if (!category) {
      category = "General / Entertainment";
    }

    if (!title) {
      const tMatch = html.match(/<meta property="og:title"\s+content="([^"]+)"/) || html.match(/<title>([^<]+)<\/title>/);
      if (tMatch) title = tMatch[1].replace(/ - YouTube$/, "").trim();
    }

    if (!author) {
      const aMatch = html.match(/<link itemprop="name"\s+content="([^"]+)"/) || html.match(/<meta name="author"\s+content="([^"]+)"/);
      if (aMatch) author = aMatch[1];
    }

    if (tags.length === 0) {
      const kwMatch = html.match(/<meta name="keywords"\s+content="([^"]+)"/);
      if (kwMatch && kwMatch[1]) {
        tags = kwMatch[1].split(",").map(s => s.trim()).filter(Boolean);
      }
    }

    if (!viewCount) {
      const vcMatch = html.match(/"viewCount":\s*"(\d+)"/) || html.match(/itemprop="interactionCount"\s+content="(\d+)"/);
      if (vcMatch) viewCount = parseInt(vcMatch[1], 10) || 0;
    }

    // Thumbnails in all resolutions
    const thumbnails = {
      maxres: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      hq: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      mq: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
      sd: `https://img.youtube.com/vi/${videoId}/sddefault.jpg`,
      default: `https://img.youtube.com/vi/${videoId}/default.jpg`
    };

    // Category RPM & Earnings Calculation
    const nicheBenchmark = CATEGORY_RPM_BENCHMARKS[category] || { rpmMin: 1.5, rpmMax: 6.0, avg: 3.5, tier: "Standard CPM" };
    const estMinEarnings = ((viewCount * nicheBenchmark.rpmMin) / 1000).toFixed(2);
    const estMaxEarnings = ((viewCount * nicheBenchmark.rpmMax) / 1000).toFixed(2);
    const estAvgEarnings = ((viewCount * nicheBenchmark.avg) / 1000).toFixed(2);

    // SEO Score calculation
    const seoAudit = calculateSeoScore(title, description, tags, category, viewCount);

    return res.status(200).json({
      success: true,
      videoId,
      watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
      title,
      category,
      categoryId,
      nicheBenchmark,
      tags,
      tagCount: tags.length,
      totalTagChars: tags.join(", ").length,
      author,
      authorUrl,
      viewCount,
      estimatedEarnings: {
        currency: "USD",
        min: parseFloat(estMinEarnings),
        max: parseFloat(estMaxEarnings),
        avg: parseFloat(estAvgEarnings),
        avgRpm: nicheBenchmark.avg
      },
      publishDate,
      isLive,
      thumbnails,
      seoAudit,
      descriptionLength: description.length,
      descriptionWordCount: description.trim().split(/\s+/).filter(Boolean).length,
      descriptionPreview: description.slice(0, 350) + (description.length > 350 ? "..." : ""),
      fullDescription: description
    });

  } catch (err) {
    return res.status(500).json({
      error: "Failed to extract YouTube metadata: " + err.message
    });
  }
};
