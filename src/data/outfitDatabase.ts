// База данных готовых образов для симуляции
// Покрывает различные комбинации: пол, стиль, повод, сезон, тип фигуры

export interface OutfitTemplate {
  id: string;
  name: string;
  description: string;
  gender: 'male' | 'female';
  bodyType: string[];
  style: string[];
  occasion: string[];
  season: string[];
  items: OutfitItem[];
  totalPrice: string;
  styleNotes: string;
  colorPalette: string[];
  confidence: number;
}

export interface OutfitItem {
  category: string;
  name: string;
  description: string;
  colors: string[];
  style: string;
  fit: string;
  price: string;
}

// База данных женских образов
export const femaleOutfits: OutfitTemplate[] = [
  // CASUAL - SPRING/SUMMER
  {
    id: 'f_casual_spring_1',
    name: 'Весенний повседневный образ',
    description: 'Легкий и комфортный образ для весенних прогулок',
    gender: 'female',
    bodyType: ['hourglass', 'rectangle', 'triangle'],
    style: ['casual', 'comfortable'],
    occasion: ['casual', 'walking'],
    season: ['spring', 'summer'],
    items: [
      {
        category: 'Верх',
        name: 'Блузка хлопковая с цветочным принтом',
        description: 'Легкая блузка из натурального хлопка',
        colors: ['белый', 'голубой', 'розовый'],
        style: 'casual',
        fit: 'свободный',
        price: '2000-4000'
      },
      {
        category: 'Низ',
        name: 'Джинсы mom-fit',
        description: 'Джинсы свободного кроя с высокой посадкой',
        colors: ['синий', 'светло-синий'],
        style: 'casual',
        fit: 'свободный',
        price: '4000-8000'
      },
      {
        category: 'Обувь',
        name: 'Кроссовки белые',
        description: 'Удобные кроссовки для повседневной носки',
        colors: ['белый'],
        style: 'casual',
        fit: 'стандартный',
        price: '3000-6000'
      },
      {
        category: 'Аксессуары',
        name: 'Сумка через плечо',
        description: 'Практичная сумка среднего размера',
        colors: ['бежевый', 'коричневый'],
        style: 'casual',
        fit: 'стандартный',
        price: '2000-4000'
      }
    ],
    totalPrice: '11000-22000',
    styleNotes: 'Образ идеально подходит для весенних прогулок. Свободный крой обеспечивает комфорт, а цветочный принт добавляет весеннего настроения.',
    colorPalette: ['белый', 'голубой', 'синий'],
    confidence: 0.95
  },

  // BUSINESS - AUTUMN/WINTER
  {
    id: 'f_business_autumn_1',
    name: 'Деловой осенний образ',
    description: 'Элегантный деловой образ для офиса',
    gender: 'female',
    bodyType: ['hourglass', 'rectangle', 'inverted-triangle'],
    style: ['business', 'elegant'],
    occasion: ['business', 'office'],
    season: ['autumn', 'winter'],
    items: [
      {
        category: 'Верх',
        name: 'Блузка шелковая',
        description: 'Элегантная блузка из натурального шелка',
        colors: ['белый', 'бежевый', 'голубой'],
        style: 'business',
        fit: 'приталенный',
        price: '5000-10000'
      },
      {
        category: 'Низ',
        name: 'Юбка-карандаш',
        description: 'Классическая юбка-карандаш до колена',
        colors: ['черный', 'серый', 'синий'],
        style: 'business',
        fit: 'приталенный',
        price: '6000-12000'
      },
      {
        category: 'Верхняя одежда',
        name: 'Пиджак классический',
        description: 'Деловой пиджак из качественной ткани',
        colors: ['черный', 'серый', 'синий'],
        style: 'business',
        fit: 'приталенный',
        price: '8000-15000'
      },
      {
        category: 'Обувь',
        name: 'Туфли-лодочки',
        description: 'Классические туфли на каблуке',
        colors: ['черный', 'бежевый'],
        style: 'business',
        fit: 'стандартный',
        price: '4000-8000'
      }
    ],
    totalPrice: '23000-45000',
    styleNotes: 'Классический деловой образ, подходящий для любого офиса. Приталенный крой подчеркивает фигуру, а нейтральные цвета создают профессиональный вид.',
    colorPalette: ['черный', 'белый', 'серый'],
    confidence: 0.98
  },

  // EVENING - WINTER
  {
    id: 'f_evening_winter_1',
    name: 'Вечерний зимний образ',
    description: 'Гламурный образ для вечерних мероприятий',
    gender: 'female',
    bodyType: ['hourglass', 'inverted-triangle'],
    style: ['evening', 'glamorous'],
    occasion: ['evening', 'party'],
    season: ['winter'],
    items: [
      {
        category: 'Платье',
        name: 'Платье вечернее',
        description: 'Элегантное вечернее платье',
        colors: ['черный', 'красный', 'синий'],
        style: 'evening',
        fit: 'приталенный',
        price: '15000-30000'
      },
      {
        category: 'Обувь',
        name: 'Туфли на высоком каблуке',
        description: 'Элегантные туфли для вечерних выходов',
        colors: ['черный', 'золотой', 'серебряный'],
        style: 'evening',
        fit: 'стандартный',
        price: '6000-12000'
      },
      {
        category: 'Аксессуары',
        name: 'Клатч вечерний',
        description: 'Стильный клатч для вечерних мероприятий',
        colors: ['черный', 'золотой', 'серебряный'],
        style: 'evening',
        fit: 'стандартный',
        price: '3000-6000'
      }
    ],
    totalPrice: '24000-48000',
    styleNotes: 'Гламурный вечерний образ для особых случаев. Приталенное платье подчеркивает фигуру, а аксессуары добавляют элегантности.',
    colorPalette: ['черный', 'золотой', 'красный'],
    confidence: 0.97
  }
,

    {
    "id": "f_casual_spring_2",
    "name": "Весенний casual с джинсовой курткой",
    "description": "Стильный повседневный образ с джинсовой курткой",
    "gender": "female",
    "bodyType": [
      "hourglass",
      "rectangle",
      "triangle",
      "inverted-triangle"
    ],
    "style": [
      "casual",
      "comfortable"
    ],
    "occasion": [
      "casual"
    ],
    "season": [
      "spring"
    ],
    "items": [
      {
        "category": "Верх",
        "name": "Футболка базовая",
        "price": "1500-3000",
        "description": "Стильный верх",
        "colors": [
          "черный",
          "белый",
          "серый"
        ],
        "style": "casual",
        "fit": "стандартный"
      },
      {
        "category": "Верхняя одежда",
        "name": "Джинсовая куртка",
        "price": "5000-10000",
        "description": "Стильный верхняя одежда",
        "colors": [
          "черный",
          "белый",
          "серый"
        ],
        "style": "casual",
        "fit": "стандартный"
      },
      {
        "category": "Низ",
        "name": "Джинсы mom-fit",
        "price": "4000-8000",
        "description": "Стильный низ",
        "colors": [
          "черный",
          "белый",
          "серый"
        ],
        "style": "casual",
        "fit": "стандартный"
      },
      {
        "category": "Обувь",
        "name": "Кроссовки белые",
        "price": "3000-6000",
        "description": "Стильный обувь",
        "colors": [
          "черный",
          "белый",
          "серый"
        ],
        "style": "casual",
        "fit": "стандартный"
      }
    ],
    "totalPrice": "13500-27000",
    "styleNotes": "Стильный casual образ для spring сезона",
    "colorPalette": [
      "черный",
      "белый",
      "серый"
    ],
    "confidence": 0.92
  },

    {
    "id": "f_casual_spring_3",
    "name": "Весенний образ с платьем",
    "description": "Легкое платье для весенних дней",
    "gender": "female",
    "bodyType": [
      "hourglass",
      "rectangle",
      "triangle",
      "inverted-triangle"
    ],
    "style": [
      "casual",
      "comfortable"
    ],
    "occasion": [
      "casual"
    ],
    "season": [
      "spring"
    ],
    "items": [
      {
        "category": "Платье",
        "name": "Платье хлопковое",
        "price": "3000-6000",
        "description": "Стильный платье",
        "colors": [
          "черный",
          "белый",
          "серый"
        ],
        "style": "casual",
        "fit": "стандартный"
      },
      {
        "category": "Обувь",
        "name": "Балетки кожаные",
        "price": "2000-4000",
        "description": "Стильный обувь",
        "colors": [
          "черный",
          "белый",
          "серый"
        ],
        "style": "casual",
        "fit": "стандартный"
      },
      {
        "category": "Аксессуары",
        "name": "Солнцезащитные очки",
        "price": "1000-2000",
        "description": "Стильный аксессуары",
        "colors": [
          "черный",
          "белый",
          "серый"
        ],
        "style": "casual",
        "fit": "стандартный"
      }
    ],
    "totalPrice": "6000-12000",
    "styleNotes": "Стильный casual образ для spring сезона",
    "colorPalette": [
      "черный",
      "белый",
      "серый"
    ],
    "confidence": 0.92
  },

    {
    "id": "f_casual_summer_2",
    "name": "Летний образ с шортами",
    "description": "Комфортный летний образ",
    "gender": "female",
    "bodyType": [
      "hourglass",
      "rectangle",
      "triangle",
      "inverted-triangle"
    ],
    "style": [
      "casual",
      "comfortable"
    ],
    "occasion": [
      "casual"
    ],
    "season": [
      "summer"
    ],
    "items": [
      {
        "category": "Верх",
        "name": "Топ хлопковый",
        "price": "2000-4000",
        "description": "Стильный верх",
        "colors": [
          "черный",
          "белый",
          "серый"
        ],
        "style": "casual",
        "fit": "стандартный"
      },
      {
        "category": "Низ",
        "name": "Шорты джинсовые",
        "price": "3000-6000",
        "description": "Стильный низ",
        "colors": [
          "черный",
          "белый",
          "серый"
        ],
        "style": "casual",
        "fit": "стандартный"
      },
      {
        "category": "Обувь",
        "name": "Сандалии кожаные",
        "price": "2500-5000",
        "description": "Стильный обувь",
        "colors": [
          "черный",
          "белый",
          "серый"
        ],
        "style": "casual",
        "fit": "стандартный"
      }
    ],
    "totalPrice": "7500-15000",
    "styleNotes": "Стильный casual образ для summer сезона",
    "colorPalette": [
      "черный",
      "белый",
      "серый"
    ],
    "confidence": 0.92
  },

    {
    "id": "f_business_autumn_2",
    "name": "Деловой образ с юбкой-миди",
    "description": "Элегантный деловой образ",
    "gender": "female",
    "bodyType": [
      "hourglass",
      "rectangle",
      "triangle",
      "inverted-triangle"
    ],
    "style": [
      "business",
      "comfortable"
    ],
    "occasion": [
      "business"
    ],
    "season": [
      "autumn"
    ],
    "items": [
      {
        "category": "Верх",
        "name": "Блузка шелковая",
        "price": "5000-10000",
        "description": "Стильный верх",
        "colors": [
          "черный",
          "белый",
          "серый"
        ],
        "style": "business",
        "fit": "стандартный"
      },
      {
        "category": "Низ",
        "name": "Юбка-миди",
        "price": "6000-12000",
        "description": "Стильный низ",
        "colors": [
          "черный",
          "белый",
          "серый"
        ],
        "style": "business",
        "fit": "стандартный"
      },
      {
        "category": "Верхняя одежда",
        "name": "Пиджак классический",
        "price": "8000-15000",
        "description": "Стильный верхняя одежда",
        "colors": [
          "черный",
          "белый",
          "серый"
        ],
        "style": "business",
        "fit": "стандартный"
      },
      {
        "category": "Обувь",
        "name": "Туфли-лодочки",
        "price": "4000-8000",
        "description": "Стильный обувь",
        "colors": [
          "черный",
          "белый",
          "серый"
        ],
        "style": "business",
        "fit": "стандартный"
      }
    ],
    "totalPrice": "23000-45000",
    "styleNotes": "Стильный business образ для autumn сезона",
    "colorPalette": [
      "черный",
      "белый",
      "серый"
    ],
    "confidence": 0.92
  },

    {
    "id": "f_business_winter_2",
    "name": "Зимний деловой образ",
    "description": "Теплый деловой образ для зимы",
    "gender": "female",
    "bodyType": [
      "hourglass",
      "rectangle",
      "triangle",
      "inverted-triangle"
    ],
    "style": [
      "business",
      "comfortable"
    ],
    "occasion": [
      "business"
    ],
    "season": [
      "winter"
    ],
    "items": [
      {
        "category": "Верх",
        "name": "Блузка теплая",
        "price": "4000-8000",
        "description": "Стильный верх",
        "colors": [
          "черный",
          "белый",
          "серый"
        ],
        "style": "business",
        "fit": "стандартный"
      },
      {
        "category": "Низ",
        "name": "Брюки классические",
        "price": "5000-10000",
        "description": "Стильный низ",
        "colors": [
          "черный",
          "белый",
          "серый"
        ],
        "style": "business",
        "fit": "стандартный"
      },
      {
        "category": "Верхняя одежда",
        "name": "Пальто шерстяное",
        "price": "15000-25000",
        "description": "Стильный верхняя одежда",
        "colors": [
          "черный",
          "белый",
          "серый"
        ],
        "style": "business",
        "fit": "стандартный"
      },
      {
        "category": "Обувь",
        "name": "Сапоги на каблуке",
        "price": "6000-12000",
        "description": "Стильный обувь",
        "colors": [
          "черный",
          "белый",
          "серый"
        ],
        "style": "business",
        "fit": "стандартный"
      }
    ],
    "totalPrice": "30000-55000",
    "styleNotes": "Стильный business образ для winter сезона",
    "colorPalette": [
      "черный",
      "белый",
      "серый"
    ],
    "confidence": 0.92
  }];

