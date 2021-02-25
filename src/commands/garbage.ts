import {Client, Command, CommandMessage} from "@typeit/discord";
import {garbageData, getPickups} from "../backend/garbage";
import {MessageEmbed, TextChannel} from "discord.js";
import dateFormat from "dateformat";
import {DbConnection} from "../database";

const db = new DbConnection()

export abstract class Garbage {
    @Command("afval")
    private async garbage(command: CommandMessage) {
        // Get garbage dates for the next four weeks
        const d = new Date()
        d.setDate(d.getDate() + 28)
        const pickups = await getPickups(new Date(), d)

        // Convert to a nice embed and send it
        const embed = formatData(pickups)
        await command.channel.send(embed)
    }

    @Command("afvalsubscribe")
    private async subscribe(command: CommandMessage) {
        // Save the channel ID to the database
        await db.addGarbageChannel(command.channel.id)
        // Send a return message
        await command.channel.send("This channel will now receive garbage pickup updates")
    }
}

function formatData(data: garbageData[]) {
    return new MessageEmbed()
        .setTitle("Afvalkalender")
        .setURL("https://www.twentemilieu.nl/enschede/afval/afvalkalender")
        .addFields(data.map((value) => {
            return {name: colourToTitle(value.type, true),
                value: `**${dateFormat(value.date, "ddd dd-mm-yy")}**\n${value.description}`}
        }))
}

function colourToTitle(colour: string, emoji = false) {
    switch (colour) {
        case "GREY":
            return `${emoji ? ":white_large_square: " : ""}Restafval`;
        case "GREEN":
            return `${emoji ? ":green_square: " : ""}GFT`;
        case "PAPER":
            return `${emoji ? ":blue_square: " : ""}Papier`;
        case "PACKAGES":
            return `${emoji ? ":orange_square: " : ""}Verpakkingen`;
        case "TREE":
            return `${emoji ? ":christmas_tree: " : ""}Kerstbomen`;
        default:
            return `${emoji ? ":grey_question: " : ""}${colour}`;
    }
}

export async function garbageNotifications(client: Client) {
    // Fetch pickups for today and tomorrow
    const d = new Date()
    d.setDate(d.getDate() + 1)
    const pickups = await getPickups(new Date(), d)

    // Check if there are any pickups
    if (pickups.length === 0) {
        return
    }

    const message = `${pickups.map(v => colourToTitle(v.type)).join(', ')} aan de weg zetten!`

    // Get channels that want notifications
    const channels = await db.getGarbageChannels()
    channels.forEach((id) => {
        // Get channel object
        const channel = client.channels.cache.get(id)
        if (channel.isText()) {
            (channel as TextChannel).send(message)
        }
    })
}