#!/bin/bash
# Cloudflare Pages Deploy Helper

echo "🚀 Cloudflare Pages Deployment Helper"
echo "======================================"

# Check if in website directory
if [ ! -f "index.html" ]; then
    echo "❌ Error: Not in website directory"
    exit 1
fi

# Commit changes
echo "📝 Committing changes..."
git add .
git commit -m "Deploy to Cloudflare Pages $(date +%Y-%m-%d)"

# Show status
echo ""
echo "✅ Ready to deploy!"
echo ""
echo "Next steps:"
echo "1. Push to GitHub: git push origin master"
echo "2. Go to https://dash.cloudflare.com/?to=/:account/workers-and-pages/create"
echo "3. Connect your GitHub repository"
echo "4. Deploy!"
echo ""
echo "Or use Direct Upload:"
echo "1. Go to Cloudflare Pages"
echo "2. Choose 'Direct Upload'"
echo "3. Upload all files from: $(pwd)"
