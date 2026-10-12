export type Category = 'geography' | 'entertainment' | 'history' | 'science' | 'sports' | 'arts';

export interface CategoryInfo {
  id: Category;
  name: string;
  color: string;
}

export interface BoardCell {
  id: number;
  category: Category;
  x: number;
  y: number;
  isSpoke?: boolean;
}

export interface Player {
  id: number;
  name: string;
  color: string;
  position: number;
  wedges: Category[];
}