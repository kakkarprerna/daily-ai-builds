import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// If you deploy to GitHub Pages as a project site (username.github.io/REPO-NAME),
// set base to '/REPO-NAME/'. If you use a custom domain or a user/organisation
// page (username.github.io), set base to '/'.
export default defineConfig({
  plugins: [react()],
  base: '/cost-of-error-estimator/',
})
