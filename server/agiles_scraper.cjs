const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function scrapeAgiles() {
    console.log('Iniciando scraper de Compra Ágil (Modo 2026)...');
    const browser = await puppeteer.launch({ 
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    try {
        await page.setViewport({ width: 1280, height: 900 });
        
        console.log('Navegando al Buscador de Compra Ágil...');
        await page.goto('https://buscador.mercadopublico.cl/compra-agil', { waitUntil: 'networkidle2', timeout: 60000 });
        
        console.log('Esperando carga de tarjetas...');
        // Esperar a que aparezca al menos una tarjeta de resultado
        await page.waitForSelector('div[class*="hFMaVA"], div[class*="Card"]', { timeout: 15000 }).catch(() => console.log('Timeout esperando tarjetas, intentando scroll...'));
        
        // Scroll para cargar más si es necesario
        await page.evaluate(() => window.scrollBy(0, 500));
        await new Promise(r => setTimeout(r, 2000));

        const data = await page.evaluate(() => {
            // Buscamos los contenedores de las tarjetas
            // Nota: las clases sc-xxxx son dinámicas, pero la estructura se mantiene
            const cards = Array.from(document.querySelectorAll('div[class*="loAbOW"]')); 
            
            return cards.map(card => {
                const idSpan = card.querySelector('span[class*="eYRgYp"]');
                const titleH4 = card.querySelector('h4');
                const entityP = card.querySelector('p[class*="gYgKtn"]');
                const budgetH3 = card.querySelector('h3[class*="jaayVL"]');
                const deadlineDiv = card.querySelector('div[class*="gizxGt"]');
                
                const id = idSpan ? idSpan.innerText.replace('ID: ', '').trim() : null;
                if (!id) return null;

                return {
                    id: id,
                    title: titleH4 ? titleH4.innerText.trim() : 'Sin título',
                    entity: entityP ? entityP.innerText.trim() : 'Entidad desconocida',
                    budget: budgetH3 ? parseInt(budgetH3.innerText.replace(/\D/g, '')) : 0,
                    deadline: deadlineDiv ? deadlineDiv.innerText.replace('\n', ' ').trim() : 'No informada',
                    source: 'ComprasAgilesScraper',
                    type: 'compra_agil',
                    typeName: 'Compra Ágil (Directa)',
                    url: `https://www.mercadopublico.cl/Procurement/Modules/RFB/DetailsAcquisition.aspx?idlicitacion=${id}`
                };
            }).filter(item => item !== null);
        });

        console.log(`Se encontraron ${data.length} compras ágiles.`);
        if (data.length > 0) {
            console.log('Ejemplo de resultado:', JSON.stringify(data[0], null, 2));
        }
        
        await browser.close();
        return data;
    } catch (err) {
        console.error('Error durante el scraping:', err.message);
        if (browser) await browser.close();
        return [];
    }
}

if (require.main === module) {
    scrapeAgiles();
}

module.exports = { scrapeAgiles };
