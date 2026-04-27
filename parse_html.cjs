const fs = require('fs');
const html = fs.readFileSync('mercadopublico_detail.html', 'utf8');
const regex = /<a[^>]+href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi;
let match;
while ((match = regex.exec(html)) !== null) {
  const linkText = match[2].toLowerCase();
  const href = match[1];
  if (linkText.includes('anexo') || linkText.includes('base') || linkText.includes('adjunto') || href.includes('Download') || linkText.includes('descargar')) {
    console.log(`Text: ${match[2].replace(/<[^>]+>/g, '').trim()} | Link: ${href}`);
  }
}
