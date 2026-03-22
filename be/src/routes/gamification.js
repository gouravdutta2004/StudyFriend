const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// @route   POST /api/gamification/session-end
// @desc    Record a completed study session to update hours and streak
// @access  Private
router.post('/session-end', protect, async (req, res) => {
  try {
    const { hoursStudied } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ message: 'User not found' });

    user.studyHours += (hoursStudied || 0);

    // Streak logic
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (user.lastStudyDate) {
      const lastStudy = new Date(user.lastStudyDate);
      lastStudy.setHours(0,0,0,0);
      
      const diffTime = Math.abs(today - lastStudy);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      if (diffDays === 1) {
        // Studied yesterday, increment streak
        user.streak += 1;
      } else if (diffDays > 1) {
        // Streak broken
        user.streak = 1;
      }
    } else {
      user.streak = 1;
    }
    
    user.lastStudyDate = new Date();

    // Award badges logic (simple example)
    if (user.studyHours >= 10 && !user.badges.includes('Bronze Scholar')) {
      user.badges.push('Bronze Scholar');
    }
    if (user.studyHours >= 50 && !user.badges.includes('Silver Scholar')) {
      user.badges.push('Silver Scholar');
    }
    if (user.streak >= 7 && !user.badges.includes('7-Day Star')) {
      user.badges.push('7-Day Star');
    }

    // Award XP and calculate user Level
    const earnedXp = (hoursStudied || 0) * 100; // 100 XP per study hour
    const streakBonus = user.streak * 10; // Extra XP for consistency
    user.xp = (user.xp || 0) + earnedXp + streakBonus;
    user.level = Math.floor(user.xp / 1000) + 1; // Level up every 1000 XP

    await user.save();
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/gamification/goals
// @desc    Add a weekly goal
// @access  Private
router.post('/goals', protect, async (req, res) => {
  try {
    const { title, targetHours } = req.body;
    const user = await User.findById(req.user.id);
    user.weeklyGoals.push({ title, targetHours });
    await user.save();
    res.json(user.weeklyGoals);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/gamification/goals/:id
// @desc    Update progress on a goal
// @access  Private
router.put('/goals/:id', protect, async (req, res) => {
  try {
    const { addedHours } = req.body;
    const user = await User.findById(req.user.id);
    
    const goal = user.weeklyGoals.id(req.params.id);
    if (!goal) return res.status(404).json({ message: 'Goal not found' });

    goal.currentHours += addedHours;
    if (goal.currentHours >= goal.targetHours) {
      goal.isCompleted = true;
    }
    
    await user.save();
    res.json(user.weeklyGoals);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/gamification/goals/:id
// @desc    Delete a goal
// @access  Private
router.delete('/goals/:id', protect, async (req, res) => {
   try {
     const user = await User.findById(req.user.id);
     
     // Remove subdoc
     user.weeklyGoals.pull({ _id: req.params.id });
     await user.save();
     
     res.json(user.weeklyGoals);
   } catch (err) {
     res.status(500).send('Server Error');
   }
});

module.exports = router;
