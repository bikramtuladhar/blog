# Marginalia

A minimalist blog built with VuePress 2, featuring a book-like design for essays on reading, writing, and thinking.

## Getting Started

```bash
# Install dependencies
yarn install

# Start development server
yarn dev

# Build for production
yarn build
```

## Project Structure

```
blog/
├── docs/
│   ├── .vuepress/
│   │   ├── config.ts       # VuePress configuration
│   │   └── styles/
│   │       ├── index.scss  # Custom book-like styling
│   │       └── palette.scss # Color variables
│   ├── README.md           # Homepage
│   └── posts/
│       ├── README.md       # Table of Contents
│       └── *.md            # Blog posts
└── package.json
```

## Design

- **Background**: Off-white cream (`#f5f1e8`)
- **Text**: Dark brown (`#2b2520`)
- **Font**: Lora (serif)
- **Layout**: Centered, max-width 680px
