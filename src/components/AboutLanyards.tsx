import React from 'react';
import { TeamLanyardRail, type LanyardMember } from './ReferenceLanyardRail';
import type { Experience } from '../lib/aboutExperience';

export function AboutLanyards({ items }: { items: Experience[] }) {
  const badges: LanyardMember[] = items.slice(0, 5).map((item, index) => ({
    id: item.id,
    name: item.company || `Experience ${index + 1}`,
    role: item.role || 'Job title',
    team: item.period || 'Start — End',
    image: item.image || '',
    bio: item.location ? `Location: ${item.location}` : '',
    tags: item.socialLabel ? [item.socialLabel] : [],
    links: item.socialUrl ? [{ label: item.socialLabel || 'Social media', href: item.socialUrl }] : [],
    tone: ((index % 5) + 1) as 1 | 2 | 3 | 4 | 5,
    drop: [6, 20, 0, 13, 22][index]
  }));
  return <div className="w-full min-h-[calc(100vh-95px)] bg-[#090909] flex flex-col justify-center">
    <TeamLanyardRail
      items={badges}
      eyebrow="MY JOURNEY · FIVE EXPERIENCES"
      heading="Five chapters of my career."
      caption="Select a badge to flip it. Drag or move a badge to see it swing."
      autoplay={false}
      labels={{ flip: 'Click or press Enter to flip the badge', back: 'Click again or press Esc to turn it back', show: 'Show' }}
    />
  </div>;
}
