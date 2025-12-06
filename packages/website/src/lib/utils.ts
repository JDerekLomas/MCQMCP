import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

export function groupByDate<T extends { createdAt: Date }>(items: T[]): Record<string, T[]> {
  const groups: Record<string, T[]> = {};
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  items.forEach(item => {
    const itemDate = new Date(item.createdAt);
    let key: string;

    if (itemDate.toDateString() === today.toDateString()) {
      key = 'Today';
    } else if (itemDate.toDateString() === yesterday.toDateString()) {
      key = 'Yesterday';
    } else {
      key = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric' }).format(itemDate);
    }

    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });

  return groups;
}

export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
