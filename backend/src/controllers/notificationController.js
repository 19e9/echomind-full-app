const Notification = require('../models/Notification');
const User = require('../models/User');

// @desc    Send notification
// @route   POST /api/notifications/send
// @access  Private/Admin
exports.sendNotification = async (req, res) => {
    try {
        const { title, body, type, targetUserIds, isGlobal } = req.body;

        if (!title || !body) {
            return res.status(400).json({
                success: false,
                message: 'Title and body are required'
            });
        }

        const notification = await Notification.create({
            title,
            body,
            type: type || 'info',
            targetUsers: isGlobal ? [] : targetUserIds || [],
            isGlobal: isGlobal || false,
            sentBy: req.user.id
        });

        // In production, you would send push notifications here via Expo Push API
        // For now, we just store the notification

        const targetCount = isGlobal
            ? await User.countDocuments()
            : (targetUserIds?.length || 0);

        res.status(201).json({
            success: true,
            message: `Notification sent to ${targetCount} user(s)`,
            data: { notification }
        });
    } catch (error) {
        console.error('Send notification error:', error);
        res.status(500).json({ success: false, message: 'Failed to send notification' });
    }
};

// @desc    Get notifications for current user
// @route   GET /api/notifications
// @access  Private
exports.getMyNotifications = async (req, res) => {
    try {
        const { page = 1, limit = 20, unreadOnly = false } = req.query;
        const userId = req.user.id;

        let query = {
            $or: [
                { isGlobal: true },
                { targetUsers: userId }
            ]
        };

        if (unreadOnly === 'true') {
            query.readBy = { $ne: userId };
        }

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('sentBy', 'name');

        const total = await Notification.countDocuments(query);

        // Get unread count
        const unreadCount = await Notification.countDocuments({
            ...query,
            readBy: { $ne: userId }
        });

        res.json({
            success: true,
            data: {
                notifications,
                unreadCount,
                pagination: {
                    current: parseInt(page),
                    pages: Math.ceil(total / limit),
                    total
                }
            }
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ success: false, message: 'Failed to get notifications' });
    }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        if (!notification.readBy.includes(req.user.id)) {
            notification.readBy.push(req.user.id);
            await notification.save();
        }

        res.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({ success: false, message: 'Failed to mark notification as read' });
    }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;

        await Notification.updateMany(
            {
                $or: [
                    { isGlobal: true },
                    { targetUsers: userId }
                ],
                readBy: { $ne: userId }
            },
            { $push: { readBy: userId } }
        );

        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Mark all as read error:', error);
        res.status(500).json({ success: false, message: 'Failed to mark notifications as read' });
    }
};

// @desc    Get all notifications (admin)
// @route   GET /api/notifications/all
// @access  Private/Admin
exports.getAllNotifications = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;

        const notifications = await Notification.find()
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('sentBy', 'name')
            .populate('targetUsers', 'name email');

        const total = await Notification.countDocuments();

        res.json({
            success: true,
            data: {
                notifications,
                pagination: {
                    current: parseInt(page),
                    pages: Math.ceil(total / limit),
                    total
                }
            }
        });
    } catch (error) {
        console.error('Get all notifications error:', error);
        res.status(500).json({ success: false, message: 'Failed to get notifications' });
    }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private/Admin
exports.deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        await notification.deleteOne();

        res.json({ success: true, message: 'Notification deleted successfully' });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete notification' });
    }
};
