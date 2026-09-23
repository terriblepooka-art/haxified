const YOUTUBE_API_KEY = "AIzaSyDik5fNs1j96Jk1FPS_AlhrVuQd-EJejWY";
const MAX_AGE_HOURS = 24;

// Spotlight channel for the HAXIFIED - TAG view (change to any @handle or channel URL)
const SPOTLIGHT_CHANNEL = "@SpyLordOfficial";

const STOP_WORDS = new Set([
    'the', 'a', 'an', 'and', 'or', 'to', 'in', 'of', 'for', 'is', 'it', 'i',
    'my', 'we', 'you', 'this', 'that', 'with', 'on', 'at', 'from', 'was', 'are',
    'be', 'have', 'has', 'had', 'but', 'not', 'they', 'he', 'she', 'his', 'her',
    'their', 'our', 'your', 'me', 'him', 'them', 'us', 'its', 'as', 'so', 'if',
    'then', 'than', 'when', 'where', 'why', 'how', 'what', 'who', 'which', 'who',
    'been', 'being', 'by', 'can', 'could', 'will', 'would', 'should', 'may', 'might',
    'must', 'shall', 'do', 'does', 'did', 'done', 'get', 'got', 'go', 'went', 'gone',
    'make', 'made', 'see', 'saw', 'seen', 'know', 'knew', 'known', 'take', 'took', 'taken',
    'come', 'came', 'think', 'thought', 'look', 'want', 'need', 'use', 'used', 'find',
    'give', 'gave', 'given', 'tell', 'told', 'work', 'worked', 'call', 'called', 'try',
    'trying', 'try', 'trying', 'tried', 'play', 'played', 'watch', 'watched', 'watch',
    'video', 'videos', 'channel', 'channels', 'subscribe', 'subscribers', 'like', 'comment',
    'share', 'follow', 'link', 'description', 'instagram', 'twitter', 'discord', 'merch',
    'patreon', 'sponsor', 'sponsored', 'ad', 'advertisement', 'promo', 'code', 'discount',
    'off', 'buy', 'now', 'new', 'today', 'latest', 'update', 'updates', 'episode', 'part',
    'series', 'season', 'full', 'complete', 'guide', 'tutorial', 'how', 'to', 'best', 'top',
    'most', 'amazing', 'incredible', 'insane', 'crazy', 'wild', 'epic', 'ultimate', 'secret',
    'hidden', 'revealed', 'exposed', 'truth', 'real', 'fake', 'vs', 'versus', 'battle',
    'challenge', 'challenges', 'reaction', 'react', 'reacting', 'first', 'time', 'ever',
    'never', 'always', 'forever', 'days', 'day', 'hours', 'hour', 'minutes', 'minute',
    'seconds', 'second', 'week', 'weeks', 'month', 'months', 'year', 'years'
]);

const GENERIC_WORDS = new Set([
    'video', 'videos', 'watch', 'watching', 'view', 'views', 'channel', 'channels',
    'subscribe', 'subscriber', 'subscribers', 'like', 'likes', 'comment', 'comments',
    'share', 'shared', 'follow', 'following', 'followers', 'link', 'links', 'description',
    'instagram', 'twitter', 'discord', 'merch', 'patreon', 'sponsor', 'sponsored',
    'ad', 'advertisement', 'promo', 'code', 'discount', 'off', 'buy', 'now', 'new',
    'today', 'latest', 'update', 'updates', 'episode', 'part', 'series', 'season',
    'full', 'complete', 'guide', 'tutorial', 'best', 'top', 'most', 'amazing',
    'incredible', 'insane', 'crazy', 'wild', 'epic', 'ultimate', 'secret', 'hidden',
    'revealed', 'exposed', 'truth', 'real', 'fake', 'vs', 'versus', 'battle',
    'challenge', 'challenges', 'reaction', 'react', 'reacting', 'first', 'time',
    'ever', 'never', 'always', 'forever'
]);

let channels = [];
let allVideos = [];
let currentSort = 'latest';
let currentView = 'grid'; // 'grid' | 'haxified'
let isLoading = false;
let hasRefreshed = false; // true after the first successful refresh cycle
let failedChannels = new Set(); // channel IDs that failed the last refresh
let spotlightCache = null; // { channel, video, fetchedAt } — session memory only

const refreshBtn = document.getElementById('refreshBtn');
const channelInput = document.getElementById('channelInput');
const addChannelBtn = document.getElementById('addChannelBtn');
const channelList = document.getElementById('channelList');
const channelErrorEl = document.getElementById('channelError');
const channelStatusEl = document.getElementById('channelStatus');

function showChannelError(msg) {
    if (!channelErrorEl) {
        if (msg) alert(msg);
        return;
    }
    if (!msg) {
        channelErrorEl.textContent = '';
        channelErrorEl.classList.add('hidden');
        return;
    }
    channelErrorEl.textContent = msg;
    channelErrorEl.classList.remove('hidden');
}

function showChannelStatus(msg) {
    if (!channelStatusEl) return;
    if (!msg) {
        channelStatusEl.textContent = '';
        channelStatusEl.classList.add('hidden');
        return;
    }
    channelStatusEl.textContent = msg;
    channelStatusEl.classList.remove('hidden');
}
const videosContainer = document.getElementById('videosContainer');
const emptyState = document.getElementById('emptyState');
const mostViewedList = document.getElementById('mostViewedList');
const noMostViewed = document.getElementById('noMostViewed');
const fastestGrowingList = document.getElementById('fastestGrowingList');
const noFastestGrowing = document.getElementById('noFastestGrowing');
const hashtagList = document.getElementById('hashtagList');
const noHashtags = document.getElementById('noHashtags');
const copyHashtagsBtn = document.getElementById('copyHashtagsBtn');
const soundList = document.getElementById('soundList');
const noSounds = document.getElementById('noSounds');
const copySoundsBtn = document.getElementById('copySoundsBtn');
const haxifiedView = document.getElementById('haxifiedView');
const haxTag = document.getElementById('haxTag');
const haxTagMeta = document.getElementById('haxTagMeta');
const haxCopyTag = document.getElementById('haxCopyTag');
const haxAudioName = document.getElementById('haxAudioName');
const haxAudioMeta = document.getElementById('haxAudioMeta');
const haxThumb = document.getElementById('haxThumb');
const haxRedirect = document.getElementById('haxRedirect');
const haxStatus = document.getElementById('haxStatus');
const analyzeView = document.getElementById('analyzeView');
const analyzeInput = document.getElementById('analyzeInput');
const analyzeBtn = document.getElementById('analyzeBtn');
const analyzeError = document.getElementById('analyzeError');
const analyzeStatus = document.getElementById('analyzeStatus');
const analyzeResults = document.getElementById('analyzeResults');
const anAvatar = document.getElementById('anAvatar');
const anName = document.getElementById('anName');
const anMeta = document.getElementById('anMeta');
const anScore = document.getElementById('anScore');
const anStats = document.getElementById('anStats');
const anChecks = document.getElementById('anChecks');
const anTopFlop = document.getElementById('anTopFlop');
let lastAnalysis = null; // { channel, videos, metrics, checks, score } — memory only

function setView(view, activeBtn) {
    // BUGFIX: this used to only know grid/haxified, so the analyze view could
    // never appear (and views stacked on top of each other when switching).
    currentView = view;
    videosContainer.classList.toggle('hidden', view !== 'grid');
    emptyState.classList.toggle('hidden', view !== 'grid' || allVideos.length > 0);
    haxifiedView.classList.toggle('hidden', view !== 'haxified');
    analyzeView.classList.toggle('hidden', view !== 'analyze');
    document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
    if (activeBtn) activeBtn.classList.add('active');
    else if (view === 'grid') {
        const fallback = document.querySelector(`.sort-btn[data-sort="${currentSort}"]`);
        if (fallback) fallback.classList.add('active');
    }
}

function openHaxified() {
    const btn = document.querySelector('.sort-btn[data-view="haxified"]');
    setView('haxified', btn);
    renderHaxifiedBest();
    loadSpotlightShort();
}

function openAnalyze() {
    const btn = document.querySelector('.sort-btn[data-view="analyze"]');
    setView('analyze', btn);
    if (lastAnalysis) renderAnalyzer(lastAnalysis);
}

function setAnalyzeError(msg) {
    if (!analyzeError) return;
    if (!msg) {
        analyzeError.textContent = '';
        analyzeError.classList.add('hidden');
        return;
    }
    analyzeError.textContent = msg;
    analyzeError.classList.remove('hidden');
}

function setAnalyzeStatus(msg) {
    if (!analyzeStatus) return;
    if (!msg) {
        analyzeStatus.textContent = '';
        analyzeStatus.classList.add('hidden');
        return;
    }
    analyzeStatus.textContent = msg;
    analyzeStatus.classList.remove('hidden');
}

