// a tailwind config that slips in exactly one new color the brand never had
module.exports = {
  theme: {
    extend: {
      colors: { ground: '#fbfbfa', ink: '#1a1a1a', fresh: '#abcdef' },
      borderRadius: { DEFAULT: '8px' },
      boxShadow: { card: '0 1px 2px rgba(0, 0, 0, 0.08)' },
      fontFamily: { sans: ['Inter', 'sans-serif'] },
    },
  },
};
