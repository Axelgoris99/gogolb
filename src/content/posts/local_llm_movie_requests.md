---
title: "I built a local movie-request chatbot. Then I deleted it."
date: 2026-11-16
excerpt: A 4B model on a homelab CPU, wired to Seerr so I could type "I want Dune" and find it on Jellyfin. The benchmarks were great, the tests passed, and the first real conversation fell apart.
tags: [homelab, self-host, llm, ollama, open-webui]
draft: true
---

The idea was simple: type "I want Dune" in a chat, and a bit later it's on Jellyfin. No app to open, nothing to click. And fully local: no cloud API, nothing leaves the house.

I already had most of the pieces. Seerr (Overseerr and Jellyseerr merged into one) handles requests: you search a title, click request, and Radarr or Sonarr take it from there until it shows up on Jellyfin. Open WebUI with Ollama was already sitting in a container on one of my Proxmox boxes. All I needed was a small model that could talk to Seerr for me.

It took an evening to build, a night to tune, and one real conversation to kill.

## Where to run it

Two options:

- My media server has a GTX 1060, already busy transcoding. But it's the 3 GB version: a 2B model fits next to the transcoder, a 4B doesn't. And Pascal cards are on their last NVIDIA driver branch.
- My other Proxmox box has no GPU, but a 6-core i5-8500 and 32 GB of RAM.

I also looked at "decision models" like Jev (and Jeff, its open replica): tiny models that pick an option from a list you give them, really fast. Great for routing ("is this a movie, a series or a status question?"), but they can't pull a title out of a sentence or ask "which Dune?". So no.

CPU it was, with Qwen3 4B.

## Why my first test "took forever"

I had tried Open WebUI on that box a few days earlier. I typed a message, waited, gave up. The Ollama logs explained it:

```
eval time = 135140.13 ms / 80 tokens (1710.63 ms per token, 0.58 tokens per second)
```

0.58 tokens per second. A 4B model on that CPU should do 15 times better. Two things were going on.

**The model was thinking.** The `qwen3:4b` tag in Ollama now points to Qwen3-4B-Thinking-2507, a model that always reasons before it answers, and you can't turn that off. One reply had "thought" for 911 tokens when it died after 26 minutes. The instruct version (`qwen3:4b-instruct-2507-q4_K_M`) answers straight away.

**The threads were fighting a game server.** Ollama starts one thread per core, so 6 here. But a modded Terraria server on the same host keeps one core at 100%, all the time. llama.cpp splits every step across its threads and waits for all of them before the next step. One thread stuck sharing a core with the game server, and every other thread waits for it. Same model, same prompt:

| Threads | Reading the prompt | Generating |
|---|---|---|
| 6 (default) | 9 tok/s | 0.6 tok/s |
| 4 | 29 tok/s | 9.3 tok/s |
| 3 | 27 tok/s | 9.4 tok/s |

The default was the worst possible choice. Generation barely changes between 3 and 4 threads, since it's mostly limited by memory speed. I went down to 2 threads (6.4 tok/s) to leave room for more game servers, set per model with `PARAMETER num_thread 2` in an Ollama Modelfile.

One more CPU trap: Open WebUI generates chat titles, tags and follow-up suggestions with the same model. Each one is a full extra LLM call, and on a CPU they queue right behind your actual message. They can be turned off in the admin settings (Interface tab).

## The tool

Open WebUI tools are Python classes, and each method becomes a function the model can call. I gave it three, and only three:

- `search_media(query)`: search Seerr
- `request_media(tmdb_id, media_type)`: create the request
- `request_status()`: what's downloading

No delete, no approve. Small models get more reliable with fewer tools, and I didn't want it anywhere near destructive actions.

A Seerr detail worth knowing: an API call with just the API key runs **as the admin**, and admin requests are auto-approved. Add an `X-API-User` header with a user ID and it acts as that user instead, with their permissions and approval rules. So the tool matched whoever was logged into Open WebUI to their Seerr account, and refused to request anything when it couldn't find one.

## "I want Odyssey"

First real try (the bot's answers were in French, translated here):

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

To be fair to the model, it was right. My search results only had the title, the year and a plot summary. No director anywhere. And three films really are called *The Odyssey* (2026). The French was most likely because my system prompt was in French.

So I moved the thinking into the tool:

- every result gets its director (or series creator) and two lead actors
- near-empty TMDB entries (one vote, nobody looks at them) get dropped
- when one result is 4 times more popular than all the others, it's marked `MOST LIKELY` (Nolan's Odyssey: popularity 481, the next one 23)
- `year` and `person` filters, so "the Nolan one" becomes `search_media("Odyssey", person="Nolan")`
- every result ends with a `Next:` line telling the model what to do and which language to answer in, guessed from the user's messages

Small models follow the text right before their answer much better than their system prompt, so that last trick helped a lot. I replayed eight conversations and all eight went right: "I want Odyssey" → "The Odyssey (2026), directed by Christopher Nolan? (yes/no)" → "yes" → requested.

Along the way, one test reply got stuck in a loop and generated 1,700 tokens over 6 minutes before I killed it. On a CPU, that's a core gone for as long as it runs. So I capped every reply at 300 tokens.

## Then a human used it

> **Me:** Je voudrais le film Dune *(I'd like the movie Dune)*
>
> **Bot:** 1. Dune (2021) 2. Dune: Part Two (2024) 3. Dune (1984). Which one?
>
> **Me:** 1 et 2 *(1 and 2)*

And the answer, raw:

```
Les deux films Dune (2021) et Dune: Part Two (2024) sont des films récents de Denis Villeneuve.
Je vais les ajouter à la liste pour téléchargement.
Next: ask which one to pick (1 or 2), then call request_media with the correct tmdb_id.
Reply in French.
Do not pick one yourself.
Do not list all results again.
Only if the user answers with a number, call request_media.
Only if the user answers with a number, call request_media.
Only if the user answers with a number, call request_media.
Only if the user answers
```

My eight tests all picked one result. A real person asked for two. The model didn't know what to do with that, so it did what small models do when they're lost: it continued the pattern in front of it. That pattern was my `Next:` line. So it started writing its own instructions, then repeated one until the 300-token cap cut it off mid-sentence. It never even called the tool.

The trick that made the tests pass is exactly what leaked.

I removed everything the next morning. I had taken a Proxmox snapshot of the container before the first change, so undoing it all was one command (`pct rollback`). Then I deleted the container too.

## What I'm keeping from it

- **Check what a model tag points to.** `qwen3:4b` is not the model it was a few months ago.
- **On a shared CPU, set the thread count yourself.** The default was 15 times slower than fewer threads.
- **Turn off Open WebUI's background tasks on a CPU.** Titles and tags are not worth a minute each.
- **Cap the output.** A looping model on a CPU eats a core until something stops it.
- **Give the tool the data instead of asking the model to guess.** Directors and popularity fixed more than any prompt did.
- **Scripted tests lie.** Eight passing tests, broken by the first answer I didn't script: "1 et 2".
- **Snapshot before you start.** Undoing the whole experiment took one command.

To request a movie, Seerr's own search page already does the job in two clicks. A 4B model on a CPU added 20 seconds of waiting and a coin flip. Maybe with a bigger model on a real GPU someday. For now, I'll click.