async function analyzeChannel() {
    const url = (analyzeInput.value || '').trim();
    if (!url) return;
    if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY === 'PASTE_API_KEY_HERE') {
        setAnalyzeError('API key missing. Open script.js and set YOUTUBE_API_KEY.');
        return;
    }
    const extracted = extractChannelId(url);
    if (!extracted) {
        setAnalyzeError('Unrecognized URL. Use a channel URL (@handle or /channel/UC...).');
        return;
    }
    setAnalyzeError(null);
    analyzeResults.classList.add('hidden');
    analyzeBtn.disabled = true;
    setAnalyzeStatus('Resolving channel…');
    try {
        const base = await resolveChannel(extracted);
        const channel = await fetchChannelStats(base.id);
        setAnalyzeStatus(`Analyzing last uploads of "${channel.name}"…`);
        const videos = await fetchAnalysisVideos(channel.uploadsId);
        if (videos.length < 3) {
            throw new Error(`Only ${videos.length} recent video(s) found — need at least 3 for a reliable report.`);
        }
        const metrics = computeChannelMetrics(videos);
        const { checks, score } = buildChannelChecks(metrics, channel);
        lastAnalysis = { channel, videos, metrics, checks, score };
        renderAnalyzer(lastAnalysis);
        setAnalyzeStatus(null);
    } catch (err) {
        console.error('Analyze failed:', err);
        setAnalyzeStatus(null);
        setAnalyzeError(err.message || 'Analysis failed. Try again.');
    } finally {
        analyzeBtn.disabled = false;
    }
}

