const Product = require("../models/Product");
const { getColorScore } = require("../utils/colorCompatibility");

// 🎯 Главная функция
async function generateCapsule(capsule) {
  const { rules } = capsule;
  // 1. Получаем базовый пул товаров
  const baseProducts = await getBaseProducts(rules);

  if (!baseProducts.length) {
    throw new Error("No products found for capsule rules");
  }

  // 2. Выбираем anchor (основной товар)
  const anchor = pickAnchorProduct(baseProducts);

  // 🎨 3. Определяем основной цвет капсулы (palette)
  const paletteColor = anchor.colorGroup?.[0];

  const items = [];

  items.push({
    product: anchor._id,
    role: anchor.capsuleRole,
    order: 0,
  });

  const requiredRoles = rules?.requiredRoles || ["top", "bottom", "shoes"];

  let order = 1;

  // 4. Обязательные элементы
  for (const role of requiredRoles) {
    if (role === anchor.capsuleRole) continue;

    const match = findBestMatch(
      anchor,
      baseProducts,
      role,
      items,
      paletteColor
    );

    if (match) {
      items.push({
        product: match._id,
        role,
        order: order++,
      });
    }
  }

  // 5. Дополнительные элементы
  const optionalRoles = ["outerwear", "accessory", "bag"];

  for (const role of optionalRoles) {
    if (items.find((i) => i.role === role)) continue;

    const match = findBestMatch(
      anchor,
      baseProducts,
      role,
      items,
      paletteColor
    );

    if (match) {
      items.push({
        product: match._id,
        role,
        order: order++,
      });
    }
  }

  return items;
}

// 🧱 Получаем базовые товары по rules
async function getBaseProducts(rules = {}) {
  const query = {};

  if (rules.styles?.length) {
    query.style = { $in: rules.styles };
  }

  if (rules.seasons?.length) {
    query.season = { $in: rules.seasons };
  }

  if (rules.brands?.length) {
    query.brand = { $in: rules.brands };
  }

  // if (rules.colorGroups?.length) {
  //   query.colorGroup = { $in: rules.colorGroups };
  // }

  if (rules.gender?.length) {
    query.gender = { $in: rules.gender };
  }

  return Product.find(query).sort("-popularityScore").limit(200).lean();
}

// 🎯 Выбираем anchor
function pickAnchorProduct(products) {
  const priorityRoles = ["top", "outerwear"];

  for (const role of priorityRoles) {
    const candidates = products.filter((p) => p.capsuleRole === role);
    if (candidates.length) {
      return candidates[Math.floor(Math.random() * candidates.length)];
    }
  }

  return products[Math.floor(Math.random() * products.length)];
}

// 🔍 Поиск лучшего совпадения
function findBestMatch(anchor, products, role, selectedItems, paletteColor) {
  const candidates = products.filter(
    (p) =>
      p.capsuleRole === role &&
      !selectedItems.find((i) => i.product.toString() === p._id.toString())
  );

  if (!candidates.length) return null;

  let best = null;
  let bestScore = -1;

  for (const candidate of candidates) {
    const score = calculateScore(anchor, candidate, paletteColor);

    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  return best;
}

// 🧠 Улучшенный скоринг
function calculateScore(a, b, paletteColor) {
  let score = 0;

  // 1. стиль
  if (hasIntersection(a.style, b.style)) {
    score += 3;
  }

  // 2. сезон
  if (hasIntersection(a.season, b.season)) {
    score += 2;
  }

  // 🎨 3. цвет через palette (главное улучшение)
  const colorScore = getBestColorMatch(
    paletteColor ? [paletteColor] : a.colorGroup,
    b.colorGroup
  );

  score += colorScore * 4;

  // 4. формальность
  if (a.formality && b.formality && a.formality === b.formality) {
    score += 2;
  }

  // 5. бренд (маленький бонус)
  if (a.brand && b.brand && a.brand === b.brand) {
    score += 1;
  }

  // 6. популярность
  score += (b.popularityScore || 0) * 0.01;

  return score;
}

// 🎨 Лучшее совпадение цветов
function getBestColorMatch(colorsA = [], colorsB = []) {
  let best = 0;

  for (const c1 of colorsA) {
    for (const c2 of colorsB) {
      const score = getColorScore(c1, c2);
      if (score > best) best = score;
    }
  }

  return best;
}

// 🔁 пересечение массивов
function hasIntersection(arr1 = [], arr2 = []) {
  return arr1.some((val) => arr2.includes(val));
}

module.exports = {
  generateCapsule,
};
