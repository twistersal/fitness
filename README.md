# Recomp planner

Shift-aware fitness planner: daily shift, workout plan, meals, and water. React + TypeScript + Vite. Data is stored in the browser (localStorage); there is no backend.

## Run
```bash
npm install
npm run dev
```

## Deploy to GitHub Pages
1. Push this project to a repo (the repo name becomes the URL path).
2. In **Settings > Pages**, set **Source** to **GitHub Actions**.
3. Push to `main`. `.github/workflows/deploy.yml` builds and publishes `dist`.

The site appears at `https://<user>.github.io/<repo>/`. Pages use hash routes (`#meals`), so no server rewrites are needed.
