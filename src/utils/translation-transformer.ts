// This helper function transforms the flat array from Supabase 
// into the nested object structure that i18next expects.
export const transformTranslations = (data: { key: string; vi: string | null; en: string | null }[]) => {
  const resources: any = {
    en: { translation: {} },
    vi: { translation: {} },
  };

  data.forEach(({ key, en, vi }) => {
    const keys = key.split('.');
    let enObj = resources.en.translation;
    let viObj = resources.vi.translation;

    keys.forEach((k, index) => {
      if (index === keys.length - 1) {
        enObj[k] = en || '';
        viObj[k] = vi || '';
      } else {
        if (!enObj[k]) enObj[k] = {};
        if (!viObj[k]) viObj[k] = {};
        enObj = enObj[k];
        viObj = viObj[k];
      }
    });
  });

  return resources;
};