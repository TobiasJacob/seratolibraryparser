import * as fs from "fs";

type ChunkDataType = string | Chunk | Chunk[] | number;

/**
 * Datastructure for saving Dom Objects
 */
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

/**
 * Converts a 4 byte string into a integer
 * @param s 4 byte string to be converted
 */
export function getUInt32FromString(s: string) {
  return (
    (s.charCodeAt(0) << 24) +
    (s.charCodeAt(1) << 16) +
    (s.charCodeAt(2) << 8) +
    s.charCodeAt(3)
  );
}

/**
 * Converts a 4 byte integer into a string
 * @param n 4 byte integer
 */
export function getStringFromUInt32(n: number) {
  return (
    String.fromCharCode(Math.floor(n / (1 << 24)) % 256) +
    String.fromCharCode(Math.floor(n / (1 << 16)) % 256) +
    String.fromCharCode(Math.floor(n / (1 << 8)) % 256) +
    String.fromCharCode(Math.floor(n) % 256)
  );
}

/**
 * Returns a single buffer and fills in data tag recursivly
 * @param buffer A node.js fs buffer to read from
 * @param index index of first byte
 * @returns Promise with {chunk, newIndex} object for destructured assignment. New Index is the index of the following chunk
 */
async function parseChunk(
  buffer: Buffer,
  index: number
): Promise<{ chunk: Chunk; newIndex: number }> {
  const tag = getStringFromUInt32(buffer.readUInt32BE(index));
  const length = buffer.readUInt32BE(index + 4);
  let data;
  switch (tag) {
    case "vrsn": // Version tag
      data = buffer
        .toString("utf8", index + 8, index + 8 + length)
        .replace(/\0/g, "");
      break;
    case "oses": // Structure containing a adat session object
      const { chunk: chunkOses } = await parseChunk(buffer, index + 8);
      data = chunkOses;
      break;
    case "oent": // Structure containing a adat song object
      const { chunk: chunkOent } = await parseChunk(buffer, index + 8);
      data = chunkOent;
      break;
    case "adat": // Strcuture containg an array of chunks
      data = await parseChunkArray(buffer, index + 8, index + 8 + length);
      break;
    default:
      if (length === 4) {
        // Assume it's a integer if it has length 4
        data = buffer.readUInt32BE(index + 8);
      } else {
        // Otherwise assume a string
        data = buffer
          .toString("utf8", index + 8, index + 8 + length)
          .replace(/\0/g, "");
      }
      break;
  }
  return {
    chunk: new Chunk(length, tag, data),
    newIndex: index + length + 8
  };
}

/**
 * Reads in a ongoing list of serato chunks till the maximum length is reached
 * @param buffer A node.js fs buffer to read from
 * @param start Index of the first byte of the chunk
 * @param end Maximum length of the array data
 * @returns Array of chunks read in
 */
async function parseChunkArray(
  buffer: Buffer,
  start: number,
  end: number
): Promise<Chunk[]> {
  const chunks = [];
  let cursor = start;
  while (cursor < end) {
    const { chunk, newIndex } = await parseChunk(buffer, cursor);
    cursor = newIndex;
    chunks.push(chunk);
  }
  return chunks;
}

/**
 * Returns the raw domtree of a serato file
 * @param path The path to the file that shoud be parsed
 * @returns Nested object dom
 */
export async function getDomTree(path: string): Promise<Chunk[]> {
  const buffer = await fs.promises.readFile(path);
  const chunks = await parseChunkArray(buffer, 0, buffer.length);

  return chunks;
}

/**
 * Reads in a history.databases file
 * @param path Path to the history.database file
 * @returns A dictonary with the number of the session file for every date
 */
export async function getSessions(
  path: string
): Promise<{ [Key: string]: number }> {
  const buffer = await fs.promises.readFile(path);
  const chunks = await parseChunkArray(buffer, 0, buffer.length);

  const sessions: { [Key: string]: number } = {};
  chunks.forEach(chunk => {
    if (chunk.tag === "oses") {
      if (chunk.data instanceof Chunk) {
        if (chunk.data.tag === "adat") {
          if (Array.isArray(chunk.data.data)) {
            let date = "";
            let index = -1;
            chunk.data.data.forEach(subChunk => {
              if (subChunk.tag === "\u0000\u0000\u0000\u0001") {
                index = subChunk.data as number;
              }
              if (subChunk.tag === "\u0000\u0000\u0000)") {
                date = subChunk.data as string;
              }
            });
            sessions[date] = index;
          }
        }
      }
    }
  });
  return sessions;
}

/**
 * Reads in a serato session file.
 * @param path Path to *.session file
 * @returns An array containing title and artist for every song played
 */
export async function getSessionSongs(
  path: string
): Promise<Array<{ title: string; artist: string }>> {
  const buffer = await fs.promises.readFile(path);
  const chunks = await parseChunkArray(buffer, 0, buffer.length);

  const songs: Array<{ title: string; artist: string }> = [];

  chunks.forEach(chunk => {
    if (chunk.tag === "oent") {
      if (chunk.data instanceof Chunk) {
        if (chunk.data.tag === "adat") {
          if (Array.isArray(chunk.data.data)) {
            let title = "";
            let artist = "";
            chunk.data.data.forEach(subChunk => {
              if (subChunk.tag === "\u0000\u0000\u0000\u0006") {
                title = subChunk.data as string;
              }
              if (subChunk.tag === "\u0000\u0000\u0000\u0007") {
                artist = subChunk.data as string;
              }
            });
            songs.push({ title, artist });
          }
        }
      }
    }
  });
  return songs;
}

// getSessionSongs('/Users/tobiasjacob/Music/_Serato_/History/Sessions/12.session'); // for testing

// getSessions('/Users/tobiasjacob/Music/_Serato_/History/history.database'); // for testing
