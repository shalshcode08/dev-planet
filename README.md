# Solar Portfolio

A 3D interactive solar system portfolio that visualizes your GitHub repositories as planets orbiting a star. Built with React, Three.js, and React Three Fiber.

![Solar System](https://img.shields.io/badge/Stack-React%20%2B%20R3F-blue)

## Features

- 🌌 **Interactive 3D Galaxy** - Explore a visually stunning solar system
- 🪐 **GitHub Integration** - Your repos become planets with unique textures based on language
- 🎮 **Dynamic Camera** - Fly to planets for detailed repository stats
- 📱 **Mobile Responsive** - Works on all devices
- ⚡ **Fast & Secure** - Uses GitHub authenticated API with Axios

## Tech Stack

- **Frontend:** React, TypeScript, Vite
- **3D Engine:** Three.js, React Three Fiber, Drei
- **Post-processing:** Bloom, ChromaticAberration, Vignette
- **State:** Zustand
- **Routing:** React Router
- **API:** Axios + GitHub REST API

## Getting Started

```bash
# Install dependencies
bun install

# Create .env.local with your GitHub token
echo "VITE_GITHUB_TOKEN=your_token_here" > .env.local

# Run development server
bun run dev
```

## GitHub Token Setup

1. Go to [GitHub Settings → Developer Settings → Personal access tokens](https://github.com/settings/tokens)
2. Generate a **Fine-grained** token with:
   - Repository access: **Public repositories (read-only)**
   - Permissions: Contents (read)
3. Add to `.env.local`

## Deployment

Build for production:
```bash
bun run build
```

