const fs = require('fs');
const html = fs.readFileSync('attachments.html', 'utf8');
const regex = /<a[^>]+href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi;
let match;
while ((match = regex.exec(html)) !== null) {
  const linkText = match[2].toLowerCase();
  const href = match[1];
  console.log(`Link: ${href} | Text: ${match[2].replace(/<[^>]+>/g, '').trim()}`);
}
