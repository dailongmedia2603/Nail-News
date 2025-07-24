const SEARCH_QUERY_KEY = 'nailnews_search_query';
const ACTIVE_CATEGORY_KEY = 'nailnews_active_category';
const FILTERS_KEY = 'nailnews_filters';

type Filters = {
  stateId: number | null;
  cityId: number | null;
  tagIds: number[];
};

// Search Query
export const saveSearchQuery = (query: string) => {
  localStorage.setItem(SEARCH_QUERY_KEY, query);
};

export const loadSearchQuery = (): string => {
  return localStorage.getItem(SEARCH_QUERY_KEY) || '';
};

// Active Category
export const saveActiveCategory = (category: string) => {
  localStorage.setItem(ACTIVE_CATEGORY_KEY, category);
};

export const loadActiveCategory = (): string => {
  return localStorage.getItem(ACTIVE_CATEGORY_KEY) || 'Tất cả';
};

// Filters
export const saveFilters = (filters: Filters) => {
  localStorage.setItem(FILTERS_KEY, JSON.stringify(filters));
};

export const loadFilters = (): Filters => {
  const saved = localStorage.getItem(FILTERS_KEY);
  return saved ? JSON.parse(saved) : { stateId: null, cityId: null, tagIds: [] };
};

export const clearFilters = () => {
  localStorage.removeItem(FILTERS_KEY);
};