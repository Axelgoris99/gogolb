---
title: Homelab Evolution
date: 2026-06-01
excerpt: How my homelab started, how it grew and where I want to take it next.
image: /images/image7.png
tags: [homelab, self-host]
---

## Starting small

You can just run an app as exe on windows and have it run on your current pc. That works. Go on, check it out.

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
