import { createRequire } from 'node:module';

export interface Building {
    title: string;
    description: string;
}

export interface Profile {
    name: string;
    role: string;
    quote: string;
    email: string;
    githubUser: string;
    links: {
        portfolio: string;
        github: string;
        linkedin: string;
        resume: string;
    };
    stack: string[];
    building: Building;
    /**
     * Optional URL of a JSON file like {"building": {"title": "...", "description": "..."}}.
     * When set, the card shows that instead of `building`, so it can change without a new npm release.
     */
    nowUrl: string | null;
}

const require = createRequire(import.meta.url);
export const pkg = require('../package.json') as { version: string };
export const profile = require('../profile.json') as Profile;

/** "https://ganeshangadi.online/" -> "ganeshangadi.online" */
export const displayUrl = (url: string) => url.replace(/^https?:\/\//, '').replace(/\/$/, '');