// База данных мужских образов
export const maleOutfits: OutfitTemplate[] = [
  // CASUAL - SPRING/SUMMER
  {
    id: 'm_casual_spring_1',
    name: 'Весенний повседневный образ',
    description: 'Комфортный образ для весенних дней',
    gender: 'male',
    bodyType: ['rectangle', 'triangle', 'inverted-triangle'],
    style: ['casual', 'comfortable'],
    occasion: ['casual', 'walking'],
    season: ['spring', 'summer'],
    items: [
      {
        category: 'Верх',
        name: 'Футболка хлопковая',
        description: 'Мягкая футболка из 100% хлопка',
        colors: ['белый', 'серый', 'синий'],
        style: 'casual',
        fit: 'свободный',
        price: '1500-3000'
      },
      {
        category: 'Низ',
        name: 'Джинсы прямого кроя',
        description: 'Классические джинсы прямого кроя',
        colors: ['синий', 'светло-синий'],
        style: 'casual',
        fit: 'стандартный',
        price: '4000-8000'
      },
      {
        category: 'Обувь',
        name: 'Кроссовки спортивные',
        description: 'Удобные кроссовки для повседневной носки',
        colors: ['белый', 'серый'],
        style: 'casual',
        fit: 'стандартный',
        price: '3000-6000'
      },
      {
        category: 'Аксессуары',
        name: 'Часы спортивные',
        description: 'Стильные спортивные часы',
        colors: ['черный', 'серый'],
        style: 'casual',
        fit: 'стандартный',
        price: '2000-4000'
      }
    ],
    totalPrice: '10500-21000',
    styleNotes: 'Комфортный повседневный образ для активного образа жизни. Свободный крой обеспечивает удобство, а нейтральные цвета легко комбинируются.',
    colorPalette: ['белый', 'серый', 'синий'],
    confidence: 0.94
  },

  // BUSINESS - AUTUMN/WINTER
  {
    id: 'm_business_autumn_1',
    name: 'Деловой осенний образ',
    description: 'Классический деловой образ для офиса',
    gender: 'male',
    bodyType: ['rectangle', 'triangle', 'inverted-triangle'],
    style: ['business', 'classic'],
    occasion: ['business', 'office'],
    season: ['autumn', 'winter'],
    items: [
      {
        category: 'Верх',
        name: 'Рубашка офисная',
        description: 'Классическая рубашка из хлопка',
        colors: ['белый', 'голубой', 'розовый'],
        style: 'business',
        fit: 'стандартный',
        price: '3000-6000'
      },
      {
        category: 'Низ',
        name: 'Брюки классические',
        description: 'Деловые брюки из качественной ткани',
        colors: ['серый', 'синий', 'черный'],
        style: 'business',
        fit: 'стандартный',
        price: '5000-10000'
      },
      {
        category: 'Верхняя одежда',
        name: 'Пиджак классический',
        description: 'Деловой пиджак из шерсти',
        colors: ['серый', 'синий', 'черный'],
        style: 'business',
        fit: 'приталенный',
        price: '12000-20000'
      },
      {
        category: 'Обувь',
        name: 'Туфли офисные',
        description: 'Классические туфли для офиса',
        colors: ['черный', 'коричневый'],
        style: 'business',
        fit: 'стандартный',
        price: '5000-10000'
      }
    ],
    totalPrice: '25000-46000',
    styleNotes: 'Классический деловой образ, подходящий для любого офиса. Приталенный пиджак создает профессиональный вид, а качественные материалы обеспечивают комфорт.',
    colorPalette: ['серый', 'белый', 'черный'],
    confidence: 0.96
  },

  // EVENING - WINTER
  {
    id: 'm_evening_winter_1',
    name: 'Вечерний зимний образ',
    description: 'Элегантный образ для вечерних мероприятий',
    gender: 'male',
    bodyType: ['rectangle', 'inverted-triangle'],
    style: ['evening', 'elegant'],
    occasion: ['evening', 'party'],
    season: ['winter'],
    items: [
      {
        category: 'Костюм',
        name: 'Костюм-тройка',
        description: 'Элегантный костюм-тройка',
        colors: ['черный', 'темно-синий'],
        style: 'evening',
        fit: 'приталенный',
        price: '25000-40000'
      },
      {
        category: 'Рубашка',
        name: 'Рубашка вечерняя',
        description: 'Белая рубашка для вечерних выходов',
        colors: ['белый'],
        style: 'evening',
        fit: 'стандартный',
        price: '4000-8000'
      },
      {
        category: 'Обувь',
        name: 'Оксфорды классические',
        description: 'Элегантные туфли-оксфорды',
        colors: ['черный'],
        style: 'evening',
        fit: 'стандартный',
        price: '8000-15000'
      },
      {
        category: 'Аксессуары',
        name: 'Галстук шелковый',
        description: 'Элегантный шелковый галстук',
        colors: ['красный', 'бордовый', 'синий'],
        style: 'evening',
        fit: 'стандартный',
        price: '2000-4000'
      }
    ],
    totalPrice: '39000-67000',
    styleNotes: 'Элегантный вечерний образ для особых случаев. Костюм-тройка создает классический и стильный вид, подходящий для любых вечерних мероприятий.',
    colorPalette: ['черный', 'белый', 'красный'],
    confidence: 0.98
  }
,

    {
    "id": "m_casual_spring_2",
    "name": "Весенний образ с рубашкой",
    "description": "Стильный весенний образ",
    "gender": "male",
    "bodyType": [
      "rectangle",
      "triangle",
      "inverted-triangle"
    ],
    "style": [
      "casual",
      "comfortable"
    ],
    "occasion": [
      "casual"
    ],
    "season": [
      "spring"
    ],
    "items": [
      {
        "category": "Верх",
        "name": "Рубашка хлопковая",
        "price": "2500-5000",
        "description": "Стильный верх",
        "colors": [
          "черный",
          "белый",
          "серый"
        ],
        "style": "casual",
        "fit": "стандартный"
      },
      {
        "category": "Низ",
        "name": "Джинсы прямого кроя",
        "price": "4000-8000",
        "description": "Стильный низ",
        "colors": [
          "черный",
          "белый",
          "серый"
        ],
        "style": "casual",
        "fit": "стандартный"
      },
      {
        "category": "Обувь",
        "name": "Лоферы кожаные",
        "price": "4000-8000",
        "description": "Стильный обувь",
        "colors": [
          "черный",
          "белый",
          "серый"
        ],
        "style": "casual",
        "fit": "стандартный"
      }
    ],
    "totalPrice": "10500-21000",
    "styleNotes": "Стильный casual образ для spring сезона",
    "colorPalette": [
      "черный",
      "белый",
      "серый"
    ],
    "confidence": 0.9
  },

    {
    "id": "m_casual_summer_2",
    "name": "Летний образ с шортами",
    "description": "Комфортный летний образ",
    "gender": "male",
    "bodyType": [
      "rectangle",
      "triangle",
      "inverted-triangle"
    ],
    "style": [
      "casual",
      "comfortable"
    ],
    "occasion": [
      "casual"
    ],
    "season": [
      "summer"
    ],
    "items": [
      {
        "category": "Верх",
        "name": "Поло хлопковое",
        "price": "2000-4000",
        "description": "Стильный верх",
        "colors": [
          "черный",
          "белый",
          "серый"
        ],
        "style": "casual",
        "fit": "стандартный"
      },
      {
        "category": "Низ",
        "name": "Шорты хлопковые",
        "price": "2000-4000",
        "description": "Стильный низ",
        "colors": [
          "черный",
          "белый",
          "серый"
        ],
        "style": "casual",
        "fit": "стандартный"
      },
      {
        "category": "Обувь",
        "name": "Сандалии кожаные",
        "price": "3000-6000",
        "description": "Стильный обувь",
        "colors": [
          "черный",
          "белый",
          "серый"
        ],
        "style": "casual",
        "fit": "стандартный"
      }
    ],
    "totalPrice": "7000-14000",
    "styleNotes": "Стильный casual образ для summer сезона",
    "colorPalette": [
      "черный",
      "белый",
      "серый"
    ],
    "confidence": 0.9
  },

    {
    "id": "m_business_autumn_2",
    "name": "Осенний деловой образ",
    "description": "Классический деловой образ",
    "gender": "male",
    "bodyType": [
      "rectangle",
      "triangle",
      "inverted-triangle"
    ],
    "style": [
      "business",
      "comfortable"
    ],
    "occasion": [
      "business"
    ],
    "season": [
      "autumn"
    ],
    "items": [
      {
        "category": "Верх",
        "name": "Рубашка офисная",
        "price": "3000-6000",
        "description": "Стильный верх",
        "colors": [
          "черный",
          "белый",
          "серый"
        ],
        "style": "business",
        "fit": "стандартный"
      },
      {
        "category": "Низ",
        "name": "Брюки классические",
        "price": "5000-10000",
        "description": "Стильный низ",
        "colors": [
          "черный",
          "белый",
          "серый"
        ],
        "style": "business",
        "fit": "стандартный"
      },
      {
        "category": "Верхняя одежда",
        "name": "Пиджак классический",
        "price": "12000-20000",
        "description": "Стильный верхняя одежда",
        "colors": [
          "черный",
          "белый",
          "серый"
        ],
        "style": "business",
        "fit": "стандартный"
      },
      {
        "category": "Обувь",
        "name": "Туфли офисные",
        "price": "5000-10000",
        "description": "Стильный обувь",
        "colors": [
          "черный",
          "белый",
          "серый"
        ],
        "style": "business",
        "fit": "стандартный"
      }
    ],
    "totalPrice": "25000-46000",
    "styleNotes": "Стильный business образ для autumn сезона",
    "colorPalette": [
      "черный",
      "белый",
      "серый"
    ],
    "confidence": 0.9
  }];

