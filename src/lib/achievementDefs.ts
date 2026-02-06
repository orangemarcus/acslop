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
