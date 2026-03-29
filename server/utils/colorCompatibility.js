const COLOR_COMPATIBILITY = {
  black: {
    white: 1,
    neutral: 0.9,
    earth: 0.8,
    denim: 0.9,
    bright: 0.6,
    pastel: 0.7,
    black: 1,
  },

  white: {
    black: 1,
    neutral: 0.9,
    earth: 0.8,
    denim: 0.9,
    bright: 0.8,
    pastel: 0.9,
    white: 1,
  },

  neutral: {
    black: 0.9,
    white: 0.9,
    earth: 0.9,
    denim: 0.8,
    bright: 0.6,
    pastel: 0.8,
  },

  earth: {
    neutral: 0.9,
    white: 0.8,
    black: 0.8,
    denim: 0.7,
    bright: 0.5,
  },

  denim: {
    white: 0.9,
    black: 0.9,
    neutral: 0.8,
    earth: 0.7,
    bright: 0.6,
  },

  bright: {
    neutral: 0.6,
    white: 0.8,
    black: 0.6,
    pastel: 0.7,
  },

  pastel: {
    white: 0.9,
    neutral: 0.8,
    bright: 0.7,
    black: 0.6,
  },
};

function getColorScore(colorA, colorB) {
  if (!colorA || !colorB) return 0;

  return COLOR_COMPATIBILITY[colorA]?.[colorB] || 0.5;
}

module.exports = {
  getColorScore,
};
