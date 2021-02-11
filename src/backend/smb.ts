import {exec} from "child_process";
import * as fs from "fs";
import * as path from "path";

const MOUNT_PATH = '/mnt'

export async function smbMount(url: string, type: string, name: string, triedResolving = false) {
    if (triedResolving) {
        console.log(`Trying ${url}`)
    }

    url = url.replace(/^smb:/, '')

    // If it seems to be a file instead of a dir, use the parent
    if (url.match(/\.\S{2,3}$/)) {
        url = url.replace(/\/[^\/]+$/, '')
    }

    // const name = url.replace(/\/\//, '')
    const location = `${MOUNT_PATH}/${type}/${name}`

    // Create a folder at the location of the mount
    await createMountPoint(location)

    // Try to mount
    const child = exec(`mount -t cifs -o username=anonymous,password= "${url}" "${location}"`)

    // Pipe stderr to a variable, so we can return some error information if needed
    let stderr = ''
    child.stderr.on('data', data => stderr += data)

    // Return a promise that handles errors and returning
    return new Promise<string>(((resolve, reject) => {
        child.on('error', (err => {
            console.error(err.message)
            // Remove created mount point
            removeMountPoint(location)
            // Throw error
            reject(err.message)
        }))
        child.on('exit', code => {
            if (code === 0) {
                console.log(`Mounted: ${location}`)
                // Return the mount path
                return resolve(location)
            } else {
                console.error(stderr)
                // Check the error type
                if (stderr.includes(" could not resolve address for ") && !triedResolving) {
                    // Try again with a resolved URL (recursion go brr)
                    resolve(smbMount(resolveCampusNet(url), type, name,true))
                } else {
                    // Remove created mount point
                    removeMountPoint(location)
                    // Throw error
                    reject(stderr)
                }
            }
        })
    }))
}

async function createMountPoint(location: string) {
    if (!fs.existsSync(location)) {
        console.log(`Creating ${location}`)
        return  fs.promises.mkdir(location, {recursive: true})
    }
}

async function removeMountPoint(location) {
    if (fs.existsSync(location)) {
        await removeEmptyDirectories(location)
    }
}

export async function unmount(location) {
    // Try to unmount
    const child = exec(`umount "${location}"`)

    // Pipe stderr to a variable, so we can return some error information if needed
    let stderr = ''
    child.stderr.on('data', data => stderr += data)

    // Return a promise that handles errors and returning
    return new Promise<void>(((resolve, reject) => {
        child.on('error', (err => {
            console.error(err.message)
            // Throw error
            reject(err.message)
        }))
        child.on('exit', code => {
            if (code === 0) {
                console.log(`Unmounted: "${location}"`)
                // Remove path
                removeMountPoint(location)
                // Return
                return resolve()
            } else {
                console.error(stderr)
                // Throw error
                reject(stderr)
            }
        })
    }))
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
    if (!path.relative(MOUNT_PATH, parent).includes('..') && parent !== MOUNT_PATH)
        await removeEmptyDirectories(path.dirname(directory))
}


function resolveCampusNet(url: string) {
    return url.replace(/\/\/([^\/]+)/, "//$1.student.utwente.nl")
}