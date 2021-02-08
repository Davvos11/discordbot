import {exec} from "child_process";
import * as fs from "fs";

const MOUNT_PATH = '/mnt'

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
        await fs.rmdir(location, (err => {
            if (err)
                throw err
        }))
    }
    //TODO remove empty parents recursively
}
