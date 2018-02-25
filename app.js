var config = require("./config.json");

const Discord = require("discord.js");
const client = new Discord.Client();

const https = require('https');

var fs = require('fs');
var markov = require('markov');

var m = markov(4);
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

function do_request(options,callback){
  https.get(options, (resp) => {
  let data = '';

  // A chunk of data has been recieved.
  resp.on('data', (chunk) => {
    data += chunk;
  });

  // The whole response has been received. Print out the result.
  resp.on('end', () => {
    //console.log(data);
    callback(data);
  });

  }).on("error", (err) => {
    console.log("Error: " + err.message);
  });
}

function do_joke(message){
  var options = {
      hostname: 'icanhazdadjoke.com',
      port: 443,
      path: '/',
      method: 'GET',
      headers: {
        'content-type': 'text/plain',
        'accept': 'text/plain',
        'user-agent': 'mbot',
        'connection': 'close',
      }
    }

    do_request(options, function(r){
      message.channel.send(r);
    });
}

function do_yesno(message){
  //https://yesno.wtf/api/
  //{"answer":"yes","forced":false,"image":"https://yesno.wtf/assets/yes/12-e4f57c8f172c51fdd983c2837349f853.gif"}
  var options = {
      hostname: 'yesno.wtf',
      port: 443,
      path: '/api/',
      method: 'GET',
      headers: {
        'content-type': 'text/plain',
        'accept': 'text/plain',
        'user-agent': 'mbot',
        'connection': 'close',
      }
    }

    do_request(options, function(r){
      var j = JSON.parse(r);
      message.channel.send(j.image);
    });
}

function get_text_no_tags(message){
  t = message.content;
  return t.replace(/\<\@[^>]*\>/g,'');
}

function get_random_int(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

function talkative(message){
  var roll = get_random_int(config.talk_rate);
  if(roll === 0){
    roll = roll = get_random_int(config.talk_reply_rate);
    if(roll === 0){
      message.reply( m.respond( get_text_no_tags(message) ).join(' ') );
    }
    else{
      message.channel.send( m.respond( get_text_no_tags(message) ).join(' ') );
    }
  }
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
  if(message.content.indexOf(config.prefix) !== 0){
    if(config.talk){
      talkative(message);
    }
    return;
  }
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
  else if(command === "info") {
    console.log("[ + ] Serving command info");
    message.author.sendMessage(config.info_message);
  }
  else if(command === "crew") {
    console.log("[ + ] Serving command crew");
    message.author.sendMessage(config.crew_message);
  }

  else if(command === "joke"){
    console.log("[ + ] Serving command joke");
    do_joke(message);
  }
  else if (command === "?"){
    console.log("[ + ] Serving command yesno");
    do_yesno(message);
  }

  // ----------------------------------
  // All below here require admin privs
  else if(!is_trusted(message)) return;

  else if(command === "talk") {
    console.log("[ + ] Serving command talk");
    if(args.length < 1){
      if(config.talk){
        config.talk = false;
        message.reply("setting `talk` to false.");
      }
      else{
        config.talk = true;
        message.reply("setting `talk` to true.");
      }
    }
    else{
      l = parseInt(args[0]);
      message.channel.send( m.respond(m.pick(),l).join(' ') );
    }
  }

  else if(command === "admin") {
    console.log("[ + ] Serving command admin");
    message.author.sendMessage(config.admin_message);
  }

  else if(command === "subway") {
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

  else if(command === "ping") {
    console.log("[ + ] Serving command ping");

    const mm = await message.channel.send("Ping?");
    mm.edit(`Pong! Latency is ${m.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(client.ping)}ms`);
  }
  
  else if(command === "say") {
    console.log("[ + ] Serving command say");
    // makes the bot say something and delete the message. As an example, it's open to anyone to use. 
    // To get the "message" itself we join the `args` back into a string with spaces: 
    const sayMessage = args.join(" ");
    // Then we delete the command message (sneaky, right?). The catch just ignores the error with a cute smiley thing.
    message.delete().catch(O_o=>{}); 
    // And we get the bot to say the thing: 
    message.channel.send(sayMessage);
  }

  else {
    message.author.sendMessage("Unknown command :(.");
  }
  
});

//client.login(config.token);
           