# Simple Serato DJ / Scratch Library Parser

This simple serato DJ Library Parser supports typescript and helps parsing serato history files. Serato history files are saved in a very simple format. They consist of a DOM-like structure, where every node begins with a four byte id, the four byte length and afterwards following the content of the node. The content is a array of nodes, a 4 byte integer or a unicode string.

## Usage

Install it via

```console
npm install seratolibraryparser
```

It offers several functions

```javascript
import { getDefaultITunesLibraryPath, getDefaultSeratoPath, getITunesSongs, getSeratoHistory, getSeratoSongs } from "./index";

async function read() { // ES6 function to read in all history files of a user
    const path = getDefaultSeratoPath() // gets default serato path 

    const databaseSongs = await getSeratoSongs(path + 'database V2') // Gets array of songs
    console.log(databaseSongs) // Displays whole data tree parsed out of serato files

    const wholeHistory = await getSeratoHistory(path) // Reads in all songs ever played
    console.log(wholeHistory) // Prints them

    const iTunesLibraray = await getITunesSongs(getDefaultITunesLibraryPath()) // Reads in all songs ever played
    console.log(iTunesLibraray) // Prints them
}

read()
```

## Documentation

[https://tobiasjacob.github.io/seratolibraryparser/index.html](https://tobiasjacob.github.io/seratolibraryparser/index.html)

## Development

Feel free to contribute to this package. Clone this repository, run `npm install` and `npm run demo` to get started. Don't forget to adjust the `path` variable.

## Dom structure of serato files

`history.database` is the main file of serato history data

- `vrsn` (8 + 60): String containing the version
- `ocol` (8 + 24):
  - `ocok` (8 + 2): Maybe something with sorting?
  - `ucow` (8 + 2): Maybe col width?
- `oses` (8 + ?):
  - `adat` (8 + ?):
    - `\u0000\u0000\u0000\u0001` (8 + 4): id of the associated session file
    - `\u0000\u0000\u0000)` (8 + 18): date of playlist as string
    - `\u0000\u0000\u00009` (8 + ?): hardware used as string
    - ...

`Sessions/*.session` stores session data of songs played after each other

- `vrsn` (8 + 60): String containing the version
- `oent` (8 + ?):
  - `adat` (8 + ?):
    - `\u0000\u0000\u0000\u0006` (8 + ?): Title field of mp3
    - `\u0000\u0000\u0000\u0007` (8 + ?): Artist field of mp3
    - `\u0000\u0000\u0000\t` (8 + ?): Genre field of mp3
    - `\u0000\u0000\u0000\u0017` (8 + ?): Year field of mp3
    - `\u0000\u0000\u0000\u0003` (8 + ?): Key
    - `\u0000\u0000\u0000\b` (8 + ?): Album
    - `\u0000\u0000\u0000\u0002` (8 + ?): File Path
    - `\u0000\u0000\u00005` (8 + 4): Timestamp when the song was played (seconds since 1970, UInt32)
    - `\u0000\u0000\u0000-`(8 + 4): The duration of the time where the song was playing (in seconds, UInt32)
    - ...
