// Тест для проверки работы системы образов
const testOutfitFlow = () => {
  console.log('🧪 Testing outfit flow...');
  
  // Тестовый образ
  const testOutfit = {
    name: "Весенний кэжуал образ для фигуры hourglass",
    description: "Комфортный и стильный образ для весны, учитывающий особенности фигуры hourglass.",
    items: [
      {
        category: "Верх",
        name: "Блузка из хлопка",
        description: "Блузка свободного кроя с V-образным вырезом, темного цвета, чтобы визуально сузить плечи.",
        colors: ["темно-синий", "черный"],
        style: "casual",
        fit: "свободный",
        price: "2500"
      },
      {
        category: "Низ",
        name: "Расклешенная юбка миди",
        description: "Юбка А-силуэта из легкого хлопка, светлого цвета, добавляющая объем в нижнюю часть.",
        colors: ["светло-бежевый", "белый"],
        style: "casual",
        fit: "свободный",
        price: "3000"
      },
      {
        category: "Обувь",
        name: "Белые кеды",
        description: "Удобные и стильные белые кеды, подходящие к любому образу.",
        colors: ["белый"],
        style: "casual",
        fit: "38",
        price: "2000"
      }
    ],
    styleNotes: "Образ создан с учетом типа фигуры hourglass: темный верх уравновешивает широкие плечи, а светлый низ и расклешенная юбка добавляют объем в бедрах.",
    colorPalette: ["темно-синий", "бежевый", "белый"],
    totalPrice: "7500"
  };

  console.log('✅ Test outfit created:', testOutfit.name);
  console.log('📦 Items count:', testOutfit.items.length);
  console.log('🎨 Color palette:', testOutfit.colorPalette);
  
  // Тестируем поисковые запросы
  testOutfit.items.forEach((item, index) => {
    console.log(`\n🔍 Item ${index + 1}: ${item.name}`);
    console.log(`   Category: ${item.category}`);
    console.log(`   Colors: ${item.colors.join(', ')}`);
    console.log(`   Style: ${item.style}`);
    console.log(`   Fit: ${item.fit}`);
  });
  
  console.log('\n✅ Outfit flow test completed!');
  return testOutfit;
};

// Экспортируем для использования в браузере
if (typeof window !== 'undefined') {
  window.testOutfitFlow = testOutfitFlow;
}

module.exports = { testOutfitFlow };
