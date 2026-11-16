---
title: "I tried to make a tiny local AI request my movies"
date: 2026-11-16
excerpt: I wanted to type "I want Dune" in a chat and find it on Jellyfin a bit later. Fully local, on a homelab CPU. It worked great in my tests... Then I used it.
tags: [homelab, self-host, llm, ollama, open-webui]
---

## The idea

I have a whole media setup at home (well, at my parents' place). Basically, when I want a movie, I go to Seerr (Overseerr's new name), search for it, click request, and Radarr or Sonarr take care of the rest until it shows up on Jellyfin. It works great. But I thought: wouldn't it be cool to just type "I want Dune" in a chat and boum, done?

And since I'm a self-hosting lover, it had to run fully locally. No OpenAI, no cloud, nothing leaves the house!

I already had Open WebUI and Ollama in a container on my second Proxmox (the HP mini PC, the fun one with the game servers). So all I needed was a small model that could talk to Seerr. How hard can it be?...

## Where to run it?

Two options:

- The GTX 1060 in my media server, already busy with the Jellyfin transcoding. But it's the 3 GB version. A 2B model would fit next to the transcoder, a 4B one wouldn't. (+ NVIDIA [RIP JENSEN] is slowly dropping these old Pascal cards anyway).
- The CPU of the HP mini PC. An i5-8500 with 6 cores and 32 GB of RAM. No GPU, but plenty of room.

I also had a look at these new "decision models" like Jev (and Jeff, its open source replica). They are tiny and super fast, but they only pick an answer from a list you give them. Cool to decide "is this a movie or a series?", useless to understand "the Dune by Villeneuve". So no.

CPU it is, with Qwen3 4B.

## Why was it so slow?

I had tried Open WebUI on that machine a few days before and gave up because it took forever to answer anything. Turns out, there were two problems.

First, the model was thinking. The `qwen3:4b` tag on Ollama now points to the "Thinking" version of Qwen3, which writes a whole hidden reasoning before every answer. And you can't turn it off. One of my test messages had been thinking for 911 tokens when it died after 26 minutes... Easy fix: use the instruct version instead (`qwen3:4b-instruct-2507-q4_K_M`)!

Second, I should have thought about: the threads were fighting with my Terraria server. Ollama uses one thread per core, so 6. But my modded Terraria server (tModLoader) keeps one core at 100%, all the time. And llama.cpp (what Ollama runs underneath) splits each step across all its threads and waits for all of them to finish. So if one thread is stuck sharing a core with Terraria, everybody waits for it!

I benchmarked it, same model, same prompt:

| Threads | Reading the prompt | Writing the answer |
| ----------- | --------- | ---------- |
| 6 (default) | 9 tok/s | 0.6 tok/s |
| 4 | 29 tok/s | 9.3 tok/s |
| 3 | 27 tok/s | 9.4 tok/s |

... I ended up on 2 threads (6.4 tok/s) to keep some room for more game servers. You set that per model, with `PARAMETER num_thread 2` in a Modelfile.

Btw, Open WebUI uses the same model to generate chat titles, tags and follow-up suggestions. On a CPU, each of these is a full extra request waiting in line behind your actual message. Turn them off in the admin settings (Interface tab)!
  
## The tool

Open WebUI lets you write "tools" in Python. It's just a class, and each method becomes a function the model can call. I gave it three, and only three:

- `search_media`: search in Seerr
- `request_media`: request a movie or a series
- `request_status`: what's happening

No delete, no approve. Small models get confused when you give them too many tools, and I really didn't want it anywhere near deleting stuff.

Fun fact about Seerr: if you call its API with just the API key, it acts as the admin, and admin requests are auto-approved. You have to add an `X-API-User` header with a user ID to act as someone else. So the tool matched whoever was logged into the chat with their Seerr account, and refused to do anything otherwise. I didn't want my family to skip my approval just by asking the bot nicely haha!

## "I want Odyssey"

First real test. The bot answered in French (my instructions were in French), so here it is translated:

