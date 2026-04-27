const fs = require('fs');
const fetchUrl = 'https://www.mercadopublico.cl/Procurement/Modules/RFB/DetailsAcquisition.aspx?qs=gPO0Ve93L/iLONI9UCe2GQ==';
fetch(fetchUrl)
  .then(r => r.text())
  .then(t => {
    fs.writeFileSync('mercadopublico_detail.html', t);
    console.log('HTML written to mercadopublico_detail.html');
  })
  .catch(console.error);
