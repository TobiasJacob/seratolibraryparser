# Simple Serato DJ / Scratch Library Parser
This simple serato DJ Library Parser is dependency free, supports typescript and helps parsing serato history files. Serato history files are saved in a very simple format. They consist of a DOM-like structure, where every node begins with a four byte id, the four byte length and afterwards following the content of the node. The content is a array of nodes, a 4 byte integer or a unicode string.

## Usage
Install it via

```
npm install seratolibraryparser
```

Then adjust path and use it like

```javascript
import {getDomTree, getSessions, getSessionSongs} from 'seratolibraryparser'

const path = '/Users/tobiasjacob/Music/_Serato_/History/' // Adjust this path 

async function read() { // ES6 function to read in all history files of a user
    const completeDomTree = await getDomTree(path + 'history.database') // Parses a whole dom tree, just for demo purposes, if you want to analyze other tags
    console.log(completeDomTree) // Displays whole data tree parsed out of serato files

    const sessions = await getSessions(path + 'history.database') // Generates a dict with a key for each session file

    for (const key in sessions) { // Iterates over sessions
        if (sessions.hasOwnProperty(key)) {
            const session = sessions[key]; // Get file name of session
            const songlist = await getSessionSongs(path + 'Sessions/' + session + '.session') // Get an array of all songs in this file
            console.log(songlist) // Print
        }
    }
}

read()
```

## Development
Git: [https://github.com/TobiasJacob/seratolibraryparser](https://github.com/TobiasJacob/seratolibraryparser)

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
        - ...
