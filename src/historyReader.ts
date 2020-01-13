import * as fs from 'fs';

type ChunkDataType = string | Chunk | Chunk[] | number;

class Chunk {
  public data?: ChunkDataType;
  public length: number = 0;
  public tag: string;

  public constructor(length: number, tag: string, data?: ChunkDataType) {
    this.length = length;
    this.tag = tag;
    this.data = data;
  }
}

function getUInt32FromString(s: string) {
  return (s.charCodeAt(0) << 24) + (s.charCodeAt(1) << 16) + (s.charCodeAt(2) << 8) + s.charCodeAt(3);
}

function getStringFromUInt32(n: number) {
  return String.fromCharCode(Math.floor(n / (1 << 24)) % 256) + String.fromCharCode(Math.floor(n / (1 << 16)) % 256) + String.fromCharCode(Math.floor(n / (1 << 8)) % 256) + String.fromCharCode(Math.floor(n) % 256);
}

async function parseChunk(buffer: Buffer, index: number): Promise<{ chunk: Chunk, newIndex: number }> {
  const tag = getStringFromUInt32(buffer.readUInt32BE(index));
  const length = buffer.readUInt32BE(index + 4);
  let data;
  switch (tag) {
    case 'vrsn':
      data = buffer.toString('utf8', index + 8, index + 8 + length).replace(/\0/g, '');
      break;
    case 'oses':
      const { chunk, newIndex } = await parseChunk(buffer, index + 8);
      data = chunk
      break;
    case 'adat':
      data = await parseChunkArray(buffer, index + 8, index + 8 + length);
      break;
    default:
      if (length === 4) {
        data = buffer.readUInt32BE(index + 8);
      } else {
        data = buffer.toString('utf8', index + 8, index + 8 + length).replace(/\0/g, '');
      }
      break;
  }
  return {
    chunk: new Chunk(length, tag, data),
    newIndex: index + length + 8
  }
}

async function parseChunkArray(buffer: Buffer, start: number, end: number): Promise<Chunk[]> {
  const chunks = []
  let cursor = start
  while (cursor < end) {
    const { chunk, newIndex } = await parseChunk(buffer, cursor)
    cursor = newIndex
    chunks.push(chunk)
  }
  return chunks
}

async function main(): Promise<void> {
  const buffer = await fs.promises.readFile('/Users/tobiasjacob/Music/_Serato_/History/history.database');

  if (buffer.readUInt32BE(0) !== getUInt32FromString('vrsn')) {
    console.error('Buffer vrsn Tag not at Byte 0');
  }

  const chunks = await parseChunkArray(buffer, 0, buffer.length);
  console.log(chunks[10].data)

  chunks.forEach(chunk => {
    if (chunk.tag === 'oses') {
      if (chunk.data instanceof Chunk) {
        if (chunk.data.tag === 'adat') {
          if (Array.isArray(chunk.data.data)) {
            let date;
            let index;
            chunk.data.data.forEach((subChunk) => {
              if (subChunk.tag === '\u0000\u0000\u0000\u0001') {
                index = subChunk.data;
              }
              if (subChunk.tag === '\u0000\u0000\u0000)') {
                date = subChunk.data;
              }
            })
            console.log(date, index);
          }
        }
      }
    }
  });
}

main();
