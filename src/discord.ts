import {Discord} from "@typeit/discord";
import * as Path from "path";

@Discord("!", {
    import: [
        Path.join(__dirname,  "commands", "*.ts"),
        Path.join(__dirname,  "events", "*.ts")
        // You can also specify the class directly here if you don't want to use a glob
    ]
})
abstract class AppDiscord {

}