async function fetchChannelStats(channelId) {
    // snippet + statistics + contentDetails + brandingSettings in ONE call (1 quota unit)
    const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails,brandingSettings&id=${encodeURIComponent(channelId)}&key=${encodeURIComponent(YOUTUBE_API_KEY)}`;
    const response = await fetch(url);
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(parseApiError(response.status, data));
    const it = data.items?.[0];
    if (!it) throw new Error('Channel not found.');
    return {
        id: it.id,
        name: it.snippet.title,
        avatar: it.snippet.thumbnails?.medium?.url || it.snippet.thumbnails?.default?.url || '',
        handle: it.snippet.customUrl || '',
        country: it.snippet.country || it.brandingSettings?.channel?.country || '',
        createdAt: it.snippet.publishedAt,
        hiddenSubs: !!it.statistics.hiddenSubscriberCount,
        subs: it.statistics.hiddenSubscriberCount ? null : parseInt(it.statistics.subscriberCount || '0', 10),
        totalViews: parseInt(it.statistics.viewCount || '0', 10),
        videoCount: parseInt(it.statistics.videoCount || '0', 10),
        uploadsId: it.contentDetails?.relatedPlaylists?.uploads || null
    };
}

async function fetchAnalysisVideos(uploadsId) {
    if (!uploadsId) throw new Error('Uploads playlist not found for this channel.');
    const key = encodeURIComponent(YOUTUBE_API_KEY);
    const plUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${encodeURIComponent(uploadsId)}&maxResults=30&key=${key}`;
    const plRes = await fetch(plUrl);
    const plData = await plRes.json().catch(() => null);
    if (!plRes.ok) {
        if (plRes.status === 400 || plRes.status === 403) throw new Error(parseApiError(plRes.status, plData));
        throw new Error('Could not load recent uploads.');
    }
    const ids = [...new Set((plData.items || []).map(i => i.contentDetails?.videoId).filter(Boolean))];
    if (!ids.length) return [];
    const vUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${ids.join(',')}&key=${key}`;
    const vRes = await fetch(vUrl);
    const vData = await vRes.json().catch(() => null);
    if (!vRes.ok) {
        if (vRes.status === 400 || vRes.status === 403) throw new Error(parseApiError(vRes.status, vData));
        throw new Error('Could not load video statistics.');
    }
    return (vData.items || []).map(item => ({
        id: item.id,
        title: item.snippet.title || '(untitled)',
        publishedAt: item.snippet.publishedAt,
        viewCount: parseInt(item.statistics.viewCount || '0', 10),
        likeCount: item.statistics.likeCount != null ? parseInt(item.statistics.likeCount, 10) : null,
        commentCount: item.statistics.commentCount != null ? parseInt(item.statistics.commentCount, 10) : null,
        durationSec: parseDurationSec(item.contentDetails?.duration),
        tags: Array.isArray(item.snippet.tags) ? item.snippet.tags : [],
        description: item.snippet.description || '',
        caption: item.contentDetails?.caption === 'true',
        hd: item.contentDetails?.definition === 'hd'
    }));
}

function computeChannelMetrics(videos) {
    const byNewest = [...videos].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    const n = byNewest.length;
    const views = byNewest.map(v => v.viewCount).sort((a, b) => a - b);
    const sum = views.reduce((a, b) => a + b, 0);
    const avg = sum / n;
    const median = n % 2 ? views[(n - 1) / 2] : (views[n / 2 - 1] + views[n / 2]) / 2;
    const best = byNewest.reduce((a, b) => b.viewCount > a.viewCount ? b : a);
    const worst = byNewest.reduce((a, b) => b.viewCount < a.viewCount ? b : a);

    // Trend: newer half vs older half
    const half = Math.max(1, Math.floor(n / 2));
    const avgOf = arr => arr.reduce((x, v) => x + v.viewCount, 0) / (arr.length || 1);
    const olderAvg = avgOf(byNewest.slice(half));
    const newerAvg = avgOf(byNewest.slice(0, half));
    const trendPct = olderAvg > 0 ? ((newerAvg - olderAvg) / olderAvg) * 100 : (newerAvg > 0 ? 100 : 0);

    // Consistency gaps
    const times = byNewest.map(v => new Date(v.publishedAt).getTime());
    const gaps = [];
    for (let i = 0; i < times.length - 1; i++) gaps.push((times[i] - times[i + 1]) / 86400000);
    const avgGap = gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 0;
    const maxGap = gaps.length ? Math.max(...gaps) : 0;
    const daysSinceLast = (Date.now() - times[0]) / 86400000;
    const spanDays = (times[0] - times[times.length - 1]) / 86400000;
    const perWeek = spanDays > 0.5 ? (n / spanDays) * 7 : n * 7;

    // Engagement
    let likeSum = 0, likeViews = 0, comSum = 0, comViews = 0, comEnabled = 0;
    byNewest.forEach(v => {
        if (v.likeCount != null) { likeSum += v.likeCount; likeViews += v.viewCount; }
        if (v.commentCount != null) { comSum += v.commentCount; comViews += v.viewCount; comEnabled++; }
    });
    const likeRate = likeViews > 0 ? (likeSum / likeViews) * 100 : 0;
    const commentRate = comViews > 0 ? (comSum / comViews) * 100 : 0;

    // Titles
    const titles = byNewest.map(v => v.title || '');
    const avgTitleLen = titles.reduce((a, t) => a + t.length, 0) / n;
    const sweetTitles = titles.filter(t => t.length >= 30 && t.length <= 70).length / n * 100;
    const capsTitles = titles.filter(t => {
        const letters = t.replace(/[^A-Za-z]/g, '');
        return letters.length >= 4 && (letters.replace(/[^A-Z]/g, '').length / letters.length) > 0.7;
    }).length / n * 100;
    const numTitles = titles.filter(t => /\d/.test(t)).length / n * 100;
    const emojiTitles = titles.filter(t => /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(t)).length / n * 100;

    // Metadata
    const withTags = byNewest.filter(v => v.tags.length > 0).length / n * 100;
    const avgTags = byNewest.reduce((a, v) => a + v.tags.length, 0) / n;
    const descLens = byNewest.map(v => v.description.length);
    const avgDesc = descLens.reduce((a, b) => a + b, 0) / n;
    const emptyDesc = descLens.filter(l => l < 50).length / n * 100;
    const withCC = byNewest.filter(v => v.caption).length / n * 100;
    const hdPct = byNewest.filter(v => v.hd).length / n * 100;

    // Shorts vs longform (Shorts ≈ 60s or less)
    const shorts = byNewest.filter(v => v.durationSec > 0 && v.durationSec <= 61);
    const longs = byNewest.filter(v => !(v.durationSec > 0 && v.durationSec <= 61));

    return {
        n, avg, median, best, worst, latest: byNewest[0], trendPct, avgGap, maxGap, daysSinceLast, perWeek,
        likeRate, commentRate, comEnabledPct: comEnabled / n * 100,
        avgTitleLen, sweetTitles, capsTitles, numTitles, emojiTitles,
        withTags, avgTags, avgDesc, emptyDesc, withCC, hdPct,
        shorts: shorts.length, shortsAvg: shorts.length ? shorts.reduce((a, v) => a + v.viewCount, 0) / shorts.length : 0,
        longs: longs.length, longsAvg: longs.length ? longs.reduce((a, v) => a + v.viewCount, 0) / longs.length : 0
    };
}

function buildChannelChecks(m, ch) {
    // status: ok (100pts) | warn (60) | bad (20). Every verdict carries its metric + fix.
    const C = (label, status, metric, fix) => ({
        label, status, metric, fix,
        pts: status === 'ok' ? 100 : status === 'warn' ? 60 : 20
    });
    const checks = [
        m.daysSinceLast <= 3
            ? C('Upload recency', 'ok', `last video ${formatRelativeTime(m.latest.publishedAt)}`, 'Keep the rhythm — consistency is your edge.')
            : m.daysSinceLast <= 7
                ? C('Upload recency', 'warn', `${m.daysSinceLast.toFixed(1)} days since last upload`, 'FIX: post at least 1 video this week before the gap grows.')
                : C('Upload recency', 'bad', `${m.daysSinceLast.toFixed(1)} days since last upload`, 'FIX: upload this week, then lock a weekly schedule.'),
        m.avgGap <= 7
            ? C('Upload consistency', 'ok', `avg gap ${m.avgGap.toFixed(1)} days`, 'Schedule is healthy — keep it.')
            : m.avgGap <= 14
                ? C('Upload consistency', 'warn', `avg gap ${m.avgGap.toFixed(1)} days · longest ${m.maxGap.toFixed(0)} days`, 'FIX: tighten to 1 video per week.')
                : C('Upload consistency', 'bad', `avg gap ${m.avgGap.toFixed(1)} days · longest ${m.maxGap.toFixed(0)} days`, 'FIX: pick 1 fixed upload day per week and batch-record.'),
        m.trendPct > 10
            ? C('Views trend', 'ok', `+${m.trendPct.toFixed(0)}% newer vs older half`, 'Growth mode — double down on what the top video did.')
            : m.trendPct >= -10
                ? C('Views trend', 'warn', `${m.trendPct.toFixed(0)}% newer vs older half (flat)`, 'FIX: test 2 new title styles + 1 new format this month.')
                : C('Views trend', 'bad', `${m.trendPct.toFixed(0)}% newer vs older half (declining)`, 'FIX: study the best recent video — copy its topic, title shape and length for the next 3 uploads.'),
        m.likeRate >= 1.5
            ? C('Engagement (likes)', 'ok', `${m.likeRate.toFixed(2)}% like rate`, 'Viewers tap — keep the CTA where it is.')
            : m.likeRate >= 0.7
                ? C('Engagement (likes)', 'warn', `${m.likeRate.toFixed(2)}% like rate`, 'FIX: ask for the like right after the hook + pin a question comment.')
                : C('Engagement (likes)', 'bad', `${m.likeRate.toFixed(2)}% like rate`, 'FIX: add a verbal CTA in the first 60s and reply to early comments.'),
        m.avgDesc >= 200
            ? C('Descriptions', 'ok', `avg ${Math.round(m.avgDesc)} chars`, 'Good for search — keep keywords in the first 2 lines.')
            : m.avgDesc >= 80
                ? C('Descriptions', 'warn', `avg ${Math.round(m.avgDesc)} chars`, `FIX: expand to 200+ chars — ${Math.round(m.emptyDesc)}% are near-empty.`)
                : C('Descriptions', 'bad', `avg ${Math.round(m.avgDesc)} chars · ${Math.round(m.emptyDesc)}% near-empty`, 'FIX: 3-line template — hook + keywords + links/hashtags — on every upload.'),
        m.withTags >= 70
            ? C('Tags', 'ok', `${Math.round(m.withTags)}% videos tagged (avg ${m.avgTags.toFixed(0)})`, 'Tags covered.')
            : m.withTags >= 40
                ? C('Tags', 'warn', `only ${Math.round(m.withTags)}% videos tagged`, 'FIX: add 5–8 specific tags per video (topic + variations).')
                : C('Tags', 'bad', `only ${Math.round(m.withTags)}% videos tagged`, 'FIX: tag every upload — topic, format keyword, and 2–3 close variants.'),
        m.withCC >= 70
            ? C('Subtitles (CC)', 'ok', `${Math.round(m.withCC)}% with captions`, 'Accessible + more watch time.')
            : m.withCC >= 40
                ? C('Subtitles (CC)', 'warn', `only ${Math.round(m.withCC)}% with captions`, 'FIX: enable auto-captions and correct the title/hook lines.')
                : C('Subtitles (CC)', 'bad', `only ${Math.round(m.withCC)}% with captions`, 'FIX: turn on captions — most Shorts views are silent-first.'),
        m.hdPct >= 90
            ? C('Video quality', 'ok', `${Math.round(m.hdPct)}% HD`, 'Quality is fine.')
            : m.hdPct >= 70
                ? C('Video quality', 'warn', `${Math.round(m.hdPct)}% HD`, 'FIX: export 1080p minimum on every upload.')
                : C('Video quality', 'bad', `${Math.round(m.hdPct)}% HD`, 'FIX: re-export in HD — blurry uploads kill click-through and retention.'),
        m.sweetTitles >= 60
            ? C('Title length', 'ok', `avg ${Math.round(m.avgTitleLen)} chars · ${Math.round(m.sweetTitles)}% in 30–70 range`, 'Titles scan well.')
            : m.sweetTitles >= 40
                ? C('Title length', 'warn', `only ${Math.round(m.sweetTitles)}% in 30–70 range`, 'FIX: rewrite outliers — front-load the hook word.')
                : C('Title length', 'bad', `only ${Math.round(m.sweetTitles)}% in 30–70 range`, 'FIX: keep titles 30–70 chars, hook first, no filler.'),
        m.comEnabledPct >= 80
            ? C('Comments open', 'ok', `${Math.round(m.comEnabledPct)}% allow comments`, 'Community signal flowing.')
            : C('Comments open', 'warn', `only ${Math.round(m.comEnabledPct)}% allow comments`, 'FIX: enable comments — replies in hour 1 boost early velocity.'),
        ch.hiddenSubs
            ? C('Subscriber count', 'warn', 'hidden', 'FIX: unhide it (Settings → Channel → uncheck "keep private") — public proof builds trust.')
            : C('Subscriber count', 'ok', `${formatNumber(ch.subs)} public`, 'Social proof visible.')
    ];
    const score = Math.round(checks.reduce((a, c) => a + c.pts, 0) / checks.length);
    const order = { bad: 0, warn: 1, ok: 2 };
    checks.sort((a, b) => order[a.status] - order[b.status]);
    return { checks, score };
}

function channelAgeString(isoString) {
    const days = (Date.now() - new Date(isoString).getTime()) / 86400000;
    if (!isFinite(days) || days < 0) return '';
    const years = Math.floor(days / 365);
    const months = Math.floor((days % 365) / 30);
    if (years > 0) return `${years}y${months > 0 ? ` ${months}m` : ''} old`;
    if (months > 0) return `${months}m old`;
    return `${Math.max(1, Math.floor(days))}d old`;
}

function renderAnalyzer(data) {
    const { channel, metrics: m, checks, score } = data;
    analyzeResults.classList.remove('hidden');
    anAvatar.src = channel.avatar || '';
    anName.textContent = channel.name;
    anMeta.textContent = [channel.handle, channel.country, channelAgeString(channel.createdAt)]
        .filter(Boolean).join(' · ');
    anScore.textContent = score;
    anScore.style.color = score >= 70 ? 'var(--green)' : score >= 45 ? '#ffd60a' : 'var(--accent)';

    const stat = (label, value) => `<div class="stat-item"><span class="stat-value">${value}</span><span class="stat-label">${label}</span></div>`;
    anStats.innerHTML =
        stat('SUBSCRIBERS', channel.hiddenSubs ? 'HIDDEN' : formatNumber(channel.subs)) +
        stat('TOTAL VIEWS', formatNumber(channel.totalViews)) +
        stat('VIDEOS', channel.videoCount) +
        stat('UPLOADS / WEEK', m.perWeek >= 10 ? m.perWeek.toFixed(0) : m.perWeek.toFixed(1)) +
        stat('AVG VIEWS (RECENT)', formatNumber(m.avg)) +
        stat('LIKE RATE', m.likeRate.toFixed(2) + '%') +
        stat('SHORTS (AVG)', `${m.shorts} · ${formatNumber(m.shortsAvg)}`) +
        stat('LONGFORM (AVG)', `${m.longs} · ${formatNumber(m.longsAvg)}`);

    anChecks.innerHTML = '';
    checks.forEach(c => {
        const li = document.createElement('li');
        li.className = `check-item ${c.status}`;
        li.innerHTML = `
            <span class="check-dot"></span>
            <div class="term-detail">
                <span class="term-main">${escapeHtml(c.label)} — ${escapeHtml(c.metric)}</span>
                <span class="term-meta"><strong>${escapeHtml(c.fix)}</strong></span>
            </div>
            <span class="term-count">${c.pts}</span>
        `;
        anChecks.appendChild(li);
    });

    const vidRow = (tag, v) => {
        const t = v.title.length > 55 ? v.title.slice(0, 55) + '…' : v.title;
        return `<li class="term-item"><div class="term-detail"><span class="term-main">${tag}: ${escapeHtml(t)}</span><span class="term-meta">${formatNumber(v.viewCount)} views · ${formatRelativeTime(v.publishedAt)}</span></div></li>`;
    };
    anTopFlop.innerHTML = vidRow('TOP', m.best) + vidRow('FLOP', m.worst);
}

function toHashtag(term) {
    return '#' + term.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
}

// BEST = used by the most channels (tiebreak: higher score)
function renderHaxifiedBest() {
    const scored = calculateKeywordScores(allVideos);
    const best = [...scored].sort((a, b) => b.channels - a.channels || b.score - a.score)[0];
    if (!best) {
        haxTag.textContent = 'Not enough title data yet.';
        haxTagMeta.textContent = '';
        haxCopyTag.classList.add('hidden');
        haxCopyTag.dataset.tag = '';
        return;
    }
    // Always lowercase: #voz, never #Voz (terms are already normalized lowercase)
    const tag = '#' + best.term.replace(/\s+/g, '');
    haxTag.textContent = tag;
    haxTagMeta.textContent = `used by ${best.channels} channel${best.channels !== 1 ? 's' : ''} · ${best.frequency} titles`;
    haxCopyTag.dataset.tag = tag;
    haxCopyTag.classList.remove('hidden');
}

function setHaxStatus(msg) {
    if (!haxStatus) return;
    if (!msg) {
        haxStatus.textContent = '';
        haxStatus.classList.add('hidden');
        return;
    }
    haxStatus.textContent = msg;
    haxStatus.classList.remove('hidden');
}

async function loadSpotlightShort() {
    setHaxStatus('Loading latest short…');
    haxRedirect.classList.add('hidden');
    haxThumb.classList.add('hidden');
    try {
        let channel = spotlightCache?.channel;
        if (!channel) {
            const extracted = extractChannelId(SPOTLIGHT_CHANNEL);
            if (!extracted) throw new Error('Spotlight channel URL invalid. Check SPOTLIGHT_CHANNEL in script.js.');
            channel = await resolveChannel(extracted);
            spotlightCache = { channel };
        }
        // 15-min session cache so reopening the tab doesn't burn quota
        const cacheFresh = spotlightCache.video && (Date.now() - (spotlightCache.fetchedAt || 0) < 15 * 60 * 1000);
        if (!cacheFresh) {
            const vids = await fetchChannelVideos({ id: channel.id, name: channel.name });
            // Latest short IN 24h (same window as the dashboard)
            const cutoff = Date.now() - MAX_AGE_HOURS * 60 * 60 * 1000;
            const byNewest = vids
                .filter(v => new Date(v.publishedAt).getTime() >= cutoff)
                .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
            // Shorts ≈ 60s or less
            const pick = byNewest.find(v => v.durationSec > 0 && v.durationSec <= 61);
            if (!pick) {
                haxAudioName.textContent = 'NO AUDIO FOUND';
                haxAudioMeta.textContent = `${channel.name} · no short in the last 24h`;
                setHaxStatus(null);
                return;
            }
            spotlightCache.video = pick;
            spotlightCache.fetchedAt = Date.now();
        }
        renderSpotlightVideo(channel, spotlightCache.video);
        setHaxStatus(null);
    } catch (err) {
        console.error('Spotlight failed:', err);
        haxAudioName.textContent = '—';
        haxAudioMeta.textContent = '';
        setHaxStatus(err.message || 'Could not load spotlight short.');
    }
}

function renderSpotlightVideo(channel, pick) {
    const sound = (pick.sounds || [])[0];
    haxAudioName.textContent = sound || '—';
    haxAudioMeta.textContent =
        `${channel.name} · "${pick.title.length > 60 ? pick.title.slice(0, 60) + '…' : pick.title}" · ${formatRelativeTime(pick.publishedAt)}` +
        (sound ? '' : ' · no music mention detected — open the short and tap its sound badge');
    haxThumb.src = pick.thumbnail;
    haxThumb.classList.remove('hidden');
    // Redirect to the short itself: tap its sound badge there to Use / Save the sound
    haxRedirect.href = `https://www.youtube.com/shorts/${pick.id}`;
    haxRedirect.classList.remove('hidden');
}
const loadingOverlay = document.getElementById('loadingOverlay');
const lastRefreshEl = document.getElementById('lastRefresh');
const channelCountEl = document.getElementById('channelCount');
const videoCountEl = document.getElementById('videoCount');
const totalVideosEl = document.getElementById('totalVideos');
const totalChannelsEl = document.getElementById('totalChannels');
const newestVideoEl = document.getElementById('newestVideo');
const mostViewedVideoEl = document.getElementById('mostViewedVideo');
const trendingKeywordsList = document.getElementById('trendingKeywordsList');
const noTrendingKeywords = document.getElementById('noTrendingKeywords');
const titlePatternsList = document.getElementById('titlePatternsList');
const noTitlePatterns = document.getElementById('noTitlePatterns');

