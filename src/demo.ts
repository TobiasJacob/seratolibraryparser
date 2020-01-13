import { getDomTree, getSessions, getSessionSongs } from "./index";

const path = '/Users/tobiasjacob/Music/_Serato_/History/' // adjust this path 

async function read() { // ES6 function to read in all history files of a user
    const completeDomTree = await getDomTree(path + 'history.database')
    console.log(completeDomTree) // Displays whole data tree parsed out of serato files

    const sessions = await getSessions(path + 'history.database') // Generates a dict with a key for each session file

    for (const key in sessions) { // Iterates of sessions
        if (sessions.hasOwnProperty(key)) {
            const session = sessions[key]; // Get file name of session
            const songlist = await getSessionSongs(path + 'Sessions/' + session + '.session') // Get a array of all songs in this file
            console.log(songlist) // Print
        }
    }
}

read()