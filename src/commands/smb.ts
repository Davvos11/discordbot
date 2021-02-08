import {Command, CommandMessage} from "@typeit/discord";
import {smbMount} from "../backend/smb";

// Do not have to decorate the class with @Discord
// It applied the parameters of the @Discord decorator that imported it
export abstract class Smb {
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