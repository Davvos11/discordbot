import {Command, CommandMessage} from "@typeit/discord";
import {smbMount} from "../backend/smb";
import {DMChannel, NewsChannel, TextChannel} from "discord.js";

const MOVIE = '🎞️'
const SERIES = '📺'

export abstract class Smb {
    @Command("smb")
    private async smb(command: CommandMessage){
        // Get URL (we cant use command arguments since the url can include spaces)
        const url = command.content.replace(`${command.prefix}${command.commandName}` , '').trim()

        // Ask the type of the content
        const type = await getType(command.channel)

        try {
            await smbMount(url, type)
        } catch (e) {
            return  command.channel.send(`Error \`${e}\``)
        }
        return command.channel.send(`Mounted! It should now become visible on https://plex.dovatvis.nl`)
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