document.addEventListener('DOMContentLoaded', init);

async function init() {
    loadChannels();
    renderChannels();
    updateChannelCount();
    attachEventListeners();
    // Always render once so empty states + tabs show correctly even with 0 channels
    filterAndRender();
    if (channels.length > 0) {
        await refreshAll();
    }
}

function attachEventListeners() {
    refreshBtn.addEventListener('click', refreshAll);
    addChannelBtn.addEventListener('click', addChannel);
    channelInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addChannel();
    });

    document.querySelectorAll('.sort-btn[data-sort]').forEach(btn => {
        btn.addEventListener('click', () => {
            currentSort = btn.dataset.sort;
            setView('grid', btn);
            renderVideos();
            renderMostViewed();
            renderFastestGrowing();
        });
    });

    const haxBtn = document.querySelector('.sort-btn[data-view="haxified"]');
    if (haxBtn) haxBtn.addEventListener('click', () => openHaxified());
    const anBtn = document.querySelector('.sort-btn[data-view="analyze"]');
    if (anBtn) anBtn.addEventListener('click', () => openAnalyze());
    if (analyzeBtn) analyzeBtn.addEventListener('click', analyzeChannel);
    if (analyzeInput) analyzeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') analyzeChannel();
    });
    if (haxCopyTag) haxCopyTag.addEventListener('click', () => {
        if (haxCopyTag.dataset.tag) copyText(haxCopyTag.dataset.tag);
    });

    copyHashtagsBtn.addEventListener('click', copyAllHashtags);
    if (copySoundsBtn) copySoundsBtn.addEventListener('click', copyAllSounds);

    document.addEventListener('click', (e) => {
        const hashtagEl = e.target.closest ? e.target.closest('.hashtag') : null;
        if (hashtagEl && hashtagList.contains(hashtagEl)) {
            copyHashtag(hashtagEl);
            return;
        }
        // NOTE: .watch-btn is a plain <a href target=_blank> — no JS needed.
        // The old window.open() here opened every video TWICE, so it was removed.
        if (e.target.classList && e.target.classList.contains('channel-remove')) {
            removeChannel(e.target.dataset.channelId);
        }
    });
}

function loadChannels() {
    const stored = localStorage.getItem('titleRadarChannels');
    if (!stored) {
        channels = [];
        return;
    }
    try {
        const parsed = JSON.parse(stored);
        if (!Array.isArray(parsed)) {
            channels = [];
            return;
        }
        // Validate shape + dedupe by channel ID (old versions could store duplicates)
        const seen = new Set();
        channels = parsed.filter(c => {
            if (!c || typeof c.id !== 'string' || typeof c.name !== 'string') return false;
            if (seen.has(c.id)) return false;
            seen.add(c.id);
            return true;
        });
    } catch {
        channels = [];
    }
}

function saveChannels() {
    try {
        localStorage.setItem('titleRadarChannels', JSON.stringify(channels));
    } catch (err) {
        console.warn('Could not save channels to localStorage:', err);
    }
}

