const config = require("./config.json");

const Discord = require("discord.js");
const client = new Discord.Client();

var fs = require('fs');
var markov = require('markov');

var m = markov();
console.log(__dirname + config.markov_file);
var s = fs.createReadStream(__dirname + "/" + config.markov_file);

console.log("[ + ] Starting...")
m.seed(s, function () {
  console.log("[ + ] ... Markov seeded");
  client.login(config.token);
  console.log("[ + ] Starting... DONE");
});

function is_trusted(message){
  if(config.admins.includes(message.author.id)) return true;
  if(!message.member.roles.some(r=>["Administrator", "Moderator", "CREW"].includes(r.name)) )
    return false;
  return true;
}

function announce(text, tts){
  if(tts){
    client.channels.get(config.announcement_channel).send("@everyone " + text, {tts:true});
  }
  else{
    client.channels.get(config.announcement_channel).send("@everyone " + text);  
  }
  
}

function reply_channel_chat(message){
  //message.channel.send("You called?");
  var reply = "";
  t = message.content;
  t2 = t.replace(/\<\@[^>]*\>/g,'');
  t=t2;
  reply = m.respond(t).join(' ');
  message.reply(reply);
}

function append_log(message){
  fs.appendFile('allmessages.txt', message.content + "\n", function (err) {
  if (err) throw err;
  });
}

client.on("ready", () => {
  // This event will run if the bot starts, and logs in, successfully.
  console.log(`Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`); 
  // Example of changing the bot's playing game to something useful. `client.user` is what the
  // docs refer to as the "ClientUser".
  client.user.setGame(`on ${client.guilds.size} servers`);
});

client.on("guildCreate", guild => {
  // This event triggers when the bot joins a guild.
  console.log(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`);
  client.user.setGame(`on ${client.guilds.size} servers`);
});

client.on("guildDelete", guild => {
  // this event triggers when the bot is removed from a guild.
  console.log(`I have been removed from: ${guild.name} (id: ${guild.id})`);
  client.user.setGame(`on ${client.guilds.size} servers`);
});


client.on("message", async message => {
  // It's good practice to ignore other bots.
  if(message.author.bot) return;
  append_log(message);
  
  var r = message.content.indexOf("<@"+config.me+">");
  if( r != -1){
    console.log("[ + ] Replying to hilight")
    reply_channel_chat(message);
  }
  
  // Also good practice to ignore any message that does not start with our prefix, 
  if(message.content.indexOf(config.prefix) !== 0) return;
  //console.log("Got " + message.content);
  
  // Here we separate our "command" name, and our "arguments" for the command. 
  // e.g. if we have the message "+say Is this the real life?" , we'll get the following:
  // command = say
  // args = ["Is", "this", "the", "real", "life?"]
  const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();
  
  if(command === "help") {
    console.log("[ + ] Serving command help");
    message.author.sendMessage(config.help_message);
  }
  if(command === "info") {
    console.log("[ + ] Serving command info");
    message.author.sendMessage(config.info_message);
  }
  if(command === "crew") {
    console.log("[ + ] Serving command crew");
    message.author.sendMessage(config.crew_message);
  }

  // ----------------------------------
  // All below here require admin privs
  if(!is_trusted(message)) return;

  if(command === "admin") {
    console.log("[ + ] Serving command admin");
    message.author.sendMessage(config.admin_message);
  }

  if(command === "subway") {
    console.log("[ + ] Serving command subway");
    if(args.length < 1){
      message.reply("What about Subway?");
    }
    else{
      if(args[0] == "open"){
        announce(config.subway_open,false);
      }
      else if(args[0] == "30m"){
        announce(config.subway_30m,false);
      }
      else if(args[0] == "arrive"){
        if(config.subway_tts == true){
          announce(config.subway_arrive, true);
        }
        else{
          announce(config.subway_arrive, false);
        }
      }
      else{
        message.reply("Subway can use: open, 30m, or arrive.");
      }
    }
  }

  if(command === "ping") {
    console.log("[ + ] Serving command ping");

    const m = await message.channel.send("Ping?");
    m.edit(`Pong! Latency is ${m.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(client.ping)}ms`);
  }
  
  if(command === "say") {
    console.log("[ + ] Serving command say");
    // makes the bot say something and delete the message. As an example, it's open to anyone to use. 
    // To get the "message" itself we join the `args` back into a string with spaces: 
    const sayMessage = args.join(" ");
    // Then we delete the command message (sneaky, right?). The catch just ignores the error with a cute smiley thing.
    message.delete().catch(O_o=>{}); 
    // And we get the bot to say the thing: 
    message.channel.send(sayMessage);
  }
  
});

//client.login(config.token);
           