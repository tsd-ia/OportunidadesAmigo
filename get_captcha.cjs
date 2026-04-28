const fs = require('fs');

async function main() {
  const SCRAPFLY_KEY = 'scp-live-d365b15c93544bce8fff4b8131dccd1b';
  const url = 'https://www.mercadopublico.cl/Procurement/Modules/Attachment/ViewAttachment.aspx?enc=xdaTzglL1a%2bWaLBoaRdGtZSvf1Y1aYplxF7Iow8HWnEnBzyRoTXP%2bkm8BihQ9Ut%2blhSmqxr52ivNz1IsUMbfxO%2fxxNV3U5ddsGBoaKxGwcA15CLwL55jPiNlKO3QOueHEkOzZQdTiJU4jtWEDKnw4orhQFDaOsSN5eyacrD%2fdet9SlCj%2fYzgT3vsNAW1qsZyqdPEk0pn7QzQPDQsrrC4I5%2btrBeaYzx9Z%2bd64HvsfjyG%2fFC%2b1x1JQVbhoRwPz6SCt%2fc51m%2bvD0UeqzVmnbbmg33QK67hnrpJvHPwq6y3urQQ2AzwL7qAnUAfgB5X%2bYt9';
  
  const scenario = [
    { screenshot: { selector: 'img[src*="Captcha.aspx"]', name: 'captcha' } }
  ];

  const scrapflyUrl = `https://api.scrapfly.io/scrape?key=${SCRAPFLY_KEY}&url=${encodeURIComponent(url)}&asp=true&render_js=true&country=cl&proxy_pool=public_residential_pool&screenshots[captcha]=img%5Bsrc*=%22Captcha.aspx%22%5D`;

  console.log('Fetching captcha screenshot...');
  const res = await fetch(scrapflyUrl);
  const data = await res.json();
  
  if (data.result && data.result.screenshots && data.result.screenshots.captcha) {
    fs.writeFileSync('captcha_screenshot.png', data.result.screenshots.captcha.data, 'base64');
    console.log('Saved captcha_screenshot.png');
  } else {
    console.error('Failed to get screenshot:', JSON.stringify(data, null, 2));
  }
}

main();
