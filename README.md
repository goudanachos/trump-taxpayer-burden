# TrumpTaxBurden.com

A modern, responsive website that displays daily recreational and leisure costs for Donald J. Trump, paid for by American taxpayers. Built with transparency and accountability in mind.

## Features

- **Daily Cost Tracking**: Displays recreational and leisure expenses by date
- **Modern Design**: Patriotic, responsive design using Tailwind CSS v4
- **Social Sharing**: Easy sharing to Twitter, Facebook, and clipboard
- **Performance Optimized**: Static site generation with Eleventy
- **Mobile Friendly**: Fully responsive design
- **Accessible**: Semantic HTML and accessibility best practices

## Tech Stack

- **Eleventy (11ty)** v3.1.2 - Static site generator
- **Tailwind CSS** v4.1.11 - Modern CSS framework
- **LiquidJS** v10.21.1 - Templating engine
- **YAML** - Data format for daily expenditures
- **GitHub Pages** - Free hosting with auto-deploy

## Development

### Prerequisites

- Node.js 22+
- npm

### Setup

```bash
# Clone the repository
git clone https://github.com/username/trump-taxpayer-burden.git
cd trump-taxpayer-burden

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Adding Daily Data

1. Create a new YAML file in `src/_data/expenditures/` with format `YYYY-MM-DD.yml`
2. Follow the schema:

```yaml
date: "2025-01-31"
location: "Location Name"
activities:
  - name: "Activity description"
    cost: 10000
    category: "recreation|leisure|logistics"
    description: "Detailed description"
total_cost: 10000
social_description: "Social media friendly description"
tags: ["tag1", "tag2"]
```

## Project Structure

```
├── src/
│   ├── _data/
│   │   ├── expenditures/      # Daily YAML files
│   │   └── site.json          # Site configuration
│   ├── _includes/
│   │   ├── layouts/           # Page layouts
│   │   └── components/        # Reusable components
│   ├── css/                   # Styles
│   ├── js/                    # JavaScript
│   └── index.liquid           # Homepage
├── .eleventy.js               # Eleventy configuration
├── tailwind.config.js         # Tailwind configuration
└── package.json
```

## Deployment

The site automatically deploys to GitHub Pages via GitHub Actions when changes are pushed to the `main` branch.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

---

**Built for transparency and government accountability** 🇺🇸