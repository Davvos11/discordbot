import { Client } from "@typeit/discord";
import * as util from "util";
import * as fs from "fs";
import * as path from "path";
import cron from "cron"
import {garbageNotifications} from "./commands/garbage";

const readFile = util.promisify(fs.readFile);

const TOKEN_FILE = path.join(path.dirname('..'), 'token.txt');

async function start() {
    // Read the database URI
    const token = (await readFile(TOKEN_FILE, 'utf-8')).trim()

    // Load commands
    const client = new Client({
        classes: [
            `${__dirname}/*discord.ts`, // glob string to load the classes
            `${__dirname}/../dist/*discord.js` // If you compile using "tsc" the file extension change to .js
        ],
        silent: false,
        variablesChar: ":"
    });

    // Connect to Discord
    await client.login(token);
    console.log("Connected!")

    // Start notification cron-jobs
    new cron.CronJob("0 20 * * *", () => {
        garbageNotifications(client)
    }).start()
}

start();
