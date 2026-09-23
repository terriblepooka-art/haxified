const YOUTUBE_API_KEY = "AIzaSyDik5fNs1j96Jk1FPS_AlhrVuQd-EJejWY";
const MAX_AGE_HOURS = 12;

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
let isLoading = false;

const refreshBtn = document.getElementById('refreshBtn');
const channelInput = document.getElementById('channelInput');
const addChannelBtn = document.getElementById('addChannelBtn');
const channelList = document.getElementById('channelList');
const videosContainer = document.getElementById('videosContainer');
const emptyState = document.getElementById('emptyState');
const mostViewedList = document.getElementById('mostViewedList');
const noMostViewed = document.getElementById('noMostViewed');
const fastestGrowingList = document.getElementById('fastestGrowingList');
const noFastestGrowing = document.getElementById('noFastestGrowing');
const hashtagList = document.getElementById('hashtagList');
const noHashtags = document.getElementById('noHashtags');
const copyHashtagsBtn = document.getElementById('copyHashtagsBtn');
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

    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentSort = btn.dataset.sort;
            document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderVideos();
            renderMostViewed();
            renderFastestGrowing();
        });
    });

    copyHashtagsBtn.addEventListener('click', copyAllHashtags);

    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('hashtag') || e.target.closest('.hashtag')) {
            const hashtagEl = e.target.classList.contains('hashtag') ? e.target : e.target.closest('.hashtag');
            copyHashtag(hashtagEl);
        }
        if (e.target.classList.contains('watch-btn') || e.target.closest('.watch-btn')) {
            const btn = e.target.classList.contains('watch-btn') ? e.target : e.target.closest('.watch-btn');
            const url = btn.dataset.url;
            if (url) window.open(url, '_blank');
        }
        if (e.target.classList.contains('channel-remove')) {
            removeChannel(e.target.dataset.channelId);
        }
    });
}

function loadChannels() {
    const stored = localStorage.getItem('titleRadarChannels');
    if (stored) {
        try {
            channels = JSON.parse(stored);
        } catch {
            channels = [];
        }
    }
}

function saveChannels() {
    localStorage.setItem('titleRadarChannels', JSON.stringify(channels));
}

