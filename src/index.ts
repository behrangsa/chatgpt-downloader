import { saveAllConversationDetails } from "./conversations";
import { program } from "commander";

program
  .requiredOption(
    "-o, --output <path>",
    "output file path",
    "conversations.json"
  )
  .requiredOption("-a, --authorizaton <value>", "authorization header value")
  .requiredOption("-c, --cookie <value>", "cookie header value");

program.parse(process.argv);

const options = program.opts();

const outputPath = options.output;
const authorization = options.authorizaton;
const cookie = options.cookie;

saveAllConversationDetails(outputPath, {
  Authorization: authorization,
  Cookie: cookie,
})
  .then((conversations) => {
    console.log(conversations);
  })
  .catch((err) => {
    console.error(JSON.stringify(err, null, 2));
  })
  .finally(() => {
    console.info("Done.");
  });
