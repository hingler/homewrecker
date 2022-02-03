export interface RoofPolyData {
  longMinus: Array<number>,
  longPlus: Array<number>,
  shortEnd: Array<number> | null,
  shortStart: Array<number> | null
}

export interface RoofPolyTexData extends RoofPolyData {
  scale: number;
}