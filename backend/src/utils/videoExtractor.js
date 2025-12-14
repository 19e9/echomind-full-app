const youtubedl = require('youtube-dl-exec');
const axios = require('axios');

/**
 * Extract direct video URL from TikTok using tikwm.com API
 */
const extractTikTokUrl = async (url) => {
    try {
        console.log('Extracting TikTok video via tikwm.com API...');

        const response = await axios.get('https://www.tikwm.com/api/', {
            params: { url: url, hd: 1 },
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 30000
        });

        if (response.data && response.data.code === 0 && response.data.data) {
            const data = response.data.data;
            // HD video veya normal video URL'i
            const videoUrl = data.hdplay || data.play;

            if (videoUrl) {
                console.log('TikTok video URL extracted successfully');
                return {
                    success: true,
                    directUrl: videoUrl,
                    title: data.title || '',
                    thumbnail: data.cover || data.origin_cover || '',
                    duration: data.duration || 0,
                };
            }
        }

        console.log('TikTok API response:', response.data);
        return { success: false, error: 'Could not extract TikTok video' };
    } catch (error) {
        console.error('TikTok extraction error:', error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Extract direct video URL from social media links
 * Supports: YouTube, TikTok, Instagram, Twitter/X
 */
const extractVideoUrl = async (url) => {
    try {
        console.log('Extracting video URL from:', url);

        // TikTok için özel API kullan
        if (url.includes('tiktok.com')) {
            return await extractTikTokUrl(url);
        }

        // Diğer platformlar için yt-dlp kullan
        const result = await youtubedl(url, {
            dumpSingleJson: true,
            noCheckCertificates: true,
            noWarnings: true,
            preferFreeFormats: true,
            format: 'best[ext=mp4]/best',
            addHeader: ['User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'],
        });

        if (result && result.url) {
            console.log('Extracted direct URL:', result.url.substring(0, 100) + '...');
            return {
                success: true,
                directUrl: result.url,
                title: result.title || '',
                description: result.description || '',
                duration: result.duration || 0,
                thumbnail: result.thumbnail || '',
            };
        }

        // Bazı platformlarda 'formats' array'i var
        if (result && result.formats && result.formats.length > 0) {
            const mp4Format = result.formats.find(f => f.ext === 'mp4' && f.url)
                || result.formats.find(f => f.url);

            if (mp4Format) {
                console.log('Extracted from formats:', mp4Format.url.substring(0, 100) + '...');
                return {
                    success: true,
                    directUrl: mp4Format.url,
                    title: result.title || '',
                    description: result.description || '',
                    duration: result.duration || 0,
                    thumbnail: result.thumbnail || '',
                };
            }
        }

        return { success: false, error: 'Could not extract video URL' };
    } catch (error) {
        console.error('Video extraction error:', error.message);
        return {
            success: false,
            error: error.message || 'Failed to extract video',
            fallbackToOriginal: true
        };
    }
};

/**
 * Check if URL is a social media link that needs extraction
 */
const needsExtraction = (url) => {
    const socialPatterns = [
        /youtube\.com/i,
        /youtu\.be/i,
        /tiktok\.com/i,
        /instagram\.com/i,
        /twitter\.com/i,
        /x\.com/i,
        /facebook\.com/i,
        /fb\.watch/i,
    ];

    return socialPatterns.some(pattern => pattern.test(url));
};

/**
 * Check if URL is already a direct video URL
 */
const isDirectVideoUrl = (url) => {
    const videoExtensions = ['.mp4', '.webm', '.m3u8', '.mov', '.avi'];
    return videoExtensions.some(ext => url.toLowerCase().includes(ext));
};

module.exports = {
    extractVideoUrl,
    extractTikTokUrl,
    needsExtraction,
    isDirectVideoUrl,
};
