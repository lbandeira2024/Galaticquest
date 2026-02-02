// routes/users.js
router.post('/save-team-name', async (req, res) => {
    try {
        const { userId, teamName } = req.body;
        const user = await User.findByIdAndUpdate(userId, { teamName }, { new: true });
        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});