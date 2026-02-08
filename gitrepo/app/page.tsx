"use client";

import { useState, useCallback, useEffect, useRef } from "react";

export default function Home() {
  const [username, setUsername] = useState("Pushkar3232");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mode, setMode] = useState<"mini" | "full">("mini");
  const [maxRepos, setMaxRepos] = useState(5);
  const [previewKey, setPreviewKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [origin, setOrigin] = useState("");
  const [cacheBreaker, setCacheBreaker] = useState(Date.now());

  // Debounced username to avoid firing API on every keystroke
  const [debouncedUsername, setDebouncedUsername] = useState(username);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  // Debounce username changes — wait 800ms after user stops typing
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedUsername(username);
    }, 800);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [username]);

  // Only update cache when Generate button is clicked
  // Removed automatic updates to prevent unwanted API calls

  const queryString = `username=${encodeURIComponent(debouncedUsername)}&theme=${theme}&mode=${mode}&max=${maxRepos}&t=${cacheBreaker}`;
  const apiUrl = origin ? `${origin}/api/timeline?${queryString}` : "";
  const markdownSnippet = `![Project Timeline](https://git-repo-five.vercel.app/api/timeline?username=${encodeURIComponent(debouncedUsername)}&theme=${theme}&mode=${mode}&max=${maxRepos})`;  

  const handleGenerate = useCallback(() => {
    setLoading(true);
    setDebouncedUsername(username); // Force immediate update
    setCacheBreaker(Date.now());
    setPreviewKey((k) => k + 1);
  }, [username]);

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
            Generate a beautiful SVG timeline for your GitHub profile README. Visualize your coding journey with color-coded project timelines.
          </p>
          <div className="mt-6">
            <a 
              href="https://github.com/Pushkar3232/Git-Repo" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#238636] hover:bg-[#2EA043] text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
              </svg>
              ⭐ Star & Contribute
            </a>
          </div>
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
                <select value={mode} onChange={(e) => setMode(e.target.value as "mini" | "full")} className="w-full bg-[#0D1117] border border-[#30363D] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#58A6FF] transition-colors">
                  <option value="mini">Mini (Profile Card)</option>
                  <option value="full">Full (Gantt Chart)</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm text-[#8B949E] mb-1.5">Max Projects: <span className="text-white font-mono">{maxRepos}</span></label>
              <input type="range" min="1" max={mode === "mini" ? 10 : 30} value={maxRepos} onChange={(e) => setMaxRepos(parseInt(e.target.value))} className="w-full accent-[#58A6FF]" />
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






      </main>

      {/* Footer */}
      <footer className="border-t border-[#30363D] py-12">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-[#8B949E] text-sm">
              <p>Built with ❤️ using Next.js · Open Source & Free</p>
            </div>
            <div className="flex items-center gap-4">
              <a 
                href="https://github.com/Pushkar3232/Git-Repo" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[#8B949E] hover:text-[#58A6FF] transition-colors text-sm"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
                </svg>
                View on GitHub
              </a>
              <span className="text-[#30363D]">·</span>
              <a 
                href="https://github.com/Pushkar3232/Git-Repo/issues" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#8B949E] hover:text-[#58A6FF] transition-colors text-sm"
              >
                Report Issue
              </a>
              <span className="text-[#30363D]">·</span>
              <a 
                href="https://github.com/Pushkar3232/Git-Repo/fork" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#8B949E] hover:text-[#58A6FF] transition-colors text-sm"
              >
                Fork & Contribute
              </a>
              <span className="text-[#30363D]">·</span>
              <a 
                href="https://pushkarshinde.in" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#8B949E] hover:text-[#58A6FF] transition-colors text-sm flex items-center gap-2"
              >
                👨‍💻 Visit Developer
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
