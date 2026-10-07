// Resolves a public asset path against the Vite base so the same build works
// at the domain root and under a repository sub-path (GitHub Pages project sites).
const base = (import.meta.env && import.meta.env.BASE_URL) || '/';

export const asset = (path: string) => `${base}${path}`;
