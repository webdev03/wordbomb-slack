import bolt from '@slack/bolt';
const app = new bolt.App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    socketMode: true,
    appToken: process.env.SLACK_APP_TOKEN,
});

app.message('hello', async ({ message, say }) => {
    if(message.subtype === undefined) await say(`Hello <@${message.user}>!`);
});

await app.start();
