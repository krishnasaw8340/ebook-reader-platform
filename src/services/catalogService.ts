import api from './api';

export interface CatalogLanguage {
  id: string;
  name: string;
  code: string;
}

export interface CatalogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
}

export interface CatalogGenre {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
}

export interface CatalogTag {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
}

export interface CatalogMetadata {
  languages: CatalogLanguage[];
  categories: CatalogCategory[];
  genres: CatalogGenre[];
  tags: CatalogTag[];
}

export const catalogService = {
  getMetadata: async (): Promise<CatalogMetadata> => {
    const res = await api.get<CatalogMetadata>('/catalog/metadata');
    return res.data;
  },
  getLanguages: async (): Promise<CatalogLanguage[]> => {
    const res = await api.get<CatalogLanguage[]>('/catalog/languages');
    return res.data;
  },
  getCategories: async (): Promise<CatalogCategory[]> => {
    const res = await api.get<CatalogCategory[]>('/catalog/categories');
    return res.data;
  },
  getGenres: async (): Promise<CatalogGenre[]> => {
    const res = await api.get<CatalogGenre[]>('/catalog/genres');
    return res.data;
  },
  getTags: async (): Promise<CatalogTag[]> => {
    const res = await api.get<CatalogTag[]>('/catalog/tags');
    return res.data;
  },
};

export default catalogService;
