import sqlite3 from "sqlite3"
import {Database, open} from 'sqlite'
import path from "path";
import util from "util";
import fs from "fs";

sqlite3.verbose();

// Database location
const DB_LOCATION = path.join(path.dirname('..'), 'database.db')
const SQL_SCRIPT_LOCATION = path.join(path.dirname('..'), 'create-tables.sql')

const readFile = util.promisify(fs.readFile);

export class DbConnection {
    private db: Database | undefined;
    private dbLocation: string;

    constructor(location: string = DB_LOCATION) {
        this.dbLocation = location
    }

    private static async openDb() {
        return open({
            filename: DB_LOCATION,
            driver: sqlite3.Database
        })
    }

    private async createTables() {
        const db = await this.getDb()
        // Read create-tables.sql and execute it
        return db.exec(await readFile(SQL_SCRIPT_LOCATION, 'utf8'))
    }

    /**
     * Get the db object, or connect to it and (if needed) create tables if it is undefined
     */
    async getDb() {
        if (this.db === undefined) {
            // Connect to database
            this.db = await DbConnection.openDb()
            // Create tables
            await this.createTables()
        }
        return this.db
    }

    async addGarbageChannel(id: string) {
        const db = await this.getDb()
        return db.run("INSERT INTO garbage_channels VALUES (?)",
            id)
    }

    async getGarbageChannels() {
        const db = await this.getDb()
        const query = db.all("SELECT id FROM garbage_channels")

        return query.then(result => {
            return result.map(r => r.id)})
    }
}