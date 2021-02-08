import {ArgsOf, Client, Command, CommandMessage, Discord, On} from "@typeit/discord";
import {smbMount} from "./backend/smb";

@Discord("!")
abstract class AppDiscord {
    @Command("smb")
    private async smb(command: CommandMessage){
        const url = command.content.replace(`${command.prefix}${command.commandName}` , '').trim()

        try {
            await smbMount(url)
        } catch (e) {
            return  command.channel.send(`Error \`${e}\``)
        }
        return command.channel.send(`Mounted \`${url}\``)
    }
}