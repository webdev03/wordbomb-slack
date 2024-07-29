import bolt from "@slack/bolt";
const app = new bolt.App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
});

const games = new Map<string, Game>();

type Game = {
  /**
   * Array of players' Slack IDs
   */
  players: string[];
}

// Command handling

app.command("/wb-create-game", async ({ command, ack, respond, say }) => {
  await ack();
  await respond("Hi!");
})

await app.start();
