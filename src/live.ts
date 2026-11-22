import type { Building } from './profile.js';

export interface RepoSummary {
    name: string;
    description: string;
    stars: number;
    url: string;
    pushedAt: string;
}

export interface GitHubSummary {
    publicRepos: number;
    followers: number;
    totalStars: number;
    recent: RepoSummary[];
}

export interface LiveData {
    github: GitHubSummary | null;
    building: Building | null;
}

async function getJson<T>(url: string, timeoutMs: number): Promise<T> {
    const res = await fetch(url, {
        signal: AbortSignal.timeout(timeoutMs),
        headers: { Accept: 'application/json', 'User-Agent': 'ganeshak11-devcard' },
    });
    if (!res.ok) throw new Error(`${url} returned ${res.status}`);
    return res.json() as Promise<T>;
}

export async function fetchGitHub(user: string, timeoutMs = 4000): Promise<GitHubSummary> {
    type User = { public_repos: number; followers: number };
    type Repo = { name: string; description: string | null; stargazers_count: number; html_url: string; pushed_at: string; fork: boolean; archived: boolean };

    const [u, repos] = await Promise.all([
        getJson<User>(`https://api.github.com/users/${user}`, timeoutMs),
        getJson<Repo[]>(`https://api.github.com/users/${user}/repos?sort=pushed&per_page=100`, timeoutMs),
    ]);
    const own = repos.filter(r => !r.fork);
    return {
        publicRepos: u.public_repos,
        followers: u.followers,
        totalStars: own.reduce((n, r) => n + r.stargazers_count, 0),
        recent: own.filter(r => !r.archived && r.name !== user).slice(0, 3).map(r => ({
            name: r.name,
            description: r.description ?? '',
            stars: r.stargazers_count,
            url: r.html_url,
            pushedAt: r.pushed_at,
        })),
    };
}

export async function fetchBuilding(url: string, timeoutMs = 3000): Promise<Building | null> {
    const data = await getJson<{ building?: Partial<Building> }>(url, timeoutMs);
    const b = data.building;
    return b && typeof b.title === 'string' ? { title: b.title, description: b.description ?? '' } : null;
}

/** Fetches everything live in parallel. Never throws; missing pieces are null. */
export async function fetchLive(user: string, nowUrl: string | null, timeoutMs: number): Promise<LiveData> {
    const [github, building] = await Promise.allSettled([
        fetchGitHub(user, timeoutMs),
        nowUrl ? fetchBuilding(nowUrl, timeoutMs) : Promise.resolve(null),
    ]);
    return {
        github: github.status === 'fulfilled' ? github.value : null,
        building: building.status === 'fulfilled' ? building.value : null,
    };
}

export function timeAgo(iso: string, now = Date.now()): string {
    const days = Math.floor((now - new Date(iso).getTime()) / 86400000);
    if (days <= 0) return 'today';
    if (days === 1) return 'yesterday';
    if (days < 30) return `${days}d ago`;
    if (days < 365) return `${Math.floor(days / 30)}mo ago`;
    return `${Math.floor(days / 365)}y ago`;
}
