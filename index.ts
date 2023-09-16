let uuid = ""

Bun.serve({
  port: 3000,
  fetch(req, server) {
    const myURL = new URL(req.url);
    if(!/favicon/.test(myURL.pathname)) {
      uuid = myURL.pathname
    }
    return new Response(Bun.file("./index.html"));
  },
});

const messages: any = [];
let users: any = [];

Bun.serve({
  port: 4000,
  fetch(req, server) {
    const success = server.upgrade(req, {
      data: { username: "user_" + Math.random().toString(16).slice(12) },
    });

    return success
      ? undefined
      : new Response("Upgrade failed :(", { status: 500 });
  },
  websocket: {
    open(ws) {
      console.log(uuid)
      ws.subscribe("chat" + uuid);
    },
    message(ws, data) {
      const message = JSON.parse(data);
      message.username = ws.data.username;
      messages.push(message);

      ws.publish(
        `chat${uuid}`,
        JSON.stringify({ type: "MESSAGES_ADD", data: message })
      );
    },
    close(ws) {
      users = users.filter((username: any) => username !== ws.data.username);

      // Send message to all clients subscribed to the chat channel that user left
      ws.publish(
        "chat"+ uuid,
        JSON.stringify({ type: "USERS_REMOVE", data: ws.data.username })
      );
    },
  },
});