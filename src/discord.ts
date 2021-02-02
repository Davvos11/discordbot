import {ArgsOf, Client, Discord, On} from "@typeit/discord";

@Discord()
abstract class AppDiscord {
    @On("message")
    private onMessage([message]: ArgsOf<"message">, client: Client, guardPayload: any) {
        console.log(message)
    }
}