// Функция для поиска подходящего образа
export function findMatchingOutfit(
  gender: 'male' | 'female',
  bodyType: string,
  style: string[],
  occasion: string,
  season: string
): OutfitTemplate | null {
  const outfits = gender === 'female' ? femaleOutfits : maleOutfits;
  
  // Ищем образы, которые подходят по всем критериям
  const matchingOutfits = outfits.filter(outfit => {
    const bodyTypeMatch = outfit.bodyType.includes(bodyType);
    const styleMatch = outfit.style.some(s => style.includes(s));
    const occasionMatch = outfit.occasion.includes(occasion);
    const seasonMatch = outfit.season.includes(season);
    
    return bodyTypeMatch && styleMatch && occasionMatch && seasonMatch;
  });
  
  if (matchingOutfits.length > 0) {
    // Возвращаем случайный подходящий образ
    return matchingOutfits[Math.floor(Math.random() * matchingOutfits.length)];
  }
  
  // Если точного совпадения нет, ищем частичные совпадения
  const partialMatches = outfits.filter(outfit => {
    const styleMatch = outfit.style.some(s => style.includes(s));
    const occasionMatch = outfit.occasion.includes(occasion);
    
    return styleMatch && occasionMatch;
  });
  
  if (partialMatches.length > 0) {
    return partialMatches[Math.floor(Math.random() * partialMatches.length)];
  }
  
  return null;
}

// Функция для получения всех образов определенного типа
export function getOutfitsByType(
  gender: 'male' | 'female',
  occasion?: string,
  season?: string
): OutfitTemplate[] {
  const outfits = gender === 'female' ? femaleOutfits : maleOutfits;
  
  return outfits.filter(outfit => {
    const occasionMatch = !occasion || outfit.occasion.includes(occasion);
    const seasonMatch = !season || outfit.season.includes(season);
    
    return occasionMatch && seasonMatch;
  });
}

// Статистика базы данных
export const outfitDatabaseStats = {
  totalOutfits: femaleOutfits.length + maleOutfits.length,
  femaleOutfits: femaleOutfits.length,
  maleOutfits: maleOutfits.length,
  occasions: ['casual', 'business', 'evening'],
  seasons: ['spring', 'summer', 'autumn', 'winter'],
  bodyTypes: ['hourglass', 'inverted-triangle', 'triangle', 'rectangle', 'circle', 'diamond']
};
