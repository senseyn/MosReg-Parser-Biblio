import { chromium, devices } from 'playwright'; // для парсинга
import fs from 'fs';
import 'dotenv/config';

// импорт переменных из .env
const LINK = process.env.LINK;
const SCROLL_MAX_BIBLIO_NAME = Number(process.env.SCROLL_MAX_BIBLIO_NAME);
const NAME_BIBLIO_MENU = process.env.NAME_BIBLIO_MENU;
const MAXSCROLL = process.env.MAXSCROLL;

// ПРЕДНАСТРОЙКИ ДЛЯ БРАУЗЕРА
(async () => {
  const browser = await chromium.launch({ headless: false,});
  const context = await browser.newContext(devices['iPhone 11']);
  const page = await context.newPage();

  
  // ССЫЛКА ДЛЯ ПАРСИНГА
  await page.goto(LINK, { waitUntil: 'domcontentloaded' });
  await new Promise(resolve => setTimeout(resolve, 100));
  await page.addLocatorHandler(
    page.getByText('Мы используем куки и собираем аналитику'),
    async () => {
      await page.getByText('Понятно', { exact: true }).click();
      console.log('КУКИ ЗАКРЫЛИ')
    }
  );


  // РАЗМЕР ОКНА ОТЛАДКИ
  await page.setViewportSize({width: 1200, height: 1080});  

  // КЛИК ВЫБОР БИБЛИОТЕКИ
  await page.getByText('Библиотека', { exact: true }).click();

  // СКРОЛ БЛОКА ВЫБОРА БИБЛИОТЕКИ
  await new Promise(resolve => setTimeout(resolve, 1000));
  await page.getByRole('menu').hover()  
  await page.mouse.wheel(0, SCROLL_MAX_BIBLIO_NAME);

  // КЛИКАЕМ ПО НУЖНОЙ БИБИОЕКЕ
  await new Promise(resolve => setTimeout(resolve, 1000));
  await page.getByText(NAME_BIBLIO_MENU, { exact: true }).click();

  // ПРИМЕНЯЕМ ПОИСК
  await new Promise(resolve => setTimeout(resolve, 1000));
  await page.getByText('Применить', { exact: true }).click();

  // ПОЛУЧАЕМ ЭЛЕМЕНТЫ
  await new Promise(resolve => setTimeout(resolve, 1000));

  // прокрутка страницы
  console.log('ПРОКРУЧИВАЕМ ВСЮ СТРАНИЦУ')
  
  for (let i = 0; i < MAXSCROLL; i++) {
    await page.mouse.wheel(0, 1000);
    await page.waitForTimeout(500);
  }
  
  // фильтруем только карточки с книгами по параметру
  const bookCards = page.locator('div.MuiContainer-root > div > div > div.MuiBox-root:has(p)');
  const count = await bookCards.count();
  console.log(`КНИГ НАЙДЕНО: ${count}`)
  
  // масив книг
  const books = [];
  
  // сбор данных
  console.log('ПАРСИМ КНИГИ')
  for (let i = 0; i < count; i++) {
    const card = bookCards.nth(i);

    const title = await card.locator('span').nth(0).innerText().catch(() => 'Нет названия')
    console.log(title)
    const autor = await card.locator('span').nth(1).innerText().catch(() => 'Автор не указан')
    books.push(
      { title, autor }
    );
  }
  console.log('ЗАПИСЬ В ФАЙЛ')
  fs.writeFileSync('data.json', JSON.stringify(books, null, 2));
  
  // ЗАКРЫВАЕМ БРАУЗЕР
  await new Promise(resolve => setTimeout(resolve, 100000));

  await context.close();
  await browser.close();

})();