// Скрипт для расширения базы данных образов
// Позволяет легко добавлять новые образы и комбинации

const fs = require('fs');
const path = require('path');

// Шаблоны для генерации новых образов
const outfitTemplates = {
  female: {
    casual: {
      spring: [
        {
          name: 'Весенний casual с джинсовой курткой',
          description: 'Стильный повседневный образ с джинсовой курткой',
          items: [
            { category: 'Верх', name: 'Футболка базовая', price: '1500-3000' },
            { category: 'Верхняя одежда', name: 'Джинсовая куртка', price: '5000-10000' },
            { category: 'Низ', name: 'Джинсы mom-fit', price: '4000-8000' },
            { category: 'Обувь', name: 'Кроссовки белые', price: '3000-6000' }
          ],
          totalPrice: '13500-27000'
        },
        {
          name: 'Весенний образ с платьем',
          description: 'Легкое платье для весенних дней',
          items: [
            { category: 'Платье', name: 'Платье хлопковое', price: '3000-6000' },
            { category: 'Обувь', name: 'Балетки кожаные', price: '2000-4000' },
            { category: 'Аксессуары', name: 'Солнцезащитные очки', price: '1000-2000' }
          ],
          totalPrice: '6000-12000'
        }
      ],
      summer: [
        {
          name: 'Летний образ с шортами',
          description: 'Комфортный летний образ',
          items: [
            { category: 'Верх', name: 'Топ хлопковый', price: '2000-4000' },
            { category: 'Низ', name: 'Шорты джинсовые', price: '3000-6000' },
            { category: 'Обувь', name: 'Сандалии кожаные', price: '2500-5000' }
          ],
          totalPrice: '7500-15000'
        }
      ]
    },
    business: {
      autumn: [
        {
          name: 'Деловой образ с юбкой-миди',
          description: 'Элегантный деловой образ',
          items: [
            { category: 'Верх', name: 'Блузка шелковая', price: '5000-10000' },
            { category: 'Низ', name: 'Юбка-миди', price: '6000-12000' },
            { category: 'Верхняя одежда', name: 'Пиджак классический', price: '8000-15000' },
            { category: 'Обувь', name: 'Туфли-лодочки', price: '4000-8000' }
          ],
          totalPrice: '23000-45000'
        }
      ],
      winter: [
        {
          name: 'Зимний деловой образ',
          description: 'Теплый деловой образ для зимы',
          items: [
            { category: 'Верх', name: 'Блузка теплая', price: '4000-8000' },
            { category: 'Низ', name: 'Брюки классические', price: '5000-10000' },
            { category: 'Верхняя одежда', name: 'Пальто шерстяное', price: '15000-25000' },
            { category: 'Обувь', name: 'Сапоги на каблуке', price: '6000-12000' }
          ],
          totalPrice: '30000-55000'
        }
      ]
    }
  },
  male: {
    casual: {
      spring: [
        {
          name: 'Весенний образ с рубашкой',
          description: 'Стильный весенний образ',
          items: [
            { category: 'Верх', name: 'Рубашка хлопковая', price: '2500-5000' },
            { category: 'Низ', name: 'Джинсы прямого кроя', price: '4000-8000' },
            { category: 'Обувь', name: 'Лоферы кожаные', price: '4000-8000' }
          ],
          totalPrice: '10500-21000'
        }
      ],
      summer: [
        {
          name: 'Летний образ с шортами',
          description: 'Комфортный летний образ',
          items: [
            { category: 'Верх', name: 'Поло хлопковое', price: '2000-4000' },
            { category: 'Низ', name: 'Шорты хлопковые', price: '2000-4000' },
            { category: 'Обувь', name: 'Сандалии кожаные', price: '3000-6000' }
          ],
          totalPrice: '7000-14000'
        }
      ]
    },
    business: {
      autumn: [
        {
          name: 'Осенний деловой образ',
          description: 'Классический деловой образ',
          items: [
            { category: 'Верх', name: 'Рубашка офисная', price: '3000-6000' },
            { category: 'Низ', name: 'Брюки классические', price: '5000-10000' },
            { category: 'Верхняя одежда', name: 'Пиджак классический', price: '12000-20000' },
            { category: 'Обувь', name: 'Туфли офисные', price: '5000-10000' }
          ],
          totalPrice: '25000-46000'
        }
      ]
    }
  }
};

