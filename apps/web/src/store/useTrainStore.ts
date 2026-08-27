import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Train } from '@railyatra/types';

interface TrainState {
  favorites: Train[];
  recentSearches: Train[];
  addFavorite: (train: Train) => void;
  removeFavorite: (trainId: string) => void;
  isFavorite: (trainId: string) => boolean;
  addRecentSearch: (train: Train) => void;
  clearRecentSearches: () => void;
}

export const useTrainStore = create<TrainState>()(
  persist(
    (set, get) => ({
      favorites: [],
      recentSearches: [],
      addFavorite: (train) =>
        set((state) => {
          if (state.favorites.some((t) => t.id === train.id)) return state;
          return { favorites: [train, ...state.favorites] };
        }),
      removeFavorite: (trainId) =>
        set((state) => ({
          favorites: state.favorites.filter((t) => t.id !== trainId)
        })),
      isFavorite: (trainId) => get().favorites.some((t) => t.id === trainId),
      addRecentSearch: (train) =>
        set((state) => {
          const filtered = state.recentSearches.filter((t) => t.id !== train.id);
          return { recentSearches: [train, ...filtered].slice(0, 5) };
        }),
      clearRecentSearches: () => set({ recentSearches: [] })
    }),
    {
      name: 'railyatra-storage'
    }
  )
);
