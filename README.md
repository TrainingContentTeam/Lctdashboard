
  # LCT Dashboard

  This is a code bundle for LCT Dashboard. The original project is available at https://www.figma.com/design/h2JRc7A9tnkcCDONdO9QiC/LCT-Dashboard.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## Documentation

  - [Project File Explanation](./EXPLANATION.md)

  ## GitHub Pages Deployment

  This project is configured to deploy to a dedicated `gh-pages` branch using GitHub Actions.

  1. Push your default branch (workflow runs on push to `main`).
  2. In GitHub repo settings, open `Pages`.
  3. Set `Source` to `Deploy from a branch`.
  4. Select branch `gh-pages` and folder `/ (root)`.

  Workflow file:
  - [deploy-gh-pages.yml](./.github/workflows/deploy-gh-pages.yml)

  ## 404 Troubleshooting (GitHub Pages)

  If you still get a `404`, verify these settings in GitHub:

  1. `Actions` tab: latest `Deploy to GitHub Pages` run is green.
  2. `Settings > Actions > General > Workflow permissions`: set to **Read and write permissions**.
  3. `Settings > Pages`:
     - Source: **Deploy from a branch**
     - Branch: **gh-pages**
     - Folder: **/ (root)**
  4. `gh-pages` branch contains built files (`index.html`, `assets/*`, `404.html`, `.nojekyll`).

  Note:
  - For repositories named `<owner>.github.io`, Pages base path must be `/`.
  - For project repositories, base path is `/<repo-name>/`.
  - The workflow auto-detects this now.
  