// Функция для генерации новых образов
function generateNewOutfits() {
  const newOutfits = [];
  
  // Генерируем женские образы
  Object.entries(outfitTemplates.female).forEach(([style, seasons]) => {
    Object.entries(seasons).forEach(([season, outfits]) => {
      outfits.forEach((outfit, index) => {
        const newOutfit = {
          id: `f_${style}_${season}_${index + 2}`,
          name: outfit.name,
          description: outfit.description,
          gender: 'female',
          bodyType: ['hourglass', 'rectangle', 'triangle', 'inverted-triangle'],
          style: [style, 'comfortable'],
          occasion: [style === 'casual' ? 'casual' : 'business'],
          season: [season],
          items: outfit.items.map(item => ({
            ...item,
            description: `Стильный ${item.category.toLowerCase()}`,
            colors: ['черный', 'белый', 'серый'],
            style: style,
            fit: 'стандартный'
          })),
          totalPrice: outfit.totalPrice,
          styleNotes: `Стильный ${style} образ для ${season} сезона`,
          colorPalette: ['черный', 'белый', 'серый'],
          confidence: 0.92
        };
        
        newOutfits.push(newOutfit);
      });
    });
  });
  
  // Генерируем мужские образы
  Object.entries(outfitTemplates.male).forEach(([style, seasons]) => {
    Object.entries(seasons).forEach(([season, outfits]) => {
      outfits.forEach((outfit, index) => {
        const newOutfit = {
          id: `m_${style}_${season}_${index + 2}`,
          name: outfit.name,
          description: outfit.description,
          gender: 'male',
          bodyType: ['rectangle', 'triangle', 'inverted-triangle'],
          style: [style, 'comfortable'],
          occasion: [style === 'casual' ? 'casual' : 'business'],
          season: [season],
          items: outfit.items.map(item => ({
            ...item,
            description: `Стильный ${item.category.toLowerCase()}`,
            colors: ['черный', 'белый', 'серый'],
            style: style,
            fit: 'стандартный'
          })),
          totalPrice: outfit.totalPrice,
          styleNotes: `Стильный ${style} образ для ${season} сезона`,
          colorPalette: ['черный', 'белый', 'серый'],
          confidence: 0.90
        };
        
        newOutfits.push(newOutfit);
      });
    });
  });
  
  return newOutfits;
}

// Функция для обновления файла базы данных
function updateOutfitDatabase() {
  const newOutfits = generateNewOutfits();
  
  console.log(`🎨 Сгенерировано ${newOutfits.length} новых образов`);
  
  // Читаем существующий файл
  const dbPath = path.join(__dirname, '../src/data/outfitDatabase.ts');
  let content = fs.readFileSync(dbPath, 'utf8');
  
  // Добавляем новые образы в женскую базу
  const femaleOutfitsEnd = content.indexOf('];', content.indexOf('export const femaleOutfits'));
  const newFemaleOutfits = newOutfits.filter(o => o.gender === 'female');
  
  if (newFemaleOutfits.length > 0) {
    const femaleOutfitsStr = newFemaleOutfits.map(outfit => 
      `  ${JSON.stringify(outfit, null, 2).split('\n').join('\n  ')}`
    ).join(',\n\n  ');
    
    content = content.slice(0, femaleOutfitsEnd) + ',\n\n  ' + femaleOutfitsStr + content.slice(femaleOutfitsEnd);
  }
  
  // Добавляем новые образы в мужскую базу
  const maleOutfitsEnd = content.indexOf('];', content.indexOf('export const maleOutfits'));
  const newMaleOutfits = newOutfits.filter(o => o.gender === 'male');
  
  if (newMaleOutfits.length > 0) {
    const maleOutfitsStr = newMaleOutfits.map(outfit => 
      `  ${JSON.stringify(outfit, null, 2).split('\n').join('\n  ')}`
    ).join(',\n\n  ');
    
    content = content.slice(0, maleOutfitsEnd) + ',\n\n  ' + maleOutfitsStr + content.slice(maleOutfitsEnd);
  }
  
  // Обновляем статистику
  const totalOutfits = newOutfits.length + 6; // 6 существующих образов
  content = content.replace(
    /totalOutfits: \d+/,
    `totalOutfits: ${totalOutfits}`
  );
  
  // Записываем обновленный файл
  fs.writeFileSync(dbPath, content, 'utf8');
  
  console.log('✅ База данных образов обновлена!');
  console.log(`📊 Всего образов: ${totalOutfits}`);
  console.log(`👩 Женских образов: ${newFemaleOutfits.length + 3}`);
  console.log(`👨 Мужских образов: ${newMaleOutfits.length + 3}`);
}

// Запускаем обновление
if (require.main === module) {
  updateOutfitDatabase();
}

module.exports = { generateNewOutfits, updateOutfitDatabase };
