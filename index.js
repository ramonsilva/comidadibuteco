const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  let all = [];
  let butecos = [];
  let i = 1;
  do {
    await page.goto('https://comidadibuteco.com.br/category/butecos/rio-de-janeiro/page/' + i);
    const resultsSelector = '.result-inner';

    butecos = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('.result-inner'));
      return anchors.map(anchor => {
        const location = anchor.querySelector('p').textContent.trim();
        const nameButeco = anchor.querySelector('h2').textContent.trim();
        const regex = /\|(.*?),/;
        const link = anchor.querySelector('a').href
        let neighborhood = location.match(regex);
        neighborhood = neighborhood ? neighborhood[1].trim() : 'N/D';
        return {
          neighborhood,
          nameButeco,
          location,
          link,
        }
      });
    }, resultsSelector);
    all = all.concat(butecos);
    i++
  } while (butecos.length > 0)

  for (i=0;i<all.length;i++) {
    all[i].menu = await getMenuButeco(page, all[i].link);
  }

  await browser.close();

  const writeStream = fs.createWriteStream('butecos.csv');
  all.forEach((buteco) => {
    writeStream.write(`${buteco.neighborhood};${buteco.nameButeco};${buteco.location};${buteco.menu}\n`, () => {});
  })

  writeStream.end();
  writeStream.on('finish', () => {
    console.log('finish write stream, moving along')
  }).on('error', (err) => {
    console.log(err)
  })
})();

const getMenuButeco = async (page, link) => {
  await page.goto(link);

  return page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll('.row p'));
    return anchors[1].textContent;
  }, '.one .mecanica');
}