---
title: Homelab Evolution
date: 2026-07-17
excerpt: How my homelab started, how it grew and where I want to take it next.
image: /images/homelab-infra.png
imageAlt: "Diagram of my homelab today: a cloud VPS for websites and apps, a home lab with two Proxmox servers (media, photos, smart home) and a remote site with game servers, linked to each other and to my devices by WireGuard."
tags: [homelab, self-host]
---

## Starting small

You can just run an app as exe on windows and have it run on your current pc. That works. Go on, check it out, something like Plex takes 5 minutes to setup. If you are unsure, try it. You're not going to break anything, I promise. On linux, even simpler, you can install it from most major package manager. 

Once the application is running, try to connect to it from the same device. Most of these apps work by simply opening a port and making some content accessible. So if I run plex on windows, it will probably tell me to go to localhost:port and boum, you can access it. That's your very first self hosted app, congrats!
From there, you can try to access it from another device in the network. Grab the ip adress of the device running the application (ipconfig on windows, ip -a on linux, check the ipv4, that's what is mostly used currently). Once that's done, on another device on the same network (same wifi for now), try to access http://ip:port in a browser. Congrats! You just accessed your new service from another device.

From now on, everything is going to work roughly like that. One way or another, it starts with an app opens a port and you get access to said ip and port. We'll see later how to make accessing said Ip and port nicer, but even with that, it still relies on that foundation. We just add "mappings" on top, saying "hey, goris.live points to 192.168.1.12 and when 192.168.1.12 receives a request with goris.live as the name, it redirects to 192.168.48.95:8061".

Alright, on said PC, you can run as many services as you like, as long as they have different ports. Say you want to watch your media content using Plex and also have a service to store your cherished photos like Immich. You just have to start the Plex Server and the Immich Server, let's say on port 8081 and 8082 and you will be able to access them at localhost:8081 and localhost:8082. That's the basic idea.

## Independant material

That's cool and all but obviously we are now using our computer and if we turn it down, we'll lose the access to our servers. It is now time to move all of that stuff to a dedicated pc. At this stage, mostly anything will do for testing but if you start getting serious about photo storing or such, I'd recommend checking the specs. Each of the service you want will consume a little bit of power and you need to figure out if you need all of the services at the same time, all the time and such. Power is another interesting part because we'll be letting a PC run 24/7 so that will impact your electricity bill. Tho, a PC is just a useful heater.

Then you can start having multiple ones. And then you have to move them. And that's when the pain hits reaaaaaally hard. You have to redo all of your config, find all of your exe or service again, restart, replan all of it. And to help with that, you realize that docker (or LXC) was the right way all along.

## Distant access

Then you go on holiday. You want to be able to access all your series or movies, so you look into how to do that. You go down the rabbit hole, going from vpn to opening port (no, dont do that), realizing that you need a dynamic dns, thinking that you already have a VPS with a domain name and might as well use that. So you slap ddns-updater to have an ip always pointing at your wireguard vpn ip. And boum, on holiday with all your favorites services!

Okay, I might have skipped a few steps here. Recommendation: go simple. All you need is wireguard, that's a simple server/client that will allow all of the traffic from one of your device to go through the other device so much so that it looks like you are on the other network. That's a VPN in a nutshell.

## Industrialization

Then you acquire another pc. And you realize: "Wait a second, I cannot keep on doing stuff manually..."
That's when you should look into solutions like Proxmox which allows you to manage a bunch of PC and start multiple VMs or LinuxContainer on the same pc.
Then you start browsing helper script page and you install a whole lot of stuff you don't need just because you can.
With that much stuff, you realize that Proxmox interface is not really cool to have a quick glance. So you start looking into monitoring tools and end up with stuff like Pulse. 
Then you start having too many things. So you look into a homepage to centralize all of them.
And so on and so forth...Welcome to the self-hosting journey my friend!

I present to you, your new best friend:
https://community-scripts.org/


Axel