export const DISCIPLINES_FULL = [
  "Architecture",
  "Interior Design",
  "Interior Decor",
  "Event Design",
  "Civil Engineering",
  "Fine Art",
  "Craft",
  "Sculpture",
  "Photography",
  "Landscape Design",
  "Fashion Design",
  "Tailoring",
  "Makeup Artistry",
  "Aesthetics",
  "Hair Styling",
] as const;

export const ALL_DISCIPLINES = ["All", ...DISCIPLINES_FULL] as const;

import {
  LayoutGrid,
  Building2,
  Sofa,
  Lamp,
  PartyPopper,
  HardHat,
  Palette,
  Scissors,
  Shapes,
  Camera,
  Trees,
  Shirt,
  Ruler,
  Brush,
  Sparkles,
  Wand2,
} from "lucide-react";

export type discipletype = typeof ALL_DISCIPLINES[number]


export const DISCIPLINE_ICONS = {
  All: LayoutGrid,
  Architecture: Building2,
  "Interior Design": Sofa,
  "Interior Decor": Lamp,
  "Event Design": PartyPopper,
  "Civil Engineering": HardHat,
  "Fine Art": Palette,
  Craft: Scissors,
  Sculpture: Shapes,
  Photography: Camera,
  "Landscape Design": Trees,
  "Fashion Design": Shirt,
  Tailoring: Ruler,
  "Makeup Artistry": Brush,
  Aesthetics: Sparkles,
  "Hair Styling": Wand2,
};

export const ACCOUNT_TYPE_DISCIPLINES: Record<string, discipletype[]> = {
  architect: ['Architecture'],
  designer: ['Interior Design', 'Interior Decor', 'Event Design', 'Landscape Design', 'Fashion Design'],
  builder: ['Architecture', 'Civil Engineering'],
  photographer: ['Photography'],
  engineer: ['Civil Engineering'],
  artist: ['Fine Art', 'Craft', 'Sculpture', 'Makeup Artistry', 'Aesthetics'],
  studio: [],
};