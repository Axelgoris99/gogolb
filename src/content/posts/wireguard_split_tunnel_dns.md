---
title: "My WireGuard split tunnel broke all my DNS"
date: 2026-11-16
excerpt: Local IPs worked, every domain name failed. The culprit was a catch-all DNS route that NetworkManager adds when it imports a WireGuard config, and it only bites once systemd-resolved is on.
tags: [wireguard, dns, networkmanager, systemd-resolved, linux]
draft: true
---

One evening my laptop lost the internet. Well, sort of. Everything on my local network still worked. Anything on the internet: dead.

If you ever end up there, here's the quick test: `ping 1.1.1.1` works but `ping google.com` doesn't? It's DNS. It's always DNS.

What made this one fun is that nothing in my WireGuard config looked wrong, and it had been working fine earlier that evening. It broke when I turned on something unrelated.

## The setup

I have two WireGuard tunnels on my laptop: one to my place, one to my parents' place. Both houses have a Freebox, and the Freebox can run a WireGuard server and hand you a ready-made config file. Both tunnels are **split tunnels**: only traffic for that house's network goes through the tunnel, everything else goes out normally.

Here's the config the Freebox gave me for my place (keys removed):

```ini
[Interface]
PrivateKey = <redacted>
Address = 192.168.27.68/32
DNS = 212.27.38.253
MTU = 1360

[Peer]
PublicKey = <redacted>
Endpoint = <my-domain>:<port>
AllowedIPs = 192.168.2.0/24
```

`AllowedIPs = 192.168.2.0/24` is what makes it a split tunnel: only my home network goes through the tunnel. Remember that `DNS` line, though. 212.27.38.253 is a public DNS server run by Free, my ISP. It's on the internet, **not** inside 192.168.2.0/24.

I manage my network with NetworkManager, so I imported the file:

```bash
nmcli connection import type wireguard file wg-home.conf
```

Tunnel up, life is good.

Later that evening I wanted names like `something.home.goris.live` to resolve through the Pi-hole at my parents' place (through the other tunnel), and everything else through my normal DNS. That's called split DNS, and on Linux the tool for it is `systemd-resolved`. On NixOS that's one line:

```nix
services.resolved.enable = true;
```

Rebuild. A bit later: no more internet.

## What actually happened

### 1. The import adds a catch-all you never asked for

Here's what NetworkManager stored for the tunnel:

```
$ nmcli -f ipv4.dns,ipv4.dns-search connection show wg-home
ipv4.dns:                               212.27.38.253
ipv4.dns-search:                        ~
```

That lone `~` is the whole story. When you import a WireGuard config that has a `DNS` line and no search domain, NetworkManager adds `~` on its own. The comment in its source code says it will "assume the user wants to use the domain server for all searches."

`~` (shown as `~.` by systemd-resolved) is a **routing domain** that matches every name. In plain words: *send every DNS query to this connection's DNS server, through this connection.*

This isn't NetworkManager being weird. It copies `wg-quick`, which does the same thing with that `DNS` line (it registers the server with `resolvconf -x`, "exclusive" mode). For a full tunnel (`AllowedIPs = 0.0.0.0/0`) that's exactly what you want: all your DNS goes through the VPN, nothing leaks. For a split tunnel, it's a trap.

### 2. Without systemd-resolved, it doesn't matter

Before I enabled resolved, NetworkManager just wrote the servers into `/etc/resolv.conf`:

```
nameserver 212.27.38.253
nameserver 192.168.2.254
```

The `~` meant nothing there. A query to 212.27.38.253 is just a normal packet: the kernel looks at the routing table, sees it's not in 192.168.2.0/24, and sends it out over Wi-Fi. Free's DNS server answers. Everything works.

That's why it worked fine at first.

### 3. With systemd-resolved, the `~.` is obeyed

systemd-resolved takes routing domains seriously. `~.` on the tunnel means "this is where all names go," and resolved sends those queries **out of the tunnel interface itself**, not through the routing table.

Now WireGuard gets a packet for 212.27.38.253. WireGuard only sends a packet to a peer if the destination is in that peer's `AllowedIPs`. 212.27.38.253 isn't in 192.168.2.0/24, so no peer matches and WireGuard drops the packet. Every DNS lookup just times out.

Talking to my local machines by IP needs no DNS, so that still worked. Hence the "only local stuff works" feeling.

## The quick fix, and why it doesn't last

```bash
resolvectl revert wg-home
```

That removes the tunnel's DNS settings from systemd-resolved and the internet came back right away. But it's temporary: the next time the tunnel reconnects, NetworkManager pushes the same settings again and you're back to square one.

## The real fix

The tunnel to my place doesn't need DNS at all: I reach things there by IP. So I removed its DNS settings and told NetworkManager to ignore any it gets:

```bash
nmcli connection modify wg-home ipv4.dns "" ipv4.dns-search "" ipv4.ignore-auto-dns yes
nmcli connection up wg-home
```

The tunnel to my parents' place *should* do DNS, but only for my home domain. So instead of the catch-all, it gets a routing domain limited to that domain, pointing at the Pi-hole on that network (which is inside its `AllowedIPs`, so WireGuard will carry it):

```bash
nmcli connection modify wg-parents ipv4.dns 192.168.1.14 ipv4.dns-search "~home.goris.live"
nmcli connection up wg-parents
```

`resolvectl query` tells you which connection answered a lookup, which makes checking this easy:

```
$ resolvectl query google.com
google.com: 142.251.142.14          -- link: wlo1

$ resolvectl query home.goris.live
home.goris.live: 192.168.1.6        -- link: wg-parents
```

Normal names go through Wi-Fi, my home domain goes through the tunnel to the Pi-hole. That's split DNS, actually split this time.

## What to remember

- **`DNS =` in a WireGuard config means "use this for everything."** Fine for a full tunnel. In a split tunnel, the DNS server has to be inside `AllowedIPs`, or the line should go.
- **After `nmcli connection import type wireguard`, check `ipv4.dns-search`.** A lone `~` is a catch-all.
- **Want only some names through the tunnel?** Use a routing domain like `~home.example.com` instead.
- **`resolvectl status`** shows which connection has `~.`, and **`resolvectl query <name>`** shows which one answered. Those two commands are where I'll start next time.
- **Bugs like this can sit there quietly** until you enable something else. Everything was "working" only because nothing was reading that `~` yet.
