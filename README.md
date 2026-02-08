# RepoPulse

**RepoPulse** is a Next.js app that analyzes a GitHub user's public repositories and generates a beautiful SVG timeline or card for their README, ranking the "Best Repositories" using a quality-first, balanced scoring system.

---

## 🚀 Features

- **Quality-First Ranking**: Ranks repos by documentation, completeness, code quality, commit discipline, maintenance, and controlled stars/forks bonus.
- **SVG Timeline/Card**: Generates a Gantt-style timeline or compact card for your GitHub profile.
- **Diversity Filter**: Ensures language diversity (max 2 per language in top 5).
- **No Star Farming**: New and learning projects can rank high if well-engineered.
- **Public API**: `/api/timeline` endpoint for direct SVG embedding.
- **Dark/Light Themes**: Matches GitHub's design system.

---

## 🏆 How Ranking Works

Repos are scored in 7 categories (normalized 0–1, weighted):

1. **Documentation & Usability** (25%)
   - README exists & length
   - Usage/install section
   - License file
2. **Project Completeness** (20%)
   - Build/config files, .gitignore, env/config
3. **Code Quality** (20%)
   - Clean structure (src/lib), tests, lint config
4. **Commit Quality** (10%)
   - Message quality, time spread, releases/tags
5. **Maintenance & Health** (10%)
   - Recent activity, issues health
6. **Stars** (10%, log-scaled bonus)
7. **Forks** (5%, log-scaled bonus)

**Final Score:**
```
final = 0.25*doc + 0.20*completeness + 0.20*code_quality + 0.10*commit_quality + 0.10*maintenance + 0.10*stars + 0.05*forks
```

- **No commit count dominance**
- **Stars/forks never dominate**
- **Diversity filter**: Max 2 per primary language in top 5

---

## 🖼️ Example Output

![Project Timeline](https://YOUR_VERCEL_URL/api/timeline?username=octocat&theme=dark&mode=mini&max=5)

---

## 🔧 Usage

1. **Clone & Install**
   ```sh
   git clone https://github.com/yourusername/repopulse.git
   cd repopulse
   npm install
   ```
2. **(Optional) Set GitHub Token**
   - Create `.env.local` with `GITHUB_TOKEN=ghp_xxx` for higher API rate limits.
3. **Run Locally**
   ```sh
   npm run dev
   ```
4. **Deploy**
   - Deploy to Vercel or your favorite platform.

---

## 📦 API Reference

**GET `/api/timeline`**

| Param     | Type   | Default | Description                                 |
|-----------|--------|---------|---------------------------------------------|
| username  | string | —       | GitHub username (required)                  |
| theme     | string | dark    | `dark` or `light`                           |
| mode      | string | mini    | `mini` (card) or `full` (timeline)          |
| max       | number | 5       | Max repos to show (1–30)                    |

**Example:**
```
https://YOUR_VERCEL_URL/api/timeline?username=octocat&theme=dark&mode=mini&max=5
```

---

## 🛡️ License

MIT

---

## 🙏 Credits

- Inspired by GitHub's own stats and community tools.
- Built with Next.js, TypeScript, and the GitHub REST API.