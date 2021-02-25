import {Command, CommandMessage} from "@typeit/discord";
import {garbageData, getPickups} from "../backend/garbage";
import {MessageEmbed} from "discord.js";
import dateFormat from "dateformat";

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
}

function formatData(data: [garbageData]) {
    return new MessageEmbed()
        .setTitle("Afvalkalender")
        .setURL("https://www.twentemilieu.nl/enschede/afval/afvalkalender")
        .addFields(data.map((value) => {
            return {name: colourToTitle(value.type), value: `**${dateFormat(value.date, "ddd dd-mm-yy")}**\n${value.description}`}
        }))
}

function colourToTitle(colour: string) {
    switch (colour) {
        case "GREY":
            return ":white_large_square: Restafval";
        case "GREEN":
            return ":green_square: GFT";
        case "PAPER":
            return ":blue_square: Papier";
        case "PACKAGES":
            return ":orange_square: Verpakkingen";
        case "TREE":
            return ":christmas_tree: Kerstbomen"
        default:
            return ":grey_question: " + colour
    }
}