export const slugify = (text: string): string => {
  return text
    .toString()
    .normalize('NFD') // split an accented letter into the base letter and the accent
    .replace(/[\u0300-\u036f]/g, '') // remove all previously split accents
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // replace spaces with -
    .replace(/[^\w-]+/g, '') // remove all non-word chars
    .replace(/--+/g, '-'); // replace multiple - with single -
};

export const formatMesorregion = (mesorregion: string): string => {
  // Converte NORTE_MATOGROSSENSE para "Norte Mato-grossense"
  const parts = mesorregion.split('_');
  return parts.map((part, index) => {
    if (index === 0) {
      // Primeira palavra: primeira letra maiúscula
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    } else {
      // Segunda palavra: primeira letra maiúscula, "G" maiúscula em "Mato-Grossense"
      const lower = part.toLowerCase();
      if (lower === 'matogrossense') {
        return 'Mato-grossense';
      }
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    }
  }).join(' ');
};
