const BASE_LIVES = 2;

import bolt from "@slack/bolt";
import wordsListPath from "word-list";
const words = (await import("fs")).readFileSync(wordsListPath, 'utf8').split('\n');

const app = new bolt.App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
});

const games = new Map<string, Game>();

type Game = {
  /**
   * Array of players
   */
  players: {
    /**
     * The Slack ID of the player
     */
    id: string;
    /**
     * The number of lives the player has left
     */
    lives: number;
  }[];
  /**
   * If the game has started or not
   */
  started: boolean;
  /**
   * Words that have been already used in the game
   */
  usedWords: (typeof words[number])[];
  /**
   * The index of the current player
   */
  currentPlayer: number;
  /**
   * Data about the initial message
   */
  initMessage: {
    channel_id: string,
    ts: string,
    creator_name: string,
    creator_id: string
  }
}
// Command handling

// Command handling

app.command("/wb-create-game", async ({ command, client, ack }) => {
  await ack();
  if (games.has(command.channel_id)) {
    await client.chat.postEphemeral({
      channel: command.channel_id,
      user: command.user_id,
      text: "Sorry, a game is already running in this channel. Run /wb-end-game to end it."
    });
    return;
  } else {
    const gameMessage = await client.chat.postMessage({
      channel: command.channel_id,
      text: `${command.user_name} started a game!`,
      blocks: [
        {
          type: "rich_text",
          elements: [{
            type: "rich_text_section",
            elements: [{
              type: "user",
              user_id: command.user_id
            }, {
              type: "text",
              text: " started a game!"
            }]
          }]
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: "*Players:*"
            }
          ]
        },
        {
          type: "actions",
          "elements": [
            {
              type: "button",
              "text": {
                type: "plain_text",
                "text": "Join"
              },
              "style": "primary",
              "value": "join_game"
            },
            {
              type: "button",
              "text": {
                type: "plain_text",
                "emoji": true,
                "text": "Start"
              },
              "value": "start_game"
            }
          ]
        }
      ]
    });
    if (!gameMessage.ok) throw Error("Game message couldn't be sent")
    if (!gameMessage.ts) throw Error("Game message doesn't have a timestamp")
    games.set(command.channel_id, {
      players: [
        {
          id: command.user_id,
          lives: BASE_LIVES
        }
      ],
      started: false,
      currentPlayer: 0,
      usedWords: [],
      initMessage: {
        channel_id: command.channel_id,
        ts: gameMessage.ts,
        creator_id: command.user_id,
        creator_name: command.user_name
      }
    });
  }
});

app.action('join_game', async ({ ack, body, client }) => {
  if(body.channel?.id === undefined) throw Error("Button doesn't have a channel");
  if(body.user?.id === undefined) throw Error("Button doesn't have a user");
  const game = games.get(body.channel.id);
  await ack();
  if(!game) {
    await client.chat.postEphemeral({
      channel: body.channel.id,
      user: body.user.id,
      text: "Couldn't find the game!"
    });
    return;
  }
  if(game.players.find((x) => x.id === body.user.id)) {
    await client.chat.postEphemeral({
      channel: body.channel.id,
      user: body.user.id,
      text: "You have already joined this game!"
    });
    return;
  }
  game.players.push({
    id: body.user.id,
    lives: BASE_LIVES
  });
  client.chat.update({
    channel: game.initMessage.channel_id,
    ts: game.initMessage.ts,
      text: `${game.initMessage.creator_name} started a game!`,
      blocks: [
        {
          type: "rich_text",
          elements: [{
            type: "rich_text_section",
            elements: [{
              type: "user",
              user_id: game.initMessage.creator_id
            }, {
              type: "text",
              text: " started a game!"
            }]
          }]
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: "*Players:*"
            },
            {
              type: "mrkdwn",
              text: game.players.map((player) => `<@${player.id}>`).join(", ")
            }
          ]
        },
        {
          type: "actions",
          "elements": [
            {
              type: "button",
              "text": {
                type: "plain_text",
                "text": "Join"
              },
              "style": "primary",
              "value": "join_game"
            },
            {
              type: "button",
              "text": {
                type: "plain_text",
                "emoji": true,
                "text": "Start"
              },
              "value": "start_game"
            }
          ]
        }
      ]
  })
});


await app.start();
