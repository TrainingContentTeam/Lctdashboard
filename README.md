
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
  
