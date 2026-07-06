---
layout: BookLayout
title: "Building a Home Air Quality Monitor with a Raspberry Pi and Grafana"
date: 2026-07-06T10:00:00.000Z
---

# Building a Home Air Quality Monitor with a Raspberry Pi and Grafana

I wanted to know what the air in my house actually looks like: not a single number on an app, but a graph I could scroll back through: mornings vs. evenings, cooking spikes, what happens when I open a window. So I wired a cheap laser particle sensor to a Raspberry Pi that was gathering dust, and turned it into a live, public dashboard with years of history.

This is the whole build: the hardware, the serial-port rabbit hole, and (the part I find more interesting) the *design decisions* about how to store and show the data on a machine with almost no RAM.

> **All the code** (the sensor exporter plus the install and provisioning scripts) is on GitHub: [**bikramtuladhar/home-air-quality-monitor**](https://github.com/bikramtuladhar/home-air-quality-monitor).

## The hardware

Four cheap parts, two of them just to connect the other two:

- **Plantower PMS5003**: a laser particle counter. It sucks air past a laser and counts how much light the particles scatter, then reports PM1.0 / PM2.5 / PM10 mass concentrations plus raw particle counts.
- **Raspberry Pi 3 B+**: already on my shelf. 1 GB of RAM, which matters a lot later.
- **8-pin 1.25mm → 2.54mm breakout adapter**: the PMS5003 ends in a cramped 1.25mm JST-style connector (the "G135" 8-pin type, made for the PMS1003/3003/5003). This little board converts it to a standard 0.1" header you can actually wire to.
- **20cm female-to-female Dupont jumper wires**: bridge the adapter's header to the Pi's GPIO. No soldering anywhere in this build.

The sensor talks over a **UART serial link** (a simple two-wire connection where two chips send data one byte at a time) at 9600 baud (baud is just the speed). The one thing worth knowing up front: it needs **5V** to run its fan and laser, but the data pins are **3.3V logic** (the voltage it uses to signal 1s and 0s), so they wire straight to the Pi's GPIO pins (the row of metal pins on the Pi you connect wires to) with no level shifter needed.

Once the adapter turns the sensor's connector into a normal header, four jumper wires do the job:

| PMS5003 | → | Raspberry Pi |
|---|---|---|
| VCC | → | 5V (pin 2 or 4) |
| GND | → | GND (pin 6) |
| TXD | → | RXD (GPIO15, pin 10) |
| RXD | → | TXD (GPIO14, pin 8) |

The crossover is the classic gotcha: the sensor's **TX** goes to the Pi's **RX**. Wire TX→TX and you'll get silence and wonder why. The sensor's fourth wire (Pi TX → sensor RX) is only needed if you want to send sleep/wake commands; for just reading air quality you can leave it off. One power note for the 3 B+: the fan adds ~100 mA, so use a solid 2.5 A supply or you'll get under-voltage warnings.

## The serial-port rabbit hole

This is where an hour disappeared, so I'll save you the same hour.

Every Pi with onboard Bluetooth (the 3 B+ included) has a dirty secret: the **good** hardware UART (the PL011) is wired to the Bluetooth chip, and your GPIO pins get the **mini-UART** instead. The mini-UART's baud rate drifts with the CPU clock, which shows up as occasional garbled or dropped frames. At 9600 baud it's *usually* fine, but "usually" is not what you want from a sensor logging forever.

The fix is to hand the good UART to the GPIO pins by turning Bluetooth off. And because I'm running **Ubuntu**, not Raspberry Pi OS, there's no `raspi-config`, so you edit files directly. Three things had to be true:

**1. Enable the UART and free it from Bluetooth** in `/boot/firmware/config.txt`:

```
enable_uart=1
dtoverlay=disable-bt
```

**2. Stop the serial login console from fighting for the port.** By default Ubuntu Server tries to offer a text login over that same serial line (a "getty"), which grabs the port before the sensor can use it. Remove any `console=ttyAMA0,115200` / `console=serial0,...` token from `/boot/firmware/cmdline.txt` (it's one line, don't add breaks), then:

```bash
sudo systemctl disable --now serial-getty@ttyAMA0.service
```

**3. Fix permissions** so you don't need `sudo` to read the port:

```bash
sudo apt install python3-serial
sudo usermod -aG dialout $USER
```

After a reboot, the reliable PL011 UART shows up as `/dev/ttyAMA0` and 9600 baud is rock solid. (If you'd rather keep Bluetooth, `dtoverlay=miniuart-bt` moves BT onto the mini-UART and still frees the good one for the sensor.)

## Reading the sensor

The PMS5003 spits out a **32-byte frame** every second: two start bytes (`0x42 0x4D`), a length field, thirteen 16-bit values, and a checksum. Rather than pull in a library, it's a few lines of `pyserial` to sync on the header, verify the checksum, and unpack the values.

There's more in that frame than most people log. The full set:

- **PM1.0 / 2.5 / 10, atmospheric**: the ambient-air numbers you actually report.
- **PM1.0 / 2.5 / 10, "CF=1"**: a factory calibration against a reference particle; diverges from atmospheric only at high concentrations.
- **Six particle counts**: particles ≥0.3, 0.5, 1.0, 2.5, 5.0, 10 µm per 0.1 L. These are **cumulative** ("≥0.5" includes everything ≥1.0 and up), so to get a true size band you subtract the next bin.
- **A reserved word**: high byte is firmware version, low byte is an error code (0 = healthy). A free health check.

I wanted all fourteen fields logged, not just the three headline numbers.

## The interesting part: how do you store "all days"?

A live number is easy. *History* is the hard requirement, and this is where the design thinking happened.

**The idea in plain English:** the sensor just shouts a fresh number once a second and forgets it. To keep months of history *and* draw nice graphs, you split the job into three small programs, each doing one thing:

1. an **exporter**: publishes the sensor's *current* reading on a little web page,
2. a **database**: visits that page on a timer and records every value forever (this is a "time-series database", one built for "value at a time" data),
3. **Grafana**: reads the database and draws the dashboards.

You could dump readings into a text file instead, but you'd then be reinventing the querying, retention, and graphing that these tools already do. The whole rest of this section is just *which* database to pick.

The obvious answer is the classic home-lab stack: **Prometheus + Grafana**, often bundled in Docker (a tool that packages apps so they're easy to run). But look at the machine: a Pi 3 B+ with **899 MB of RAM and zero swap** (swap is spare disk space the system uses as overflow when RAM fills up; this Pi had none). Cram Prometheus *and* Grafana *and* Docker onto that and you run out of memory, at which point Linux force-kills a random program to survive ("OOM" = out of memory), usually at 3 a.m. So I climbed down the ladder and asked what each piece actually needs to do:

- **Something to scrape and store** the metrics with long retention.
- **Something to draw dashboards.**

Grafana is the only piece that genuinely wants to be Grafana, so it stays. But Prometheus is heavier than this box can comfortably afford. The swap I made:

**VictoriaMetrics instead of Prometheus.** It's a single ~30 MB Go binary that *both* scrapes and stores, speaks the same PromQL and the same scrape-config format, compresses far better, and takes a fraction of the RAM. One process instead of two, and `-retentionPeriod=10y` gives me "all days" essentially for free. One sensor at a 15-second scrape is nothing on disk. I also added a **1 GB swapfile**, because having zero swap on a 1 GB box is living dangerously and disk was the one thing I had 21 GB of.

The final shape:

```
sensor → exporter (:8000) → VictoriaMetrics (:8428, 10y) → Grafana (:3000)
```

Idle footprint lands around 450 MB, comfortably inside 899 MB, with swap as the safety net. (And the safety net earns its keep: it sits at ~350 MB used. Full Prometheus + Grafana would have been genuinely risky.)

## From print loop to metrics endpoint

Turning the reader into something VictoriaMetrics can scrape was about ten lines ([`pms5003_exporter.py`](https://github.com/bikramtuladhar/home-air-quality-monitor/blob/main/pms5003_exporter.py)). The `prometheus_client` library exposes a `/metrics` HTTP endpoint; I just set a `Gauge` per reading instead of printing:

```python
from prometheus_client import Gauge, start_http_server

PM    = Gauge("pms5003_pm_ugm3", "PM mass (ug/m3)", ["size", "calibration"])
COUNT = Gauge("pms5003_particles", "Particles per 0.1L, cumulative", ["size_um"])
FW    = Gauge("pms5003_firmware_version", "Firmware version byte")

start_http_server(8000)          # exposes /metrics
# ...then in the read loop:
PM.labels("pm2.5", "atm").set(d["pm2_5"])
# ...one .set() per field
```

Full script (frame parsing, checksum, all 14 fields): [`pms5003_exporter.py`](https://github.com/bikramtuladhar/home-air-quality-monitor/blob/main/pms5003_exporter.py).

VictoriaMetrics scrapes it using a plain Prometheus scrape config (`prometheus.yml`):

```yaml
global:
  scrape_interval: 15s   # 1s sensor data; 15s storage is plenty for trends
scrape_configs:
  - job_name: pms5003
    static_configs:
      - targets: ["localhost:8000"]
```

Both the exporter and VictoriaMetrics run as `systemd` services (background programs Linux keeps alive and restarts automatically on reboot), so they come back after a power cut. One [`setup.sh`](https://github.com/bikramtuladhar/home-air-quality-monitor/blob/main/setup.sh) installs the whole stack plus the swapfile. The VictoriaMetrics unit is where the "store forever, but sip RAM" decision actually lives:

```ini
ExecStart=/usr/local/bin/victoria-metrics-prod \
  -storageDataPath=/var/lib/victoria-metrics \
  -promscrape.config=/opt/pms5003/prometheus.yml \
  -retentionPeriod=10y \
  -memory.allowedPercent=40
```

`-memory.allowedPercent=40` is the important knob on a 1 GB box: it caps VictoriaMetrics' cache so it can't crowd out Grafana. It scrapes `localhost:8000` every 15 seconds and keeps it for a decade.

## Dashboards, and a "GOOD / UNHEALTHY" banner

In Grafana I built two dashboards (one for PM mass concentration, one for the particle-count distribution) plus the piece I actually care about at a glance: a big **color-coded air-quality banner** driven by live PM2.5 against the US EPA breakpoints. (All of it is provisioned through the Grafana API by [`grafana_setup.sh`](https://github.com/bikramtuladhar/home-air-quality-monitor/blob/main/grafana_setup.sh), so it's reproducible, not click-by-click.)

| PM2.5 (µg/m³) | Status | Color |
|---|---|---|
| 0–12 | GOOD | green |
| 12–35 | MODERATE | yellow |
| 35–55 | UNHEALTHY (sensitive) | orange |
| 55–150 | UNHEALTHY | red |
| 150–250 | VERY UNHEALTHY | purple |
| 250+ | HAZARDOUS | dark red |

The banner is a `stat` panel with `colorMode: background`. Two pieces do the work: **thresholds** pick the color and **value mappings** turn the raw number into a word. The relevant slice of the panel JSON:

```json
"thresholds": { "mode": "absolute", "steps": [
  { "color": "green",  "value": null },
  { "color": "yellow", "value": 12.1 },
  { "color": "orange", "value": 35.5 },
  { "color": "red",    "value": 55.5 },
  { "color": "purple", "value": 150.5 }
]},
"mappings": [
  { "type": "range", "options": { "from": 0,     "to": 12,    "result": { "text": "GOOD" } } },
  { "type": "range", "options": { "from": 12.1,  "to": 35.4,  "result": { "text": "MODERATE" } } },
  { "type": "range", "options": { "from": 35.5,  "to": 55.4,  "result": { "text": "UNHEALTHY (sensitive groups)" } } },
  { "type": "range", "options": { "from": 55.5,  "to": 150.4, "result": { "text": "UNHEALTHY" } } }
]
```

The query behind it is just `pms5003_pm_ugm3{calibration="atm", size="pm2.5"}`.

One gotcha cost me a few minutes: on **Grafana 13**, a Prometheus time-series panel renders "No data" unless each query explicitly sets `"range": true`. The data was there the whole time (querying VictoriaMetrics directly returned a full series); the panels just weren't asking for a range query. A version quirk, not a data problem.

## Making it a wall display, on my own domain

The last mile was turning this into something I could throw on a screen: no login, and reachable from anywhere.

**No login:** Grafana has an anonymous-viewer mode. Rather than edit `grafana.ini` (which upgrades can clobber), I set it with a systemd drop-in at `/etc/systemd/system/grafana-server.service.d/override.conf`:

```ini
[Service]
Environment=GF_AUTH_ANONYMOUS_ENABLED=true
Environment=GF_AUTH_ANONYMOUS_ORG_ROLE=Viewer
Environment=GF_SERVER_ROOT_URL=https://your.domain/
```

Now anyone on the network can watch, but not edit. I grouped the two dashboards into a **playlist** that auto-cycles every 30 seconds. Instant kiosk mode.

**On my domain:** normally a device on your home network can't be reached from the internet: your router hides it (that's "NAT"), and the usual workaround, "port forwarding," pokes a hole in your router that's fiddly and a bit risky. The lazy, safe way around this is a **Cloudflare Tunnel**: a small program (`cloudflared`) on the Pi dials *out* to Cloudflare and holds the connection open, so visitors reach the Pi through Cloudflare with **no holes opened in my router at all**, and it handles the HTTPS padlock for free. After a one-time `cloudflared tunnel login`, the whole exposure is one `config.yml`:

```yaml
tunnel: <tunnel-uuid>
credentials-file: /home/pi/.cloudflared/<tunnel-uuid>.json
ingress:
  - hostname: your.domain
    service: http://localhost:3000
  - service: http_status:404
```

That plus a DNS route (`cloudflared tunnel route dns`) is the whole thing, all wrapped in [`tunnel_setup.sh`](https://github.com/bikramtuladhar/home-air-quality-monitor/blob/main/tunnel_setup.sh). The wall now lives at a public subdomain of my own domain.

One thing I did **not** skip: the moment anything faces the internet, the default `admin/admin` Grafana login is a takeover waiting to happen. **Change it before you expose it.** Anonymous visitors stay read-only; editing needs the real password.

## What I'd tell past me

- **Match the tool to the hardware, not the blog posts.** The default "Prometheus + Grafana in Docker" advice quietly assumes you have RAM to burn. On a 1 GB Pi, swapping in VictoriaMetrics was the difference between stable and OOM.
- **The serial port is 80% of the pain.** The sensor is easy; convincing a Pi 3 B+ on Ubuntu to give you a clean UART is the actual project.
- **Log everything now.** The particle-count bins and CF=1 values cost nothing extra to store, and future-me will want the size distribution I didn't think I needed.
- **Sensors drift.** These EPA categories are officially for a *24-hour average*, and low-cost sensors read a bit off in humidity. The banner reacting to instantaneous readings is fine for a home display. Just don't treat it as a reference-grade instrument.

Total cost: a sensor, a Pi I already owned, and an afternoon. Now I have a decade of retention, a public dashboard, and (more useful than I expected) a very concrete reason to stop pan-frying with the kitchen window shut.
