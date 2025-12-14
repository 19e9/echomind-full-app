const Reel = require('../models/Reel');

// @desc    Get all reels (paginated)
// @route   GET /api/reels
// @access  Private
exports.getReels = async (req, res) => {
    try {
        const { page = 1, limit = 10, level } = req.query;
        const userId = req.user.id;

        const query = { isActive: true };
        if (level) query.level = level;

        const reels = await Reel.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .lean();

        // Add user-specific flags
        const reelsWithFlags = reels.map(reel => ({
            ...reel,
            isLiked: reel.likedBy?.some(id => id.toString() === userId),
            isBookmarked: reel.bookmarkedBy?.some(id => id.toString() === userId)
        }));

        const total = await Reel.countDocuments(query);

        res.json({
            success: true,
            data: reelsWithFlags,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get reels error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch reels' });
    }
};

// @desc    Like/unlike a reel
// @route   POST /api/reels/like/:id
// @access  Private
exports.toggleLike = async (req, res) => {
    try {
        const reelId = req.params.id;
        const userId = req.user.id;

        const reel = await Reel.findById(reelId);
        if (!reel) {
            return res.status(404).json({ success: false, message: 'Reel not found' });
        }

        const isLiked = reel.likedBy.includes(userId);

        if (isLiked) {
            reel.likedBy.pull(userId);
            reel.likes = Math.max(0, reel.likes - 1);
        } else {
            reel.likedBy.push(userId);
            reel.likes += 1;
        }

        await reel.save();

        res.json({
            success: true,
            isLiked: !isLiked,
            likes: reel.likes
        });
    } catch (error) {
        console.error('Toggle like error:', error);
        res.status(500).json({ success: false, message: 'Failed to toggle like' });
    }
};

// @desc    Bookmark/unbookmark a reel
// @route   POST /api/reels/bookmark/:id
// @access  Private
exports.toggleBookmark = async (req, res) => {
    try {
        const reelId = req.params.id;
        const userId = req.user.id;

        const reel = await Reel.findById(reelId);
        if (!reel) {
            return res.status(404).json({ success: false, message: 'Reel not found' });
        }

        const isBookmarked = reel.bookmarkedBy.includes(userId);

        if (isBookmarked) {
            reel.bookmarkedBy.pull(userId);
        } else {
            reel.bookmarkedBy.push(userId);
        }

        await reel.save();

        res.json({
            success: true,
            isBookmarked: !isBookmarked
        });
    } catch (error) {
        console.error('Toggle bookmark error:', error);
        res.status(500).json({ success: false, message: 'Failed to toggle bookmark' });
    }
};

// @desc    Track view
// @route   POST /api/reels/view/:id
// @access  Private
exports.trackView = async (req, res) => {
    try {
        const reelId = req.params.id;

        await Reel.findByIdAndUpdate(reelId, { $inc: { views: 1 } });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to track view' });
    }
};

// @desc    Add reel (admin)
// @route   POST /api/reels
// @access  Private/Admin
exports.addReel = async (req, res) => {
    try {
        const { title, description, videoUrl, level, sourceType, sourceUrl, aiPrompt } = req.body;

        let finalVideoUrl = videoUrl;
        let extractedData = {};

        // Sosyal medya linki mi kontrol et ve video URL'i çıkar
        const { extractVideoUrl, needsExtraction, isDirectVideoUrl } = require('../utils/videoExtractor');

        if (needsExtraction(videoUrl) && !isDirectVideoUrl(videoUrl)) {
            console.log('Extracting video URL from social media link...');
            const extracted = await extractVideoUrl(videoUrl);

            if (extracted.success) {
                finalVideoUrl = extracted.directUrl;
                extractedData = {
                    thumbnailUrl: extracted.thumbnail || '',
                };
                console.log('Successfully extracted video URL');
            } else {
                console.log('Extraction failed, using original URL:', extracted.error);
                // Extraction başarısız olsa bile orijinal URL'i kaydet
                // Video oynatılamayabilir ama kullanıcı sonra düzeltebilir
            }
        }

        const reel = await Reel.create({
            title,
            description,
            videoUrl: finalVideoUrl,
            level,
            sourceType,
            sourceUrl: sourceUrl || videoUrl, // Orijinal linki sakla
            aiPrompt,
            thumbnailUrl: extractedData.thumbnailUrl || '',
            creator: {
                name: 'EchoMind',
                avatar: '👨‍🏫',
                verified: true
            }
        });

        res.status(201).json({ success: true, data: reel });
    } catch (error) {
        console.error('Add reel error:', error);
        res.status(500).json({ success: false, message: 'Failed to add reel' });
    }
};

// @desc    Delete reel (admin)
// @route   DELETE /api/reels/:id
// @access  Private/Admin
exports.deleteReel = async (req, res) => {
    try {
        const reel = await Reel.findByIdAndDelete(req.params.id);

        if (!reel) {
            return res.status(404).json({ success: false, message: 'Reel not found' });
        }

        res.json({ success: true, message: 'Reel deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete reel' });
    }
};
