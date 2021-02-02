import { Client } from "@typeit/discord";
import * as util from "util";
import * as fs from "fs";
import * as path from "path";

const readFile = util.promisify(fs.readFile);

const TOKEN_FILE = path.join(path.dirname('..'), 'token.txt');

async function start() {
    // Read the database URI
    const token = (await readFile(TOKEN_FILE, 'utf-8')).trim()

    const client = new Client({
        classes: [
            `${__dirname}/*discord.ts`, // glob string to load the classes
            `${__dirname}/../dist/*discord.js` // If you compile using "tsc" the file extension change to .js
        ],
        silent: false,
        variablesChar: ":"
    });

    await client.login(token);
    console.log("Connected!")
}

start();
