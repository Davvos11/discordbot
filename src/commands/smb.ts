import {Command, CommandMessage} from "@typeit/discord";
import {smbMount, unmount} from "../backend/smb";
import {DMChannel, NewsChannel, TextChannel} from "discord.js";

const MOVIE = '🎞️'
const SERIES = '📺'
const COMBINING = '⃣'

export abstract class Smb {
    private mounts: string[] = []

    @Command("smb")
    private async smb(command: CommandMessage) {
        // Get URL (we cant use command arguments since the url can include spaces)
        const url = command.content.replace(command.args[0] , '').trim()

        // Ask the type of the content
        const type = await getType(command.channel)
        // Ask the name of the content
        const name = await getName(command.channel, url)

        try {
            // Try to mount
            const location = await smbMount(url, type, name)
            // Save the mounted location
            this.mounts.push(location)
        } catch (e) {
            return command.channel.send(`Error \`\`\`\n${e}\`\`\``)
        }
        return command.channel.send(`Mounted! It should now become visible on https://plex.dovatvis.nl`)
    }

    @Command("list")
    private async list(command: CommandMessage) {
        // Create list of mounts
        let list = "List of mounts:"
        this.mounts.forEach(((value, index) => {
            list += `\n${index}: ${value}`
        }))
        // Send to channel
        return command.channel.send(list)
    }

    @Command("rm :index")
    private async rm(command: CommandMessage) {
        const index = command.args.index
        if (typeof index !== "number" && index in this.mounts) {
            return command.channel.send("Please provide a number from !list")
        }

        try {
            await unmount(this.mounts[index])
        } catch (e) {
            return command.channel.send(`Error \`\`\`\n${e}\`\`\``)
        }
        return command.channel.send("Unmounted!")
    }
}

async function getType(channel: TextChannel | DMChannel | NewsChannel) {
    // Ask question
    const message = await channel.send(`Is this a movie (${MOVIE}) or a tv-series (${SERIES})?`)
    const collector = message.createReactionCollector((r) => {return [MOVIE, SERIES].includes(r.emoji.name)})

    // Add reactions
    await Promise.all([
        message.react(MOVIE),
        message.react(SERIES)
    ])

    // Wait until the user adds a reaction
    const reaction = await collector.next
    collector.stop()

    switch (reaction.emoji.name) {
        case MOVIE:
            return 'movies'
        case SERIES:
            return 'tv'
        default:
            // Haha recursion go brrr
            return getType(channel)
    }
}

async function getName(channel: TextChannel | DMChannel | NewsChannel, url: string) {
    // Get names:
    let names = "";
    const folders = url.replace(/^[^\/]*\/\//, '').split('/')
    folders.slice(1).forEach(((value, index) => {
        names += `\n${index}: ${value}`
    }))

    const emoji = folders.slice(1).map((value, index) => {return `${index}${COMBINING}`})

    // Ask question
    const message = await channel.send(`What is the name? ${names}`)
    const collector = message.createReactionCollector((r) => emoji.includes(r.emoji.name))

    // Add reactions
    await Promise.all(
        emoji.map((value => message.react(value)))
    )

    // Wait until the user adds a reaction
    const reaction = await collector.next
    console.log(reaction.emoji.name)
    collector.stop()

    const i = Number(reaction.emoji.name.substring(0, 1)) + 1
    let name = `${folders[i]} [${folders.slice(0, i)}]`
    folders.slice(i+1).forEach((value => {name += `/${value}`}))

    return name
}