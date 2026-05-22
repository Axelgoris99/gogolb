---
title: Homelab Evolution
date: 2026-06-01
excerpt: How my homelab started, how it grew and where I want to take it next.
image: /images/image7.png
tags: [homelab, self-host]
---

## Starting small

You can just run an app as exe on windows and have it run on your current pc. That works. Go on, check it out, something like Plex takes 5 minutes to setup. If you are unsure, try it. You're not going to break anything, I promise. On linux, even simpler, you can install it from most major package manager. 

Once the application is running, try to connect to it from the same device. Most of these apps work by simply opening a port and making some content accessible. So if I run plex on windows, it will probably tell me to go to localhost:port and boum, you can access it. That's your very first self hosted app, congrats!
From there, you can try to access it from another device in the network. Grab the ip adress of the device running the application (ipconfig on windows, ip -a on linux, check the ipv4, that's what is mostly used currently). Once that's done, on another device on the same network (same wifi for now), try to access http://ip:port in a browser. Congrats! You just accessed your new service from another device.

From now on, everything is going to work roughly like that. One way or another, it starts with an app opens a port and you get access to said ip and port. We'll see later how to make accessing said Ip and port nicer, but even with that, it still relies on that foundation. We just add "mappings" on top, saying "hey, goris.live points to 192.168.1.12 and when 192.168.1.12 receives a request with goris.live as the name, it redirects to 192.168.48.95:8061".

## Independant material

Then you can move that to a dedicated pc. Then you can start having multiple ones. And then you have to move them. So you realize that docker was the right way all along.

## Distant access

Then you go on holiday. You want to be able to access all your series or movies, so you look into how to do that. You go down the rabbit hole, going from vpn to opening port (no, dont do that), realizing that you need a dynamic dns, thinking that you already have a VPS with a domain name and might as well use that. so you slap ddns-updater to have an ip always pointing at your wireguard vpn ip. and boum, on holiday with all your favorites services!

## Industrialization

Then you acquire another pc. And you realize, "Hey, would it not be cool to be rid of google photo and have unlimited storage? But I'd need backup..." so you slap proxmox on one pc, on a second one, put them in a cluster. 
Then you start browsing helper script page and you install a whole lot of stuff you don't need just because you can.
With that much stuff, you realize that ProxMox interface is not really cool to have a quick glance. So you start looking into monitoring tools and end up with Pulse. 
Then you start having too many things. So you look into a homepage to centralize all of them.
And so on and so forth...

I present to you, your new best friend:
https://community-scripts.org/
