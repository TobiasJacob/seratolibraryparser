import { getDomTree, getSessions, getSessionSongs } from "./index";

const path = "/Users/tobiasjacob/Music/_Serato_/History/";
async function read() {
  console.log(await getDomTree(path + "history.database"));
  const sessions = await getSessions(path + "history.database");

  for (const key in sessions) {
    if (sessions.hasOwnProperty(key)) {
      const element = sessions[key];
      const session = sessions[key];
      console.log(
        await getSessionSongs(path + "Sessions/" + session + ".session")
      );
    }
  }
}

read();
