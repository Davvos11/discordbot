import {exec} from "child_process";
import * as fs from "fs";
import * as path from "path";

const MOUNT_PATH = '/home/david/mnt/smb'

export async function smbMount(url: string, type?: string) {
    if (type !== 'movie') {
        type = 'tv'
    }

    url = url.replace(/^smb:/, '')

    const name = url.replace(/\/\//, '')
    const location = `${MOUNT_PATH}/${type}/${name}`

    // Create a folder at the location of the mount
    await createMountPoint(location)

    // Try to mount
    const child = exec(`mount -t cifs -o username=anonymous,password= "${url}" "${location}"`)

    // Pipe stderr to a variable, so we can return some error information if needed
    let stderr = ''
    child.stderr.on('data', data => stderr += data)

    // Return a promise that handles errors and returning
    return new Promise<number>(((resolve, reject) => {
        child.on('error', (err => {
            // Remove created mount point
            removeMountPoint(location)
            // Throw error
            reject(err.message)
        }))
        child.on('exit', code => {
            if (code === 0)
                // Return successfully
                resolve(code)
            else
                // Remove created mount point
                removeMountPoint(location)
                // Throw error
                reject(stderr)
        })
    }))
}

async function createMountPoint(location) {
    if (!fs.existsSync(location)) {
        await fs.mkdir(location, {recursive: true}, (err => {
            if (err)
                throw err
        }))
    }
}

async function removeMountPoint(location) {
    if (fs.existsSync(location)) {
        await removeEmptyDirectories(location)
    }
}

/**
 * Colonised from https://gist.github.com/fixpunkt/fe32afe14fbab99d9feb4e8da7268445
 * @param directory
 */
async function removeEmptyDirectories(directory: string) {
    // lstat does not follow symlinks (in contrast to stat)
    const fileStats = await fs.promises.lstat(directory);
    if (!fileStats.isDirectory()) {
        return;
    }
    const fileNames = await fs.promises.readdir(directory);

    if (fileNames.length === 0) {
        console.log('Removing: ', directory);
        await fs.promises.rmdir(directory);
    }

    // Go up a directory (if needed)
    const parent = path.dirname(directory)
    if (!path.relative(parent, MOUNT_PATH).includes('..'))
        await removeEmptyDirectories(path.dirname(directory))
}