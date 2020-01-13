# Simple Serato DJ / Scratch Library Parser
This simple serato DJ Library Parser is dependency free, supports typescript and helps parsing serato history files. Serato history files are saved in a very simple format. They consist of a DOM-like structure, where every node begins with a four byte id, the four byte length and afterwards following the content of the node. The content is a array of nodes, a 4 byte integer or a unicode string.

## Dom structure
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
