const SCRAPFLY_KEY = process.env.SCRAPFLY_KEY || 'scp-live-d365b15c93544bce8fff4b8131dccd1b';

async function scrapeAgiles() {
    console.log('Iniciando scraper de Compra Ágil (Modo Scrapfly Industrial 2026)...');
    
    const url = 'https://buscador.mercadopublico.cl/compra-agil';
    const scrapflyUrl = `https://api.scrapfly.io/scrape?key=${SCRAPFLY_KEY}&url=${encodeURIComponent(url)}&asp=true&render_js=true&country=cl&proxy_pool=public_residential_pool`;

    try {
        const response = await fetch(scrapflyUrl);
        const data = await response.json();

        if (!data.result || !data.result.content) {
            console.error('[Scrapfly] No se obtuvo contenido:', data);
            return [];
        }

        const html = data.result.content;
        
        // Extraer tarjetas mediante Regex sobre el HTML (Más rápido y robusto que DOM)
        // Buscamos bloques que contengan ID: XXXX-XX-COT26
        const cardMatches = html.match(/<div[^>]*>(?:(?!<\/div>).)*ID:\s*[A-Z0-9-]+(?:(?!<\/div>).)*<\/div>/gs) || [];
        
        console.log(`[Scrapfly] Procesando ${cardMatches.length} posibles tarjetas...`);

        const results = [];
        // Si el Regex de bloques falla, intentamos extraer por patrones de texto sueltos
        // Pero lo ideal es usar un parser simple
        const cleanText = html.replace(/<[^>]*>?/gm, ' '); // Strip tags para búsqueda de texto

        // Patrón para IDs de Compra Ágil
        const idRegex = /ID:\s*([A-Z0-9-]+)/gi;
        let match;
        const seenIds = new Set();

        while ((match = idRegex.exec(cleanText)) !== null) {
            const id = match[1];
            if (seenIds.has(id)) continue;
            seenIds.add(id);

            // Intentar extraer presupuesto cerca del ID
            const context = cleanText.substring(match.index, match.index + 500);
            const budgetMatch = context.match(/\$\s*([0-9.]+)/);
            const budget = budgetMatch ? parseInt(budgetMatch[1].replace(/\./g, '')) : 0;

            results.push({
                id: id,
                title: `Compra Ágil ${id}`, // Simplificado ya que extraer el título del HTML plano es costoso
                entity: "Organismo Público",
                region: context.includes('Región') ? "Región Detectada" : "Metropolitana",
                budget: budget,
                deadline: new Date().toISOString(), // Fallback
                source: 'ComprasAgiles',
                type: 'compra_agil',
                typeName: 'Compra Ágil (Directa)',
                url: `https://www.mercadopublico.cl/Procurement/Modules/RFB/DetailsAcquisition.aspx?idlicitacion=${id}`
            });
        }

        console.log(`[Scrapfly] Éxito: ${results.length} oportunidades extraídas.`);
        return results;
    } catch (err) {
        console.error('[Scrapfly] Error crítico:', err.message);
        return [];
    }
}

if (require.main === module) {
    scrapeAgiles().then(res => console.log('Muestra Scrapfly:', JSON.stringify(res.slice(0, 1), null, 2)));
}

module.exports = { scrapeAgiles };
