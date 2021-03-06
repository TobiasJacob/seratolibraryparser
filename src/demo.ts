import { getDefaultITunesLibraryPath, getDefaultSeratoPath, getITunesSongs, getSeratoHistory, getSeratoSongs } from "./index";

async function read() { // ES6 function to read in all history files of a user
    const path = getDefaultSeratoPath() // gets default serato path 

    const databaseSongs = await getSeratoSongs(path + 'database V2') // Gets array of songs
    console.log(databaseSongs) // Displays whole data tree parsed out of serato files

    const wholeHistory = await getSeratoHistory(path) // Reads in all songs ever played
    console.log(wholeHistory[0]) // Prints them

    const iTunesLibraray = await getITunesSongs(getDefaultITunesLibraryPath()) // Reads in all songs ever played
    console.log(iTunesLibraray) // Prints them

    // iTunesLibraray.forEach((s) => {
    //     if (s.title.toLowerCase().includes("inf")) console.log(s)
    // })
}

read()