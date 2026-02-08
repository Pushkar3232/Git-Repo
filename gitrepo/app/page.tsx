"use client";

import { useState, useCallback, useEffect } from "react";

export default function Home() {
  const [username, setUsername] = useState("Pushkar3232");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mode, setMode] = useState<"full" | "compact">("full");
  const [maxRepos, setMaxRepos] = useState(20);
  const [previewKey, setPreviewKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const queryString = `username=${encodeURIComponent(username)}&theme=${theme}&mode=${mode}&max=${maxRepos}`;
  const apiUrl = origin ? `${origin}/api/timeline?${queryString}` : "";
  const markdownSnippet = `![Project Timeline](https://YOUR_VERCEL_URL/api/timeline?${queryString})`;

  const handleGenerate = useCallback(() => {
    setLoading(true);
    setPreviewKey((k) => k + 1);
  }, []);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
  }, []);

  return (
    <div className="min-h-screen bg-[#0D1117] text-white">
      {/* Hero */}
      <header className="border-b border-[#30363D]">
        <div className="max-w-5xl mx-auto px-6 py-16 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" className="text-[#58A6FF]">
              <rect x="3" y="4" width="18" height="4" rx="2" fill="currentColor" opacity="0.9" />
              <rect x="5" y="10" width="14" height="4" rx="2" fill="currentColor" opacity="0.7" />
              <rect x="7" y="16" width="10" height="4" rx="2" fill="currentColor" opacity="0.5" />
            </svg>
            <h1 className="text-4xl font-bold tracking-tight">GitHub Readme Timeline</h1>
          </div>
          <p className="text-[#8B949E] text-lg max-w-xl mx-auto">
            Generate a dynamic SVG Gantt-style project timeline for your GitHub profile README. Shows how your projects evolved over time, color-coded by tech stack.
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 space-y-16">
        {/* Generator Section */}
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span className="text-[#58A6FF]">01.</span> Generate Your Timeline
          </h2>
          <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm text-[#8B949E] mb-1.5">GitHub Username</label>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. torvalds" className="w-full bg-[#0D1117] border border-[#30363D] rounded-lg px-4 py-2.5 text-white placeholder-[#484F58] focus:outline-none focus:border-[#58A6FF] transition-colors" />
              </div>
              <div>
                <label className="block text-sm text-[#8B949E] mb-1.5">Theme</label>
                <select value={theme} onChange={(e) => setTheme(e.target.value as "dark" | "light")} className="w-full bg-[#0D1117] border border-[#30363D] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#58A6FF] transition-colors">
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-[#8B949E] mb-1.5">Mode</label>
                <select value={mode} onChange={(e) => setMode(e.target.value as "full" | "compact")} className="w-full bg-[#0D1117] border border-[#30363D] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#58A6FF] transition-colors">
                  <option value="full">Full</option>
                  <option value="compact">Compact</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm text-[#8B949E] mb-1.5">Max Projects: <span className="text-white font-mono">{maxRepos}</span></label>
              <input type="range" min="1" max="30" value={maxRepos} onChange={(e) => setMaxRepos(parseInt(e.target.value))} className="w-full accent-[#58A6FF]" />
            </div>
            <button onClick={handleGenerate} disabled={!username.trim()} className="bg-[#238636] hover:bg-[#2EA043] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-lg transition-colors">
              Generate Timeline
            </button>
            {previewKey > 0 && (
              <div className="mt-6">
                <h3 className="text-sm text-[#8B949E] mb-3 uppercase tracking-wider">Preview</h3>
                <div className="bg-[#0D1117] border border-[#30363D] rounded-lg p-4 overflow-x-auto relative">
                  {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#0D1117]/80 rounded-lg z-10">
                      <div className="flex items-center gap-2 text-[#8B949E]">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                        <span>Fetching from GitHub...</span>
                      </div>
                    </div>
                  )}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img key={previewKey} src={apiUrl} alt="Project Timeline Preview" onLoad={() => setLoading(false)} onError={() => setLoading(false)} className="max-w-full" />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Usage Section */}
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span className="text-[#58A6FF]">02.</span> Add to Your README
          </h2>
          <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-6 space-y-4">
            <p className="text-[#8B949E]">Add this Markdown to your GitHub profile README:</p>
            <div className="relative">
              <pre className="bg-[#0D1117] border border-[#30363D] rounded-lg p-4 text-sm text-[#E6EDF3] overflow-x-auto font-mono">{markdownSnippet}</pre>
              <button onClick={() => copyToClipboard(markdownSnippet)} className="absolute top-3 right-3 bg-[#30363D] hover:bg-[#484F58] text-[#8B949E] hover:text-white p-1.5 rounded-md transition-colors" title="Copy to clipboard">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 010 1.5h-1.5a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-1.5a.75.75 0 011.5 0v1.5A1.75 1.75 0 019.25 16h-7.5A1.75 1.75 0 010 14.25v-7.5z" /><path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0114.25 11h-7.5A1.75 1.75 0 015 9.25v-7.5zm1.75-.25a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-7.5a.25.25 0 00-.25-.25h-7.5z" /></svg>
              </button>
            </div>
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-white mb-2">Direct URL:</h4>
              <div className="relative">
                <pre className="bg-[#0D1117] border border-[#30363D] rounded-lg p-4 text-sm text-[#58A6FF] overflow-x-auto font-mono break-all">{apiUrl || "/api/timeline?username=YOUR_USERNAME&theme=dark"}</pre>
                <button onClick={() => copyToClipboard(apiUrl)} className="absolute top-3 right-3 bg-[#30363D] hover:bg-[#484F58] text-[#8B949E] hover:text-white p-1.5 rounded-md transition-colors" title="Copy to clipboard">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 010 1.5h-1.5a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-1.5a.75.75 0 011.5 0v1.5A1.75 1.75 0 019.25 16h-7.5A1.75 1.75 0 010 14.25v-7.5z" /><path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0114.25 11h-7.5A1.75 1.75 0 015 9.25v-7.5zm1.75-.25a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-7.5a.25.25 0 00-.25-.25h-7.5z" /></svg>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* API Docs Section */}
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span className="text-[#58A6FF]">03.</span> API Reference
          </h2>
          <div className="bg-[#161B22] border border-[#30363D] rounded-xl overflow-hidden">
            <div className="p-4 bg-[#0D1117] border-b border-[#30363D]">
              <code className="text-[#58A6FF] text-sm font-mono">GET /api/timeline</code>
            </div>
            <div className="p-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[#8B949E] border-b border-[#30363D]">
                    <th className="pb-3 pr-4">Parameter</th>
                    <th className="pb-3 pr-4">Type</th>
                    <th className="pb-3 pr-4">Default</th>
                    <th className="pb-3">Description</th>
                  </tr>
                </thead>
                <tbody className="text-[#E6EDF3]">
                  <tr className="border-b border-[#21262D]">
                    <td className="py-3 pr-4"><code className="text-[#FF7B72] bg-[#0D1117] px-1.5 py-0.5 rounded">username</code></td>
                    <td className="py-3 pr-4 text-[#8B949E]">string</td>
                    <td className="py-3 pr-4 text-[#8B949E]">—</td>
                    <td className="py-3"><span className="text-[#FF7B72] text-xs mr-1">required</span> GitHub username</td>
                  </tr>
                  <tr className="border-b border-[#21262D]">
                    <td className="py-3 pr-4"><code className="text-[#79C0FF] bg-[#0D1117] px-1.5 py-0.5 rounded">theme</code></td>
                    <td className="py-3 pr-4 text-[#8B949E]">string</td>
                    <td className="py-3 pr-4"><code className="text-[#A5D6FF]">dark</code></td>
                    <td className="py-3"><code className="text-[#A5D6FF]">dark</code> or <code className="text-[#A5D6FF]">light</code></td>
                  </tr>
                  <tr className="border-b border-[#21262D]">
                    <td className="py-3 pr-4"><code className="text-[#79C0FF] bg-[#0D1117] px-1.5 py-0.5 rounded">mode</code></td>
                    <td className="py-3 pr-4 text-[#8B949E]">string</td>
                    <td className="py-3 pr-4"><code className="text-[#A5D6FF]">full</code></td>
                    <td className="py-3"><code className="text-[#A5D6FF]">full</code> or <code className="text-[#A5D6FF]">compact</code></td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4"><code className="text-[#79C0FF] bg-[#0D1117] px-1.5 py-0.5 rounded">max</code></td>
                    <td className="py-3 pr-4 text-[#8B949E]">number</td>
                    <td className="py-3 pr-4"><code className="text-[#A5D6FF]">20</code></td>
                    <td className="py-3">Max repos to display (1–30)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span className="text-[#58A6FF]">04.</span> Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: "🎨", title: "Language Colors", desc: "Bars auto-colored by primary tech stack using GitHub's linguist colors." },
              { icon: "🌙", title: "Theme Support", desc: "Dark and light themes that match GitHub's design system." },
              { icon: "⚡", title: "Edge Cached", desc: "24-hour CDN caching via Vercel Edge Runtime for instant loads." },
              { icon: "🏆", title: "Smart Sorting", desc: "Top projects by stars, with longest-project highlight." },
              { icon: "🟢", title: "Active Detection", desc: "Animated indicator for projects active within the last 60 days." },
              { icon: "📐", title: "Compact Mode", desc: "Space-saving layout for README files with limited vertical space." },
            ].map((feature) => (
              <div key={feature.title} className="bg-[#161B22] border border-[#30363D] rounded-xl p-5">
                <div className="text-2xl mb-2">{feature.icon}</div>
                <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                <p className="text-sm text-[#8B949E]">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Deployment Section */}
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span className="text-[#58A6FF]">05.</span> Self-Deploy
          </h2>
          <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-6 space-y-4">
            <ol className="list-decimal list-inside space-y-3 text-[#E6EDF3]">
              <li>Fork or clone this repository</li>
              <li>Install dependencies: <code className="bg-[#0D1117] px-2 py-0.5 rounded text-[#79C0FF] text-sm">npm install</code></li>
              <li>(Optional) Create a <code className="bg-[#0D1117] px-2 py-0.5 rounded text-[#79C0FF] text-sm">.env.local</code> file with <code className="bg-[#0D1117] px-2 py-0.5 rounded text-[#79C0FF] text-sm">GITHUB_TOKEN=ghp_xxx</code> for higher rate limits</li>
              <li>Deploy to Vercel: <code className="bg-[#0D1117] px-2 py-0.5 rounded text-[#79C0FF] text-sm">npx vercel --prod</code></li>
              <li>Add the environment variable <code className="bg-[#0D1117] px-2 py-0.5 rounded text-[#79C0FF] text-sm">GITHUB_TOKEN</code> in Vercel Dashboard → Settings → Environment Variables</li>
            </ol>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#30363D] py-8 text-center text-[#8B949E] text-sm">
        <p>Built with Next.js · Deployed on Vercel · Open Source</p>
      </footer>
    </div>
  );
}