> **Me:** I want Odyssey
>
> **Bot:** The results are: The Odyssey (2026), Doctor Odyssey (2024), The Odyssey (1997). Which one?
>
> **Me:** film 2026
>
> **Bot:** There are three: one about Odysseus going home, one about Alexander accused of treason, one based on the Greek epic. Which story do you want?
>
> **Me:** celui de Nolan *(the Nolan one)*
>
> **Bot:** No Nolan film is associated with The Odyssey in the results.

Okay, to be honest, the bot was right. My search results only had the title, the year and a summary. No director anywhere. And yes, TMDB really lists three movies called The Odyssey in 2026: Nolan’s, a mockbuster from The Asylum released the same month (of course), and a tiny one with a single vote.

So I moved the brain into the tool instead of the model:

- each result now comes with its director (or creator for a series) and two actors
- the junk results with almost no votes on TMDB are removed
- if one result is way more popular than all the others (4 times more), it's marked "MOST LIKELY". Nolan's Odyssey: popularity 481. The next one: 23.
- you can filter by year or by person, so "the Nolan one" becomes a search for Odyssey with Nolan
- and each tool answer ends with a "Next:" line telling the model what to do and in which language to answer

That last one was the magic trick. Small models follow whatever text comes right before their answer way better than their instructions. I replayed eight conversations and all eight worked: "I want Odyssey", "The Odyssey (2026), directed by Christopher Nolan? (yes/no)", "yes", requested. Beautiful! (In the tests, the requests were stopped right before reaching Seerr, so nothing was actually requested.)

Also, during the tests, one answer got stuck in a loop and wrote 1,700 tokens for 6 minutes before I killed it. On a CPU, that's a core gone until it stops :(
    
So I capped the answers at 300 tokens.

## Then I tried to use it

> **Me:** Je voudrais le film Dune *(I'd like the movie Dune)*
>
> **Bot:** 1. Dune (2021) 2. Dune: Part Two (2024) 3. Dune (1984). Which one? *(translated again)*
>
> **Me:** 1 et 2 *(1 and 2)*

And here is the answer, untouched:

```
Les deux films Dune (2021) et Dune: Part Two (2024) sont des films récents de Denis Villeneuve.
Je vais les ajouter à la liste pour téléchargement.
Next: ask which one to pick (1 or 2), then call request_media with the correct tmdb_id.
Reply in French.
Do not pick one yourself.
Do not list all results again.
Do not ask for clarification.
Do not say "I don't know".
Only ask which one (1 or 2) to pick.
Only if the user answers with a number, call request_media.
If the user answers with a year or director, pick from the list and call request_media.
Only pick one film at a time.
Only if the user answers with a number, call request_media.
Only if the user answers with a number, call request_media.
Only if the user answers with a number, call request_media.
Only if the user answers with a number, call request_media.
Only if the user answers with a number, call request_media.
Only if the user answers
```

All my tests picked one movie. I asked for two. The model had no idea what to do with that, so it did what small models do when they're lost: it continued whatever text it had in front of it. And what it had in front of it was my "Next:" line. So it started writing its own instructions, then repeated the same line over and over until it hit the 300 tokens limit. It didn't even call the tool.

So my magic trick is exactly what broke it. Greeeeeeeeeeeat.

The next morning, I removed everything. Thankfully, I had taken a Proxmox snapshot of the container before starting, so it was one `pct rollback` and it was like nothing happened. Then I deleted the container altogether. Fuck it.

## So, what did I learn?

Quite a lot actually:

- Check what your model tag really is. `qwen3:4b` is not the model it was a few months ago.
- If your CPU is shared with something else, set the number of threads yourself.
- On a CPU, turn off Open WebUI's titles, tags and suggestions.
- Always cap the length of the answers.
- Give the tool the data instead of hoping the model guesses. The directors fixed more than any prompt did.
- Testing with messages you wrote yourself is not really testing!
- BACKUUUUP!

In the end, Seerr already does the job in two clicks. The chatbot added 20 seconds of waiting and a coin flip. Maybe I'll try again someday with a bigger model on a real GPU. Maybe not? 

Axel