function extractChannelId(url) {
    url = url.trim();

    const handleMatch = url.match(/youtube\.com\/@([^/?#\s]+)/i);
    if (handleMatch) return { type: 'handle', value: decodeURIComponent(handleMatch[1].replace(/^@/, '')) };

    const channelIdMatch = url.match(/youtube\.com\/channel\/([^/?#\s]+)/i);
    if (channelIdMatch) return { type: 'id', value: channelIdMatch[1] };

    const customMatch = url.match(/youtube\.com\/c\/([^/?#\s]+)/i);
    if (customMatch) return { type: 'custom', value: decodeURIComponent(customMatch[1]) };

    const userMatch = url.match(/youtube\.com\/user\/([^/?#\s]+)/i);
    if (userMatch) return { type: 'user', value: decodeURIComponent(userMatch[1]) };

    if (url.startsWith('@')) {
        const h = url.slice(1).split(/[\s/?#]/)[0];
        if (h) return { type: 'handle', value: decodeURIComponent(h) };
    }
    if (/^UC[a-zA-Z0-9_-]{22}$/.test(url.split(/[\s/?#]/)[0])) {
        return { type: 'id', value: url.split(/[\s/?#]/)[0] };
    }

    // Video / Shorts / Live / Embed URLs -> resolve the owning channel via videos.list
    const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (watchMatch) return { type: 'video', value: watchMatch[1] };
    const shortMatch = url.match(/youtube\.com\/(?:shorts|live|embed)\/([a-zA-Z0-9_-]{11})/i);
    if (shortMatch) return { type: 'video', value: shortMatch[1] };
    const youtuBeMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/i);
    if (youtuBeMatch) return { type: 'video', value: youtuBeMatch[1] };

    // Looks like a YouTube URL but not a recognized channel format -> reject
    // (previously this fell through to search and wasted 100 quota units)
    if (/youtu\.?be/i.test(url) || /youtube\.com/i.test(url)) {
        return null;
    }

    // Plain text fallback -> search API (e.g. "MrBeast")
    if (url && !url.includes(' ') && url.length <= 100) {
        return { type: 'search', value: url };
    }

    return null;
}

function parseApiError(status, data) {
    const reason = data?.error?.errors?.[0]?.reason || '';
    const message = data?.error?.message || '';
    if (status === 400) return `Bad request (${message || reason || 'check handle/ID format'}).`;
    if (status === 403) {
        if (/quota/i.test(message)) return 'API quota exceeded. Try again tomorrow or use a new key.';
        if (/accessNotConfigured|disabled|not enabled/i.test(message + reason)) return 'YouTube Data API v3 is not enabled for this key. Enable it in Google Cloud Console.';
        if (/referer|referrer|blocked|restricted/i.test(message + reason)) return 'API key is restricted (HTTP referrer / IP). Remove restrictions or add your domain in Google Cloud Console.';
        if (/keyInvalid|API key not valid/i.test(message + reason)) return 'API key is invalid. Copy the full key again from Google Cloud Console.';
        return `Access forbidden (${message || reason}).`;
    }
    if (status === 404) return 'Channel not found.';
    return message || `Request failed (HTTP ${status}).`;
}

async function fetchChannelByParams(params) {
    const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails&key=${encodeURIComponent(YOUTUBE_API_KEY)}&${params}`;
    const response = await fetch(url);
    const data = await response.json().catch(() => null);
    if (!response.ok) {
        throw new Error(parseApiError(response.status, data));
    }
    if (!data.items || data.items.length === 0) return null;
    const item = data.items[0];
    return {
        id: item.id,
        name: item.snippet.title,
        handle: item.snippet.customUrl ? item.snippet.customUrl.replace(/^@/, '') : null
    };
}

async function searchChannelByName(query) {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&maxResults=1&q=${encodeURIComponent(query)}&key=${encodeURIComponent(YOUTUBE_API_KEY)}`;
    const response = await fetch(url);
    const data = await response.json().catch(() => null);
    if (!response.ok) {
        throw new Error(parseApiError(response.status, data));
    }
    const item = data.items?.[0];
    const channelId = item?.snippet?.channelId || item?.id?.channelId;
    if (!channelId) return null;
    // Resolve full name via channels.list so name/thumbnail are accurate
    return fetchChannelByParams(`id=${encodeURIComponent(channelId)}`);
}

async function resolveChannel(extracted) {
    if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY === 'PASTE_API_KEY_HERE') {
        throw new Error('API key missing. Paste your key in script.js as YOUTUBE_API_KEY.');
    }

    if (extracted.type === 'id') {
        const found = await fetchChannelByParams(`id=${encodeURIComponent(extracted.value)}`);
        if (found) return found;
        throw new Error('Channel ID not found. Copy the /channel/UC... URL directly from YouTube.');
    }

    if (extracted.type === 'handle') {
        const handle = extracted.value.replace(/^@/, '');
        const found = await fetchChannelByParams(`forHandle=${encodeURIComponent(handle)}`);
        if (found) return found;
        // Handle lookup is strict — fall back to search before giving up
        showChannelStatus(`Handle @${handle} not found directly, trying search...`);
        const viaSearch = await searchChannelByName(handle);
        if (viaSearch) return viaSearch;
        throw new Error(`Handle @${handle} not found. Check spelling or use the /channel/UC... URL.`);
    }

    if (extracted.type === 'custom' || extracted.type === 'user') {
        // forUsername is deprecated — try it, then fall back to search
        try {
            const found = await fetchChannelByParams(`forUsername=${encodeURIComponent(extracted.value)}`);
            if (found) return found;
        } catch (e) {
            // ignore and try search fallback below
            console.warn('forUsername lookup failed, trying search:', e);
        }
        showChannelStatus(`/${extracted.type}/${extracted.value} needs search lookup, trying...`);
        const viaSearch = await searchChannelByName(extracted.value);
        if (viaSearch) return viaSearch;
        throw new Error(`/${extracted.type}/${extracted.value} could not be resolved. Open the channel on YouTube and copy the @handle or /channel/UC... URL instead — that always works.`);
    }

    if (extracted.type === 'search') {
        const viaSearch = await searchChannelByName(extracted.value);
        if (viaSearch) return viaSearch;
        throw new Error(`No channel found for "${extracted.value}". Use full @handle or /channel/ URL.`);
    }

    if (extracted.type === 'video') {
        // Resolve a video/Shorts link to its owning channel (1 quota unit)
        const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${encodeURIComponent(extracted.value)}&key=${encodeURIComponent(YOUTUBE_API_KEY)}`;
        const response = await fetch(url);
        const data = await response.json().catch(() => null);
        if (!response.ok) {
            throw new Error(parseApiError(response.status, data));
        }
        const channelId = data.items?.[0]?.snippet?.channelId;
        if (!channelId) throw new Error('Video not found. Check the link and try again.');
        const found = await fetchChannelByParams(`id=${encodeURIComponent(channelId)}`);
        if (found) return found;
        throw new Error('Could not resolve the channel for that video.');
    }

    throw new Error('Unsupported URL format.');
}

async function addChannel() {
    const url = channelInput.value.trim();
    if (!url) return;

    if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY === 'PASTE_API_KEY_HERE') {
        showChannelError('API key missing. Open script.js and set YOUTUBE_API_KEY.');
        return;
    }

    const extracted = extractChannelId(url);
    if (!extracted) {
        showChannelError('Unrecognized URL. Use a channel URL (@handle or /channel/UC...), a video/Shorts link, or a plain channel name.');
        return;
    }

    showChannelError(null);
    channelInput.value = '';
    addChannelBtn.disabled = true;
    addChannelBtn.textContent = 'Resolving...';
    showChannelStatus(`Resolving ${extracted.type}: ${extracted.value}...`);

    try {
        const channelData = await resolveChannel(extracted);
        if (!channelData) throw new Error('Channel not found');

        const duplicate = channels.some(c => c.id === channelData.id);
        if (duplicate) {
            showChannelStatus(null);
            showChannelError(`"${channelData.name}" is already added.`);
            return;
        }

        channels.push({
            id: channelData.id,
            name: channelData.name,
            type: extracted.type,
            value: extracted.value,
            handle: channelData.handle || null
        });
        saveChannels();
        renderChannels();
        updateChannelCount();
        showChannelStatus(`Added "${channelData.name}". Loading videos...`);
        await refreshAll();
        showChannelStatus(null);
    } catch (err) {
        console.error('Failed to add channel:', err);
        showChannelStatus(null);
        showChannelError(err.message || 'Failed to resolve channel. Check the URL and try again.');
    } finally {
        addChannelBtn.disabled = false;
        addChannelBtn.textContent = 'Add';
    }
}

function removeChannel(channelId) {
    channels = channels.filter(c => c.id !== channelId);
    // Purge that channel's videos too (previously they stayed on screen)
    allVideos = allVideos.filter(v => v.channelId !== channelId);
    saveChannels();
    renderChannels();
    updateChannelCount();
    filterAndRender();
}

function renderChannels() {
    // Per-channel 24h video counts, so you can SEE each channel contributing
    const counts = new Map();
    allVideos.forEach(v => counts.set(v.channelId, (counts.get(v.channelId) || 0) + 1));

    channelList.innerHTML = '';
    channels.forEach(c => {
        const n = counts.get(c.id) || 0;
        const failed = failedChannels.has(c.id);
        const li = document.createElement('li');
        li.className = 'channel-item' + (failed ? ' failed' : '');
        li.dataset.channelId = c.id;
        li.title = failed
            ? 'Failed to load — click Refresh to retry'
            : `${n} video${n !== 1 ? 's' : ''} in 24h`;
        li.innerHTML = `
            <span class="channel-name">${escapeHtml(c.name)}</span>
            ${hasRefreshed ? `<span class="channel-count">${n}</span>` : ''}
            <button type="button" class="channel-remove" data-channel-id="${escapeHtml(c.id)}" title="Remove">×</button>
        `;
        channelList.appendChild(li);
    });
}

function updateChannelCount() {
    channelCountEl.textContent = `${channels.length} channel${channels.length !== 1 ? 's' : ''}`;
}

let refreshQueued = false;

async function refreshAll() {
    // If a refresh is already running, queue one more instead of dropping it.
    // (Previously a fast double-Add meant the 2nd channel's videos never loaded.)
    if (isLoading) {
        refreshQueued = true;
        return;
    }
    if (channels.length === 0) {
        filterAndRender();
        return;
    }

    isLoading = true;
    showLoading(true);
    showChannelError(null);
    failedChannels.clear();
    allVideos = [];

    const results = await Promise.allSettled(
        channels.map(c => fetchChannelVideos(c))
    );

    let okCount = 0;
    let failCount = 0;
    results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
            okCount++;
            allVideos.push(...result.value);
        } else {
            failCount++;
            console.error(`Failed to load channel ${channels[index].name}:`, result.reason);
            markChannelFailed(channels[index].id);
        }
    });

    filterAndRender();
    isLoading = false;
    hasRefreshed = true;
    renderChannels(); // refresh counts now that hasRefreshed is set
    showLoading(false);
    updateLastRefresh();

    if (failCount > 0) {
        const firstError = results.find(r => r.status === 'rejected')?.reason?.message;
        showChannelError(
            `${failCount} channel${failCount !== 1 ? 's' : ''} failed to load (${okCount} ok). ` +
            (firstError || 'Check API key / quota.')
        );
    }

    // Run the queued refresh if one was requested mid-load
    if (refreshQueued) {
        refreshQueued = false;
        await refreshAll();
    }
}

async function fetchChannelVideos(channel) {
    const uploadsPlaylistId = await getUploadsPlaylistId(channel.id);
    if (!uploadsPlaylistId) return [];

    const videos = await fetchPlaylistVideos(uploadsPlaylistId);
    return videos.map(v => ({
        ...v,
        channelName: channel.name,
        channelId: channel.id
    }));
}

async function getUploadsPlaylistId(channelId) {
    const url = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${encodeURIComponent(channelId)}&key=${encodeURIComponent(YOUTUBE_API_KEY)}`;
    const response = await fetch(url);
    const data = await response.json().catch(() => null);
    // Surface auth/quota problems instead of silently returning nothing
    if (!response.ok) {
        if (response.status === 400 || response.status === 403) {
            throw new Error(parseApiError(response.status, data));
        }
        return null;
    }
    return data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads || null;
}

async function fetchPlaylistVideos(playlistId) {
    // BUGFIX: previously only the first 50 uploads were checked, so busy
    // channels lost videos. Page through (newest-first) until we pass the
    // 24h cutoff — max 3 pages as a quota safety cap.
    const cutoff = Date.now() - MAX_AGE_HOURS * 60 * 60 * 1000;
    const key = encodeURIComponent(YOUTUBE_API_KEY);
    let pageToken = '';
    const rawItems = [];
    for (let page = 0; page < 3; page++) {
        const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${encodeURIComponent(playlistId)}&maxResults=50${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}&key=${key}`;
        const response = await fetch(url);
        const data = await response.json().catch(() => null);
        if (!response.ok) {
            if (response.status === 400 || response.status === 403) {
                throw new Error(parseApiError(response.status, data));
            }
            return [];
        }
        if (!data.items?.length) break;
        rawItems.push(...data.items);
        const oldest = data.items[data.items.length - 1];
        const oldestTime = new Date(oldest?.snippet?.publishedAt || 0).getTime();
        pageToken = data.nextPageToken || '';
        if (!pageToken || oldestTime < cutoff) break;
    }

    const ids = [...new Set(rawItems.map(item => item.contentDetails?.videoId).filter(Boolean))];
    if (!ids.length) return [];

    // videos.list takes max 50 ids per call — chunk it
    const statsItems = [];
    for (let i = 0; i < ids.length; i += 50) {
        const chunk = ids.slice(i, i + 50).join(',');
        const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${chunk}&key=${key}`;
        const statsResponse = await fetch(statsUrl);
        const statsData = await statsResponse.json().catch(() => null);
        if (!statsResponse.ok) {
            if (statsResponse.status === 400 || statsResponse.status === 403) {
                throw new Error(parseApiError(statsResponse.status, statsData));
            }
            continue;
        }
        if (statsData.items) statsItems.push(...statsData.items);
    }
    if (!statsItems.length) return [];
    const statsData = { items: statsItems };

    const now = Date.now();
    return statsData.items.map(item => {
        const publishedAt = item.snippet.publishedAt;
        const publishedTime = new Date(publishedAt).getTime();
        const hoursSinceUpload = Math.max((now - publishedTime) / (1000 * 60 * 60), 1/60);
        const viewCount = parseInt(item.statistics.viewCount || '0', 10);
        const viewsPerHour = viewCount / hoursSinceUpload;

        const v = {
            id: item.id,
            title: item.snippet.title || '(untitled)',
            // Kept for Trending Sounds detection (memory only, never localStorage)
            description: (item.snippet.description || '').slice(0, 1000),
            tags: Array.isArray(item.snippet.tags) ? item.snippet.tags.slice(0, 20) : [],
            categoryId: item.snippet.categoryId || '',
            publishedAt,
            viewCount,
            viewsPerHour,
            hoursSinceUpload,
            durationSec: parseDurationSec(item.contentDetails?.duration),
            thumbnail: item.snippet.thumbnails?.medium?.url
                || item.snippet.thumbnails?.default?.url
                || `https://i.ytimg.com/vi/${item.id}/mqdefault.jpg`,
            url: `https://youtube.com/watch?v=${item.id}`
        };
        // Detected music mentions for THIS video (used on cards + sound->video map)
        v.sounds = extractMusicMentions(v).map(s => s.display);
        return v;
    });
}

function markChannelFailed(channelId) {
    failedChannels.add(channelId);
    const pill = channelList.querySelector(`li.channel-item[data-channel-id="${CSS.escape(channelId)}"]`);
    if (pill) {
        pill.classList.add('failed');
        pill.title = 'Failed to load — click Refresh to retry';
    }
}

function filterAndRender() {
    const cutoff = Date.now() - MAX_AGE_HOURS * 60 * 60 * 1000;
    allVideos = allVideos.filter(v => new Date(v.publishedAt).getTime() >= cutoff);
    // Helpful empty state: no channels vs channels-but-quiet are different situations
    if (channels.length === 0) {
        emptyState.textContent = 'Add some YouTube channels to start tracking.';
    } else {
        emptyState.textContent = 'No recent uploads found.';
    }
    calculateFastThreshold();
    renderChannels(); // keeps per-channel 24h counts fresh
    renderVideos();
    renderMostViewed();
    renderFastestGrowing();
    renderHashtags();
    renderSounds();
    if (currentView === 'haxified') renderHaxifiedBest();
    renderTrendingKeywords();
    renderTitlePatterns();
    renderStats();
    updateVideoCount();
}

function calculateFastThreshold() {
    if (allVideos.length === 0) {
        window.fastThreshold = 0;
        return;
    }
    const vphValues = allVideos.map(v => v.viewsPerHour).sort((a, b) => a - b);
    const idx = Math.floor(vphValues.length * 0.75);
    window.fastThreshold = vphValues[idx] || 0;
}

function updateVideoCount() {
    videoCountEl.textContent = `${allVideos.length} video${allVideos.length !== 1 ? 's' : ''}`;
}

function updateLastRefresh() {
    const now = new Date();
    lastRefreshEl.textContent = `Last refresh: ${now.toLocaleTimeString()}`;
}

function showLoading(show) {
    loadingOverlay.classList.toggle('hidden', !show);
    refreshBtn.disabled = show;
    refreshBtn.textContent = show ? 'Loading...' : 'Refresh';
}

function sortVideos(videos) {
    const sorted = [...videos];
    switch (currentSort) {
        case 'latest':
            sorted.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
            break;
        case 'most-viewed':
            sorted.sort((a, b) => b.viewCount - a.viewCount);
            break;
        case 'trending-fast':
            sorted.sort((a, b) => b.viewsPerHour - a.viewsPerHour);
            break;
        case 'channel':
            sorted.sort((a, b) => {
                const nameCompare = a.channelName.localeCompare(b.channelName);
                if (nameCompare !== 0) return nameCompare;
                return new Date(b.publishedAt) - new Date(a.publishedAt);
            });
            break;
    }
    return sorted;
}

function renderVideos() {
    const sorted = sortVideos(allVideos);
    videosContainer.innerHTML = '';
    emptyState.classList.toggle('hidden', sorted.length > 0);

    sorted.forEach(video => {
        const card = document.createElement('div');
        card.className = 'video-card';
        const isFast = video.viewsPerHour >= (window.fastThreshold || Infinity) && window.fastThreshold > 0;
        const vphFormatted = formatNumber(video.viewsPerHour) + '/hour';
        const vphClass = isFast ? 'video-vph fast' : 'video-vph';
        const videoSounds = video.sounds || [];
        const soundText = videoSounds.slice(0, 2).join(' · ');

        card.innerHTML = `
            <img class="video-thumbnail" src="${escapeHtml(video.thumbnail)}" alt="" loading="lazy">
            <div class="video-info">
                <div class="video-channel">${escapeHtml(video.channelName)}</div>
                <div class="video-title">${escapeHtml(video.title)}</div>
                <div class="video-meta">
                    <div class="video-meta-row">
                        <span class="video-time">${formatRelativeTime(video.publishedAt)}</span>
                        <span class="video-views">${formatNumber(video.viewCount)} views</span>
                    </div>
                    <div class="video-meta-row">
                        <span class="${vphClass}">${vphFormatted}</span>
                        ${isFast ? '<span class="fast-badge">🔥 FAST</span>' : ''}
                    </div>
                    ${soundText ? `<div class="video-meta-row"><span class="video-sound" title="${escapeHtml(soundText)}">♪ ${escapeHtml(soundText)}</span></div>` : ''}
                </div>
                <div class="video-actions">
                    <a class="watch-btn" href="${escapeHtml(video.url)}" target="_blank" rel="noopener" data-url="${escapeHtml(video.url)}">Watch</a>
                </div>
            </div>
        `;
        videosContainer.appendChild(card);
    });
}

function renderMostViewed() {
    const sorted = [...allVideos].sort((a, b) => b.viewCount - a.viewCount);
    mostViewedList.innerHTML = '';
    noMostViewed.classList.toggle('hidden', sorted.length > 0);

    sorted.slice(0, 10).forEach((video, index) => {
        const li = document.createElement('li');
        li.className = 'ranked-item';
        li.innerHTML = `
            <span class="rank-number">${String(index + 1).padStart(2, '0')}</span>
            <div class="rank-content">
                <div class="rank-channel">${escapeHtml(video.channelName)}</div>
                <div class="rank-title">${escapeHtml(video.title)}</div>
                <div class="rank-views">${formatNumber(video.viewCount)} views</div>
            </div>
        `;
        mostViewedList.appendChild(li);
    });
}

function renderFastestGrowing() {
    const sorted = [...allVideos].sort((a, b) => b.viewsPerHour - a.viewsPerHour);
    fastestGrowingList.innerHTML = '';
    noFastestGrowing.classList.toggle('hidden', sorted.length > 0);

    sorted.slice(0, 10).forEach((video, index) => {
        const li = document.createElement('li');
        li.className = 'ranked-item';
        li.innerHTML = `
            <span class="rank-number">${String(index + 1).padStart(2, '0')}</span>
            <div class="rank-content">
                <div class="rank-channel">${escapeHtml(video.channelName)}</div>
                <div class="rank-title">${escapeHtml(video.title)}</div>
                <div class="rank-views">${formatNumber(video.viewsPerHour)} views/hour</div>
            </div>
        `;
        fastestGrowingList.appendChild(li);
    });
}

function renderHashtags() {
    const hashtags = generateHashtags(allVideos);
    hashtagList.innerHTML = '';
    noHashtags.classList.toggle('hidden', hashtags.length > 0);
    copyHashtagsBtn.classList.toggle('hidden', hashtags.length === 0);

    hashtags.forEach(({ tag, score, frequency, channels: channelCount, avgViews, avgVph }) => {
        const span = document.createElement('span');
        span.className = 'hashtag';
        // data-tag holds the pure tag: textContent also contains score + tooltip text,
        // so copying from textContent grabbed junk (old bug).
        span.dataset.tag = tag;
        span.innerHTML = `
            ${escapeHtml(tag)}
            <span class="hashtag-score">${Math.round(score)}</span>
            <div class="hashtag-tooltip">
                <div class="hashtag-tooltip-title">${escapeHtml(tag)}</div>
                <div class="hashtag-tooltip-row"><span>Found in:</span><strong>${frequency} titles</strong></div>
                <div class="hashtag-tooltip-row"><span>Channels:</span><strong>${channelCount}</strong></div>
                <div class="hashtag-tooltip-row"><span>Avg views:</span><strong>${formatNumber(avgViews)}</strong></div>
                <div class="hashtag-tooltip-row"><span>Avg views/hour:</span><strong>${formatNumber(avgVph)}/hr</strong></div>
            </div>
        `;
        span.title = 'Click to copy';
        hashtagList.appendChild(span);
    });
}

async function copyText(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        // file:// or non-secure contexts may block the Clipboard API — fallback
        try {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            return true;
        } catch {
            return false;
        }
    }
}

function copyAllHashtags() {
    const tags = Array.from(hashtagList.querySelectorAll('.hashtag')).map(h => h.dataset.tag).filter(Boolean);
    if (tags.length === 0) return;
    copyText(tags.join(' '));
    copyHashtagsBtn.textContent = 'COPIED!';
    copyHashtagsBtn.style.background = 'var(--green)';
    copyHashtagsBtn.style.borderColor = 'var(--green)';
    setTimeout(() => {
        copyHashtagsBtn.textContent = 'COPY ALL';
        copyHashtagsBtn.style.background = '';
        copyHashtagsBtn.style.borderColor = '';
    }, 1500);
}

function copyHashtag(el) {
    const tag = el.dataset.tag;
    if (!tag) return;
    copyText(tag);
    el.classList.add('copied');
    setTimeout(() => el.classList.remove('copied'), 800);
}

// sound key (lowercased mention) -> videos using it
function getSoundUsage(videos) {
    const usage = new Map();
    videos.forEach(v => {
        (v.sounds || []).forEach(d => {
            const k = String(d).toLowerCase();
            if (!usage.has(k)) usage.set(k, []);
            usage.get(k).push(v);
        });
    });
    return usage;
}

function renderSounds() {
    if (!soundList) return;
    const sounds = calculateMusicScores(allVideos).slice(0, 12);
    const usage = getSoundUsage(allVideos);
    soundList.innerHTML = '';
    noSounds.classList.toggle('hidden', sounds.length > 0);
    copySoundsBtn.classList.toggle('hidden', sounds.length === 0);

    sounds.forEach(item => {
        const li = document.createElement('li');
        li.className = 'term-item';
        li.dataset.sound = item.display;
        li.title = 'Click to see which videos use this sound';
        li.style.cursor = 'pointer';
        li.innerHTML = `
            <div class="term-detail">
                <span class="term-main">${escapeHtml(item.display)}</span>
                <span class="term-meta">${item.frequency} titles · ${item.channels} channels · ${formatNumber(item.avgViews)} avg views</span>
            </div>
            <span class="term-count">${Math.round(item.score)}</span>
        `;
        const detailBox = li.querySelector('.term-detail');
        const usedIn = document.createElement('ul');
        usedIn.className = 'sound-videos hidden';
        (usage.get(item.term) || []).slice(0, 6).forEach(v => {
            const raw = v.title || '';
            const short = raw.length > 45 ? raw.slice(0, 45) + '…' : raw;
            const dli = document.createElement('li');
            dli.innerHTML = `<strong>${escapeHtml(v.channelName)}</strong> — ${escapeHtml(short)} · ${formatNumber(v.viewCount)} views`;
            usedIn.appendChild(dli);
        });
        detailBox.appendChild(usedIn);
        li.addEventListener('click', () => {
            usedIn.classList.toggle('hidden');
        });
        soundList.appendChild(li);
    });
}

function copyAllSounds() {
    const names = Array.from(soundList.querySelectorAll('.term-item')).map(li => li.dataset.sound).filter(Boolean);
    if (names.length === 0) return;
    copyText(names.join(', '));
    copySoundsBtn.textContent = 'COPIED!';
    setTimeout(() => { copySoundsBtn.textContent = 'COPY ALL'; }, 1500);
}

function renderTrendingKeywords() {
    const keywords = getTrendingKeywords(allVideos);
    trendingKeywordsList.innerHTML = '';
    noTrendingKeywords.classList.toggle('hidden', keywords.length > 0);

    keywords.forEach(({ term, frequency, channels: channelCount, avgViews, avgVph, score }) => {
        const li = document.createElement('li');
        li.className = 'term-item';
        li.innerHTML = `
            <div class="term-detail">
                <span class="term-main">${escapeHtml(term)}</span>
                <span class="term-meta">${frequency} titles · ${channelCount} channels · ${formatNumber(avgViews)} avg views</span>
            </div>
            <span class="term-count">${Math.round(score)}</span>
        `;
        trendingKeywordsList.appendChild(li);
    });
}

function renderTitlePatterns() {
    const patterns = getTitlePatterns(allVideos);
    titlePatternsList.innerHTML = '';
    noTitlePatterns.classList.toggle('hidden', patterns.length > 0);

    patterns.forEach(({ pattern, count }) => {
        const li = document.createElement('li');
        li.className = 'term-item';
        li.innerHTML = `
            <div class="term-detail">
                <span class="term-main">"${escapeHtml(pattern)}"</span>
                <span class="term-meta">Found in <strong>${count}</strong> titles</span>
            </div>
        `;
        titlePatternsList.appendChild(li);
    });
}

function renderStats() {
    totalVideosEl.textContent = allVideos.length;
    // Total tracked channels, not just ones with recent uploads
    totalChannelsEl.textContent = channels.length;

    if (allVideos.length > 0) {
        const latest = allVideos.reduce((a, b) => new Date(a.publishedAt) > new Date(b.publishedAt) ? a : b);
        const mostViewed = allVideos.reduce((a, b) => a.viewCount > b.viewCount ? a : b);

        newestVideoEl.textContent = formatRelativeTime(latest.publishedAt);
        // textContent auto-escapes — escapeHtml() here showed literal &amp; entities (old bug)
        const t = mostViewed.title || '';
        mostViewedVideoEl.textContent = t.length > 40 ? t.slice(0, 40) + '...' : t;
    } else {
        newestVideoEl.textContent = '—';
        mostViewedVideoEl.textContent = '—';
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatRelativeTime(isoString) {
    const diff = Date.now() - new Date(isoString).getTime();
    if (!isFinite(diff) || diff < 0) return 'just now';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours >= 24) {
        const days = Math.floor(hours / 24);
        const remH = hours % 24;
        return remH > 0 ? `${days}d ${remH}h ago` : `${days}d ago`;
    }
    if (hours > 0) return `${hours}h ${minutes}m ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'just now';
}

function parseDurationSec(iso) {
    const m = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso || '');
    if (!m) return 0;
    return (+m[1] || 0) * 86400 + (+m[2] || 0) * 3600 + (+m[3] || 0) * 60 + (+m[4] || 0);
}

function formatNumber(num) {
    if (!isFinite(num)) return 'N/A';
    if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return Math.round(num).toString();
}

function normalizeText(text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function extractTokens(text) {
    const normalized = normalizeText(text);
    const words = normalized.split(' ').filter(w => w.length > 1 && !STOP_WORDS.has(w) && !GENERIC_WORDS.has(w));
    return words;
}

function extractPhrases(words) {
    const phrases = new Set();
    for (let i = 0; i < words.length - 1; i++) {
        const two = words[i] + ' ' + words[i + 1];
        if (words[i].length > 2 && words[i + 1].length > 2) phrases.add(two);
        if (i < words.length - 2) {
            const three = words[i] + ' ' + words[i + 1] + ' ' + words[i + 2];
            if (words[i].length > 2 && words[i + 1].length > 2 && words[i + 2].length > 2) phrases.add(three);
        }
    }
    return Array.from(phrases);
}

function collectVideoRecency(video, now) {
    const hoursAgo = (now - new Date(video.publishedAt).getTime()) / (1000 * 60 * 60);
    return Math.max(0, 1 - hoursAgo / MAX_AGE_HOURS);
}

function addTermHit(termStats, term, video, recencyFactor) {
    if (!termStats.has(term)) {
        termStats.set(term, {
            frequency: 0,
            channels: new Set(),
            totalViews: 0,
            totalVph: 0,
            totalRecency: 0,
            videos: 0
        });
    }
    const stats = termStats.get(term);
    stats.frequency++;
    stats.channels.add(video.channelId);
    stats.totalViews += video.viewCount;
    stats.totalVph += video.viewsPerHour;
    stats.totalRecency += recencyFactor;
    stats.videos++;
}

function calculateKeywordScores(videos) {
    if (videos.length < 2) return [];

    const termStats = new Map();
    const now = Date.now();

    videos.forEach(video => {
        const words = extractTokens(video.title);
        const phrases = extractPhrases(words);
        const allTerms = [...words, ...phrases];
        const uniqueTerms = new Set(allTerms);

        const recencyFactor = collectVideoRecency(video, now);
        uniqueTerms.forEach(term => addTermHit(termStats, term, video, recencyFactor));
    });

    return scoreTermStats(termStats);
}

// Shared normalized scoring: frequency + channel diversity + avg views +
// avg views/hour + recency, plus a small multi-channel boost.
// Used by both keyword/hashtag ranking and sound ranking.
function scoreTermStats(termStats) {
    const freqValues = Array.from(termStats.values()).map(s => s.frequency);
    const channelValues = Array.from(termStats.values()).map(s => s.channels.size);
    const viewValues = Array.from(termStats.values()).map(s => s.totalViews / s.videos);
    const vphValues = Array.from(termStats.values()).map(s => s.totalVph / s.videos);
    const recencyValues = Array.from(termStats.values()).map(s => s.totalRecency / s.videos);

    const maxFreq = Math.max(...freqValues, 1);
    const maxChannels = Math.max(...channelValues, 1);
    const maxView = Math.max(...viewValues, 1);
    const maxVph = Math.max(...vphValues, 1);
    const maxRecency = Math.max(...recencyValues, 1);

    const scored = [];
    termStats.forEach((stats, term) => {
        if (stats.frequency < 2 && stats.videos < 2) return;

        const normFreq = stats.frequency / maxFreq;
        const normChannels = stats.channels.size / maxChannels;
        const normViews = (stats.totalViews / stats.videos) / maxView;
        const normVph = (stats.totalVph / stats.videos) / maxVph;
        const normRecency = (stats.totalRecency / stats.videos) / maxRecency;

        const channelBoost = Math.min(stats.channels.size / 3, 1) * 0.3;
        const score = (
            normFreq * 0.25 +
            normChannels * 0.25 +
            normViews * 0.15 +
            normVph * 0.20 +
            normRecency * 0.15
        ) * 100 + channelBoost * 100;

        scored.push({
            term,
            score,
            frequency: stats.frequency,
            channels: stats.channels.size,
            avgViews: stats.totalViews / stats.videos,
            avgVph: stats.totalVph / stats.videos
        });
    });

    scored.sort((a, b) => b.score - a.score);
    return scored;
}

// NOTE: YouTube Data API has no TikTok-style "sound" field, so the honest
// proxy is music mentions found in the collected titles, tags and
// descriptions. Nothing is invented — a sound only ranks when it actually
// appears in the loaded videos.
const MUSIC_CATEGORY_ID = '10'; // YouTube's own Music category

const MUSIC_MARKER_ONLY = /^(official\s*(music\s*video|audio|video|mv|lyric(s)?\s*video)|music\s*video|lyric(s)?\s*video|m\/v|ost|amv|audio|lyrics?|cover|remix|mashup|sped\s*up|slowed(\s*\+?\s*reverb)?|8d(\s*audio)?|bass\s*boosted|nightcore|tiktok(\s*(version|remix|song|sound))?|viral\s*(song|sound|tiktok)?|full\s*song|theme\s*song|soundtrack)$/i;

const MUSIC_TITLE_HINT = /(official\s*(music\s*video|audio|video)|lyric(s)?\s*video|music\s*video|\bm\/v\b|\(\s*ost\s*\)|\bost\b|cover|remix|mashup|lofi|phonk|sped\s*up|slowed|8d\s*audio|nightcore|\bft\.?|\bfeat\.?|featuring|\bprod\.?(\s*by)?|\bdj\b|soundtrack|theme\s*song|official\s*audio)/i;

function stripBrackets(s) {
    return s.replace(/\([^)]*\)/g, ' ').replace(/\[[^\]]*\]/g, ' ').replace(/\s+/g, ' ').trim();
}

function isUselessSoundCandidate(text) {
    const t = (text || '').trim();
    if (t.length < 2 || t.length > 80) return true;
    if (/https?:\/\//i.test(t) || /@\w+\.\w+/.test(t)) return true; // urls / emails
    if (!/[a-zA-Z\u0080-\uFFFF]/.test(t)) return true; // no letters at all
    if (MUSIC_MARKER_ONLY.test(t)) return true; // e.g. bare "Official Audio"
    const tokens = normalizeText(t).split(' ').filter(Boolean);
    if (tokens.length === 0) return true;
    // Skip if every word is a stop/generic word (e.g. "Official Music Video")
    if (tokens.every(w => STOP_WORDS.has(w) || GENERIC_WORDS.has(w))) return true;
    return false;
}

function extractMusicMentions(video) {
    // Returns [{ key, display }] deduped per video
    const found = new Map();
    const push = (raw) => {
        if (!raw) return;
        const display = String(raw)
            .replace(/\s+/g, ' ')
            .trim()
            .replace(/^[""«']+|[""»']+$/g, '')
            .trim();
        if (isUselessSoundCandidate(display)) return;
        const key = display.toLowerCase();
        if (!found.has(key)) found.set(key, display);
    };

    const title = video.title || '';

    // 1. Quoted strings: "Blinding Lights" — usually the song name
    const quoteRe = /[""«]([^""»]{2,60})[""»]|'([^']{2,60})'/g;
    let m;
    while ((m = quoteRe.exec(title)) !== null) push(m[1] || m[2]);

    // 2. "Artist - Song" / "Artist | Song" splits (brackets stripped first)
    const dashParts = title.split(/\s+[-–—|]\s+/);
    if (dashParts.length >= 2) dashParts.forEach(p => push(stripBrackets(p)));

    // 3. Parenthetical bits that are NOT pure markers: "(Naruto AMV)"
    const parenRe = /\(([^)]{2,50})\)/g;
    while ((m = parenRe.exec(title)) !== null) push(m[1]);

    // 4. If the title smells like music, the cleaned core is a candidate too
    if (MUSIC_TITLE_HINT.test(title)) push(stripBrackets(title).replace(/[""«»']/g, ''));

    // 5. Tags — often the artist / song names
    (video.tags || []).forEach(push);

    // 6. Description: "Song: X" lines and 🎵/🎶 lines
    const desc = (video.description || '').slice(0, 800);
    desc.split('\n').forEach(line => {
        const l = line.trim();
        if (!l) return;
        const labelMatch = l.match(/^(?:song|track|title|music|audio|sound)\s*[:\-–]\s*(.+)$/i);
        if (labelMatch) {
            push(labelMatch[1].slice(0, 80));
            return;
        }
        if (/🎵|🎶|🎧/.test(l)) {
            push(l.replace(/🎵|🎶|🎧/g, ' ').replace(/https?:\/\/\S+/g, ' ').slice(0, 80));
        }
    });

    return Array.from(found.entries()).map(([key, display]) => ({ key, display }));
}

function calculateMusicScores(videos) {
    if (videos.length < 2) return [];

    const termStats = new Map();
    const displays = new Map(); // key -> original-casing display text
    const musicCat = new Map(); // key -> #videos YouTube categorized as Music
    const now = Date.now();

    videos.forEach(video => {
        const recencyFactor = collectVideoRecency(video, now);
        extractMusicMentions(video).forEach(({ key, display }) => {
            addTermHit(termStats, key, video, recencyFactor);
            if (!displays.has(key)) displays.set(key, display);
            if (video.categoryId === MUSIC_CATEGORY_ID) {
                musicCat.set(key, (musicCat.get(key) || 0) + 1);
            }
        });
    });

    const scored = scoreTermStats(termStats);
    // Small boost when YouTube itself labeled the video as Music category
    scored.forEach(item => {
        if (musicCat.get(item.term) > 0) item.score += 8;
        item.display = displays.get(item.term) || item.term;
    });
    scored.sort((a, b) => b.score - a.score);
    return scored;
}

function generateHashtags(videos) {
    if (videos.length < 3) return [];

    const scored = calculateKeywordScores(videos);
    const top = scored.slice(0, 15);

    return top.map(item => ({
        tag: toHashtag(item.term),
        score: item.score,
        frequency: item.frequency,
        channels: item.channels,
        avgViews: item.avgViews,
        avgVph: item.avgVph
    }));
}

function getTrendingKeywords(videos) {
    if (videos.length < 2) return [];

    const scored = calculateKeywordScores(videos);
    return scored.slice(0, 15).map(item => ({
        term: item.term
            .split(' ')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' '),
        frequency: item.frequency,
        channels: item.channels,
        avgViews: item.avgViews,
        avgVph: item.avgVph,
        score: item.score
    }));
}

function getTitlePatterns(videos) {
    if (videos.length < 3) return [];

    const phraseCounts = new Map();
    const phraseChannels = new Map();

    videos.forEach(video => {
        const words = extractTokens(video.title);
        const phrases = extractPhrases(words);
        const uniquePhrases = new Set(phrases);

        uniquePhrases.forEach(phrase => {
            phraseCounts.set(phrase, (phraseCounts.get(phrase) || 0) + 1);
            if (!phraseChannels.has(phrase)) phraseChannels.set(phrase, new Set());
            phraseChannels.get(phrase).add(video.channelId);
        });
    });

    const patterns = [];
    phraseCounts.forEach((count, phrase) => {
        if (count >= 2) {
            patterns.push({
                pattern: phrase
                    .split(' ')
                    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(' '),
                count,
                channels: phraseChannels.get(phrase)?.size || 0
            });
        }
    });

    patterns.sort((a, b) => b.count - a.count || b.channels - a.channels);
    return patterns.slice(0, 15);
}