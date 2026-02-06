import { prisma } from './prisma';

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji-like label for the badge
  color: string; // tailwind-compatible color
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_translation',
    name: 'First Step',
    description: 'Complete your first translation',
    icon: 'rocket',
    color: 'blue',
  },
  {
    id: 'five_translations',
    name: 'Getting Started',
    description: 'Complete 5 translations',
    icon: 'star',
    color: 'emerald',
  },
  {
    id: 'twenty_five_translations',
    name: 'Regular Reader',
    description: 'Complete 25 translations',
    icon: 'book',
    color: 'purple',
  },
  {
    id: 'hundred_translations',
    name: 'Power Translator',
    description: 'Complete 100 translations',
    icon: 'lightning',
    color: 'amber',
  },
  {
    id: 'crystal_clear',
    name: 'Crystal Clear',
    description: 'Analyze a paper with a slop score under 15',
    icon: 'diamond',
    color: 'cyan',
  },
  {
    id: 'maximum_slop',
    name: 'Maximum Slop',
    description: 'Analyze a paper with a slop score over 85',
    icon: 'fire',
    color: 'red',
  },
  {
    id: 'first_share',
    name: 'Sharing is Caring',
    description: 'Share your first translation report',
    icon: 'share',
    color: 'pink',
  },
  {
    id: 'first_feedback',
    name: 'Quality Control',
    description: 'Rate your first translation',
    icon: 'thumbsup',
    color: 'emerald',
  },
  {
    id: 'collector',
    name: 'Collector',
    description: 'Create your first collection',
    icon: 'folder',
    color: 'indigo',
  },
  {
    id: 'bookworm',
    name: 'Bookworm',
    description: 'Save 10 translations to collections',
    icon: 'bookmark',
    color: 'orange',
  },
  {
    id: 'all_levels',
    name: 'Full Spectrum',
    description: 'Use all 5 complexity levels at least once',
    icon: 'rainbow',
    color: 'violet',
  },
  {
    id: 'streak_3',
    name: 'Three-Day Streak',
    description: 'Translate on 3 consecutive days',
    icon: 'flame',
    color: 'orange',
  },
];

export function getAchievementDef(id: string): AchievementDef | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

/** Check all achievement conditions and unlock any new ones. Returns newly unlocked IDs. */
export async function checkAndUnlockAchievements(userId: string): Promise<string[]> {
  // Get current achievements
  const existing = await prisma.userAchievement.findMany({
    where: { userId },
    select: { achievementId: true },
  });
  const has = new Set(existing.map((a) => a.achievementId));

  // Get user stats
  const [translationCount, translations, shareCount, feedbackCount, collectionCount, bookmarkCount] = await Promise.all([
    prisma.translation.count({ where: { userId } }),
    prisma.translation.findMany({
      where: { userId },
      select: { slopScore: true, level: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.shareableReport.count({ where: { userId } }),
    prisma.feedback.count({ where: { userId } }),
    prisma.collection.count({ where: { userId } }),
    prisma.bookmark.count({ where: { collection: { userId } } }),
  ]);

  const newlyUnlocked: string[] = [];

  const tryUnlock = (id: string) => {
    if (!has.has(id)) newlyUnlocked.push(id);
  };

  // Translation count milestones
  if (translationCount >= 1) tryUnlock('first_translation');
  if (translationCount >= 5) tryUnlock('five_translations');
  if (translationCount >= 25) tryUnlock('twenty_five_translations');
  if (translationCount >= 100) tryUnlock('hundred_translations');

  // Score-based
  if (translations.some((t) => t.slopScore < 15)) tryUnlock('crystal_clear');
  if (translations.some((t) => t.slopScore > 85)) tryUnlock('maximum_slop');

  // Feature usage
  if (shareCount >= 1) tryUnlock('first_share');
  if (feedbackCount >= 1) tryUnlock('first_feedback');
  if (collectionCount >= 1) tryUnlock('collector');
  if (bookmarkCount >= 10) tryUnlock('bookworm');

  // All levels used
  const levelsUsed = new Set(translations.map((t) => t.level));
  if (levelsUsed.size >= 5) tryUnlock('all_levels');

  // 3-day streak
  if (translations.length >= 3) {
    const days = [...new Set(translations.map((t) => t.createdAt.toISOString().slice(0, 10)))].sort();
    for (let i = 0; i <= days.length - 3; i++) {
      const d1 = new Date(days[i]);
      const d2 = new Date(days[i + 1]);
      const d3 = new Date(days[i + 2]);
      const diff1 = (d2.getTime() - d1.getTime()) / 86400000;
      const diff2 = (d3.getTime() - d2.getTime()) / 86400000;
      if (diff1 === 1 && diff2 === 1) {
        tryUnlock('streak_3');
        break;
      }
    }
  }

  // Persist new achievements (use individual upserts for SQLite compatibility)
  for (const achievementId of newlyUnlocked) {
    await prisma.userAchievement.upsert({
      where: { userId_achievementId: { userId, achievementId } },
      update: {},
      create: { userId, achievementId },
    });
  }

  return newlyUnlocked;
}