function extractChannelId(url) {
    url = url.trim();

    const handleMatch = url.match(/youtube\.com\/@([^/?#]+)/i);
    if (handleMatch) return { type: 'handle', value: handleMatch[1] };

    const channelIdMatch = url.match(/youtube\.com\/channel\/([^/?#]+)/i);
    if (channelIdMatch) return { type: 'id', value: channelIdMatch[1] };

    const customMatch = url.match(/youtube\.com\/c\/([^/?#]+)/i);
    if (customMatch) return { type: 'custom', value: customMatch[1] };

    const userMatch = url.match(/youtube\.com\/user\/([^/?#]+)/i);
    if (userMatch) return { type: 'user', value: userMatch[1] };

    if (url.startsWith('@')) return { type: 'handle', value: url.slice(1) };
    if (url.startsWith('UC') && url.length === 24) return { type: 'id', value: url };

    return null;
}

async function addChannel() {
    const url = channelInput.value.trim();
    if (!url) return;

    const extracted = extractChannelId(url);
    if (!extracted) {
        alert('Invalid YouTube channel URL. Use @handle, /channel/ID, /c/name, or /user/name');
        return;
    }

    const exists = channels.some(c => c.type === extracted.type && c.value === extracted.value);
    if (exists) {
        alert('Channel already added');
        return;
    }

    channelInput.value = '';
    addChannelBtn.disabled = true;
    addChannelBtn.textContent = 'Resolving...';

    try {
        const channelData = await resolveChannel(extracted);
        if (!channelData) throw new Error('Channel not found');

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
        await refreshAll();
    } catch (err) {
        console.error('Failed to add channel:', err);
        alert('Failed to resolve channel. Check the URL and try again.');
    } finally {
        addChannelBtn.disabled = false;
        addChannelBtn.textContent = 'Add';
    }
}

async function resolveChannel(extracted) {
    let url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails&key=${YOUTUBE_API_KEY}`;

    if (extracted.type === 'id') {
        url += `&id=${extracted.value}`;
    } else if (extracted.type === 'handle') {
        url += `&forHandle=${extracted.value}`;
    } else if (extracted.type === 'custom') {
        url += `&forUsername=${extracted.value}`;
    } else if (extracted.type === 'user') {
        url += `&forUsername=${extracted.value}`;
    }

    const response = await fetch(url);
    if (!response.ok) {
        if (response.status === 403) throw new Error('API quota exceeded or invalid key');
        throw new Error('Failed to fetch channel');
    }

    const data = await response.json();
    if (!data.items || data.items.length === 0) return null;

    const item = data.items[0];
    return {
        id: item.id,
        name: item.snippet.title,
        handle: item.snippet.customUrl ? item.snippet.customUrl.replace('@', '') : null
    };
}

function removeChannel(channelId) {
    channels = channels.filter(c => c.id !== channelId);
    saveChannels();
    renderChannels();
    updateChannelCount();
    filterAndRender();
}

function renderChannels() {
    channelList.innerHTML = '';
    channels.forEach(c => {
        const li = document.createElement('li');
        li.className = 'channel-item';
        li.innerHTML = `
            <span class="channel-name">${escapeHtml(c.name)}</span>
            <button class="channel-remove" data-channel-id="${c.id}" title="Remove">×</button>
        `;
        channelList.appendChild(li);
    });
}

function updateChannelCount() {
    channelCountEl.textContent = `${channels.length} channel${channels.length !== 1 ? 's' : ''}`;
}

async function refreshAll() {
    if (isLoading || channels.length === 0) return;

    isLoading = true;
    showLoading(true);
    allVideos = [];

    const results = await Promise.allSettled(
        channels.map(c => fetchChannelVideos(c))
    );

    results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
            allVideos.push(...result.value);
        } else {
            console.error(`Failed to load channel ${channels[index].name}:`, result.reason);
            markChannelFailed(channels[index].id);
        }
    });

    filterAndRender();
    isLoading = false;
    showLoading(false);
    updateLastRefresh();
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
    const url = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${YOUTUBE_API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    return data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads || null;
}

async function fetchPlaylistVideos(playlistId) {
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${playlistId}&maxResults=50&key=${YOUTUBE_API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) return [];
    const data = await response.json();
    if (!data.items) return [];

    const videoIds = data.items.map(item => item.contentDetails.videoId).join(',');
    if (!videoIds) return [];

    const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds}&key=${YOUTUBE_API_KEY}`;
    const statsResponse = await fetch(statsUrl);
    if (!statsResponse.ok) return [];
    const statsData = await statsResponse.json();
    if (!statsData.items) return [];

    const now = Date.now();
    return statsData.items.map(item => {
        const publishedAt = item.snippet.publishedAt;
        const publishedTime = new Date(publishedAt).getTime();
        const hoursSinceUpload = Math.max((now - publishedTime) / (1000 * 60 * 60), 1/60);
        const viewCount = parseInt(item.statistics.viewCount || '0', 10);
        const viewsPerHour = viewCount / hoursSinceUpload;

        return {
            id: item.id,
            title: item.snippet.title,
            publishedAt,
            viewCount,
            viewsPerHour,
            hoursSinceUpload,
            thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
            url: `https://youtube.com/watch?v=${item.id}`
        };
    });
}

function markChannelFailed(channelId) {
    const item = channelList.querySelector(`[data-channel-id="${channelId}"]`);
    if (item) {
        item.style.opacity = '0.5';
        item.title = 'Failed to load';
    }
}

function filterAndRender() {
    const cutoff = Date.now() - MAX_AGE_HOURS * 60 * 60 * 1000;
    allVideos = allVideos.filter(v => new Date(v.publishedAt).getTime() >= cutoff);
    calculateFastThreshold();
    renderVideos();
    renderMostViewed();
    renderFastestGrowing();
    renderHashtags();
    renderTrendingKeywords();
    renderTitlePatterns();
    renderStats();
    updateVideoCount();
}

function calculateFastThreshold() {
    if (allVideos.length === 0) return;
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
        span.innerHTML = `
            ${tag}
            <span class="hashtag-score">${Math.round(score)}</span>
            <div class="hashtag-tooltip">
                <div class="hashtag-tooltip-title">${tag}</div>
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

function copyAllHashtags() {
    const tags = Array.from(hashtagList.querySelectorAll('.hashtag')).map(h => h.textContent.trim().split('\n')[0].trim());
    if (tags.length === 0) return;
    navigator.clipboard.writeText(tags.join(' '));
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
    const tag = el.textContent.trim().split('\n')[0].trim();
    navigator.clipboard.writeText(tag);
    el.classList.add('copied');
    setTimeout(() => el.classList.remove('copied'), 800);
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
    totalChannelsEl.textContent = new Set(allVideos.map(v => v.channelId)).size;

    if (allVideos.length > 0) {
        const latest = allVideos.reduce((a, b) => new Date(a.publishedAt) > new Date(b.publishedAt) ? a : b);
        const mostViewed = allVideos.reduce((a, b) => a.viewCount > b.viewCount ? a : b);

        newestVideoEl.textContent = formatRelativeTime(latest.publishedAt);
        mostViewedVideoEl.textContent = `${escapeHtml(mostViewed.title.slice(0, 40))}${mostViewed.title.length > 40 ? '...' : ''}`;
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
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) return `${hours}h ${minutes}m ago`;
    return `${minutes}m ago`;
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

function calculateKeywordScores(videos) {
    if (videos.length < 2) return [];

    const termStats = new Map();
    const allViews = videos.map(v => v.viewCount);
    const allVph = videos.map(v => v.viewsPerHour);
    const maxViews = Math.max(...allViews, 1);
    const maxVph = Math.max(...allVph, 1);
    const now = Date.now();

    videos.forEach(video => {
        const words = extractTokens(video.title);
        const phrases = extractPhrases(words);
        const allTerms = [...words, ...phrases];
        const uniqueTerms = new Set(allTerms);

        const hoursAgo = (now - new Date(video.publishedAt).getTime()) / (1000 * 60 * 60);
        const recencyFactor = Math.max(0, 1 - hoursAgo / MAX_AGE_HOURS);

        uniqueTerms.forEach(term => {
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
        });
    });

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

function generateHashtags(videos) {
    if (videos.length < 3) return [];

    const scored = calculateKeywordScores(videos);
    const top = scored.slice(0, 15);

    return top.map(item => ({
        tag: '#' + item.term
            .split(' ')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(''),
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