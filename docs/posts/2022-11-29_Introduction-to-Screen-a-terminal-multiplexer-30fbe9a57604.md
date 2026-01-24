---
layout: BookLayout
title: "Introduction to Screen a terminal multiplexer"
date: 2022-11-29T00:00:00.000Z
---

# Introduction to Screen a terminal multiplexer

Screen is terminal multiplexer with lots of function to work on terminal with unlimited terminal windows and tabs. Screen comes with cool features like locking the session or mirroring current session to share with other users for various kind of purpose (i.e. terminal tutorial).

## Starting screen with name

```bash
screen -S name
```

## List screen

From screen:
```bash
Ctrl+a "
```

From shell:
```bash
screen -ls
```

## Lock current session

```bash
Ctrl+a x
```

## Detach from screen

```bash
Ctrl+a d
```

## Reattach screen

```bash
screen -r
```

## Reattach screen with PID

```bash
screen -r 10835
```

## Mirroring screen

```bash
screen -rxU
```
