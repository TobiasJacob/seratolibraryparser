import * as fs from "fs";
import * as path from "path";
import * as os from "os";

type ChunkDataType = string | Chunk[] | number;

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
 * Interface for song data in sessions
 */
export interface SessionSong {
  title: string,
  artist: string
}

/**
 * Interface for song data in library
 */
export interface DatabaseSong {
  title: string,
  artist: string,
  bpm: number | undefined,
  key: string | undefined
}

/**
 * Interface for session data
 */
export interface Session {
  date: string,
  songs: SessionSong[]
}

/**
 * Converts a 4 byte string into a integer
 * @param {string} s 4 byte string to be converted
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
 * @param {number} n 4 byte integer
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
 * @param {Buffer} buffer A node.js fs buffer to read from
 * @param {number} index index of first byte
 * @returns {Promise} Promise with object for destructured assignment. New Index is the index of the following chunk
 */
async function parseChunk(
  buffer: Buffer,
  index: number
): Promise<{ chunk: Chunk; newIndex: number }> {
  const tag = getStringFromUInt32(buffer.readUInt32BE(index));
  const length = buffer.readUInt32BE(index + 4);
  let data;
  switch (tag) {
    case "oses": // Structure containing a adat session object
    case "oent": // Structure containing a adat song object
    case "otrk": // Structure containing a ttyp song object
    case "adat": // Strcuture containg an array of chunks
      data = await parseChunkArray(buffer, index + 8, index + 8 + length);
      break;
    case "\u0000\u0000\u0000\u0001":
      data = buffer.readUInt32BE(index + 8);
      break;
    default:
      data = buffer
        .toString("utf8", index + 8, index + 8 + length)
        .replace(/\0/g, "");
      break;
  }
  return {
    chunk: new Chunk(length, tag, data),
    newIndex: index + length + 8
  };
}

/**
 * Reads in a ongoing list of serato chunks till the maximum length is reached
 * @param {Buffer} buffer A node.js fs buffer to read from
 * @param {number} start Index of the first byte of the chunk
 * @param {number} end Maximum length of the array data
 * @returns {Promise} Array of chunks read in
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
 * @param {string} path The path to the file that shoud be parsed
 * @returns {Promise<Chunk[]>} Nested object dom
 */
export async function getDomTree(path: string): Promise<Chunk[]> {
  const buffer = await fs.promises.readFile(path);
  const chunks = await parseChunkArray(buffer, 0, buffer.length);

  return chunks;
}

/**
 * Reads in a history.databases file
 * @param {string} path Path to the history.database file
 * @returns {Promise} A dictonary with the number of the session file for every date
 */
export async function getSessions(
  path: string
): Promise<{ [Key: string]: number }> {
  const buffer = await fs.promises.readFile(path);
  const chunks = await parseChunkArray(buffer, 0, buffer.length);

  const sessions: { [Key: string]: number } = {};
  chunks.forEach(chunk => {
    if (chunk.tag === "oses") {
      if (Array.isArray(chunk.data)) {
        if (chunk.data[0].tag === "adat") {
          if (Array.isArray(chunk.data[0].data)) {
            let date = "";
            let index = -1;
            chunk.data[0].data.forEach(subChunk => {
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
 * @param {string} path Path to *.session file
 * @returns {Promise} An array containing title and artist for every song played
 */
export async function getSessionSongs(
  path: string
): Promise<SessionSong[]> {
  const buffer = await fs.promises.readFile(path);
  const chunks = await parseChunkArray(buffer, 0, buffer.length);

  const songs: SessionSong[] = [];

  chunks.forEach(chunk => {
    if (chunk.tag === "oent") {
      if (Array.isArray(chunk.data)) {
        if (chunk.data[0].tag === "adat") {
          if (Array.isArray(chunk.data[0].data)) {
            let title = "";
            let artist = "";
            chunk.data[0].data.forEach(subChunk => {
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

/**
 * Gets all songs of the database v2 serato file
 * @param {string} path path to database v2 serato file
 */
export async function getSeratoSongs(path: string) {
  const buffer = await fs.promises.readFile(path);
  const chunks = await parseChunkArray(buffer, 0, buffer.length);

  const songs: DatabaseSong[] = [];

  chunks.forEach(chunk => {
    if (chunk.tag === "otrk") {
      if (Array.isArray(chunk.data)) {
        let title = "";
        let artist = "";
        let bpm;
        let key;
        chunk.data.forEach(subChunk => {
          if (subChunk.tag === "tsng") {
            title = subChunk.data as string;
          }
          if (subChunk.tag === "tart") {
            artist = subChunk.data as string;
          }
          if (subChunk.tag === "tbpm") {
            bpm = subChunk.data as string;
          }
          if (subChunk.tag === "tkey") {
            key = subChunk.data as string;
          }
        });
        songs.push({ title, artist, bpm, key });
      }

    }
  });

  return songs;
}

/**
 * Reads all sessions and played songs from the _Serato_ folder
 * @param {string} seratoPath path to _Serato_ folder (including _Serato_)
 * @returns {Promise} list of sessions including songs
 */
export async function getSeratoHistory(seratoPath: string): Promise<Session[]> {
  const sessions = await getSessions(path.join(seratoPath, 'History/history.database'))
  const result: Session[] = []

  for (const key in sessions) {
    if (sessions.hasOwnProperty(key)) {
      const session = sessions[key];
      const songlist = await getSessionSongs(path.join(seratoPath, 'History/Sessions/', session + '.session'))
      result.push({ date: key, songs: songlist })
    }
  }
  return result;
}

/**
 * Returns the default path to the _serato_ folder of the user
 * @returns {string} path to _serato_ folder
 */
export function getDefaultSeratoPath(): string {
  return path.join(os.homedir(), 'Music/_Serato_/');
}

// getSessionSongs('/Users/tobiasjacob/Music/_Serato_/History/Sessions/12.session'); // for testing

// getSessions('/Users/tobiasjacob/Music/_Serato_/History/history.database'); // for testing
