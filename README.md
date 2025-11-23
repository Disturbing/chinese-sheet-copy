# Chinese Word Sheet Creator 🇹🇼

AI-powered web app for creating printable Chinese vocabulary word grids for the "Circle Game" learning activity.

**Live App:** https://word-sheet-creator.nullshot.dev

## Features

### 📸 AI Photo Analysis
- Upload photos of Chinese vocabulary worksheets
- Claude Haiku 4.5 automatically extracts:
  - Worksheet title
  - All vocabulary words in Traditional Chinese (繁體字)
- Smart duplicate detection
- Multi-photo support - combine multiple worksheets

### ✏️ Interactive Editing
- Review and edit extracted words
- Add or remove words manually
- Edit worksheet title
- Mobile-responsive grid layout
- Real-time word count

### 🖨️ Print-Optimized Output
- Clean 5-column grid layout
- Optimized spacing for circling words
- Black text on white background
- Professional print formatting
- Title display (optional)

### 📱 Mobile & Desktop Support
- **Mobile:** Direct camera access for photo capture
- **Desktop:** File upload with drag & drop
- Responsive design works on all devices
- Touch-friendly interface

## Tech Stack

- **Framework:** Next.js 15.5.6
- **Runtime:** OpenNext.js for Cloudflare Workers
- **AI:** Claude Haiku 4.5 via Anthropic SDK
- **Gateway:** Cloudflare AI Gateway (bypasses regional restrictions)
- **Styling:** TailwindCSS 4
- **Language:** TypeScript
- **Deployment:** Cloudflare Workers

## Getting Started

### Prerequisites

- Node.js 18+ or compatible runtime
- Cloudflare account (for deployment)
- Anthropic API key

### Installation

```bash
# Clone the repository
git clone https://github.com/Disturbing/chinese-sheet-copy.git
cd chinese-sheet-copy

# Install dependencies
npm install

# Set up environment variables
# Create my-next-app/.dev.vars with:
ANTHROPIC_API_KEY=your-api-key-here
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_AI_GATEWAY=your-gateway-name
```

### Development

```bash
# Start development server
npm run dev

# Access at http://localhost:3000
```

### Deployment

```bash
# Deploy to Cloudflare Workers
npm run deploy

# Set secrets (first time only)
cd my-next-app
echo "your-api-key" | wrangler secret put ANTHROPIC_API_KEY
echo "your-account-id" | wrangler secret put CLOUDFLARE_ACCOUNT_ID
echo "your-gateway-name" | wrangler secret put CLOUDFLARE_AI_GATEWAY
```

## Usage

### Method 1: AI Photo Upload

1. Click "Take/Upload Photo"
2. **Mobile:** Camera opens automatically
3. **Desktop:** Choose image file
4. AI analyzes photo (2-4 seconds)
5. Review and edit extracted words
6. Optional: Upload more photos to merge words
7. Click "Generate Grid"
8. Print!

### Method 2: Manual JSON Upload

1. Click "Upload JSON File"
2. Choose a JSON file with format:
```json
{
  "title": "動物篇",
  "words": ["小豬", "小牛", "小羊", ...]
}
```
or
```json
["詞語1", "詞語2", "詞語3"]
```
3. Grid generates immediately
4. Print!

## Key Features

### Traditional Chinese Support
- Enforces Traditional Chinese (繁體字) output
- Prevents mixing with Simplified Chinese (简体字)
- Proper character recognition (e.g., 長 not 长)

### Smart Word Extraction
- Box-by-box analysis
- Duplicate prevention
- Ignores English annotations
- Skips numbers and checkmarks
- Quality checks before output

### Multi-Photo Merging
- Upload multiple worksheet pages
- Automatic deduplication
- Preserves existing words
- Seamless UX

## Project Structure

```
my-next-app/
├── src/
│   └── app/
│       ├── api/
│       │   └── analyze-photo/
│       │       └── route.ts          # AI analysis endpoint
│       ├── page.tsx                   # Main app UI
│       ├── globals.css                # Print styles
│       └── layout.tsx
├── .dev.vars                          # Local environment variables
├── wrangler.jsonc                     # Cloudflare config
└── package.json
```

## Environment Variables

Required in `.dev.vars` (local) and Cloudflare Workers (production):

- `ANTHROPIC_API_KEY` - Your Anthropic API key
- `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID
- `CLOUDFLARE_AI_GATEWAY` - Your AI Gateway name

## Performance

- **AI Analysis:** 2-4 seconds per image
- **Token Usage:** ~1,750-1,900 tokens per image
- **Cost:** ~$0.002 USD per photo analysis
- **Print Layout:** Optimized for Letter size paper

## Browser Support

- Chrome/Edge (recommended)
- Safari (iOS camera support)
- Firefox
- Mobile browsers with camera access

## Contributing

This is a personal project, but suggestions and issues are welcome!

## License

MIT License - feel free to use for educational purposes

## Acknowledgments

- Built with Next.js and Cloudflare Workers
- Powered by Claude Haiku 4.5 (Anthropic)
- Designed for Hong Kong/Taiwan Traditional Chinese worksheets

---

**Created for:** Educational use - helping kids learn Chinese vocabulary through the Circle Game

**Live App:** https://word-sheet-creator.nullshot.dev
