import { ReadWriteBuffer } from "nekogirl-valhalla/buffer/ReadWriteBuffer";

export interface BufferData {
  geometry: ReadWriteBuffer,
  index: ReadWriteBuffer
};