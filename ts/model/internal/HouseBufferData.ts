import { ReadWriteBuffer } from "nekogirl-valhalla/buffer/ReadWriteBuffer";

export class HouseBufferData {
  geometry: ReadWriteBuffer;
  index: ReadWriteBuffer;
  
  // old offsets
  start: number;
  startIndex: number;

  // new offsets
  offset: number;
  indexOffset: number;

  // number of vertices
  vertices: number;

  // number of indices
  indices: number;



  readonly POSITION_OFFSET = 0;
  readonly POSITION_COMPONENTS = 3;

  readonly NORMAL_OFFSET = 12;
  readonly NORMAL_COMPONENTS = 3;

  readonly TEXCOORD_OFFSET = 24;
  readonly TEXCOORD_COMPONENTS = 2;
  
  readonly TANGENT_OFFSET = 32;
  readonly TANGENT_COMPONENTS = 3;

  readonly BYTE_STRIDE = 44;
};