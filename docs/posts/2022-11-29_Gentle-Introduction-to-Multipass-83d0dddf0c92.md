---
layout: BookLayout
title: "Gentle Introduction to Multipass"
date: 2022-11-29T00:00:00.000Z
---

# Gentle Introduction to Multipass

This week Bikram Tuladhar gave a small introduction about Multipass. Multipass is mini-cloud for mac, windows and Linux with a snap which provides a command-line interface to launch, manage and generally fiddle about with instances of Linux.

Multipass is very easy to use and manage Linux instance which is lighter than docker. He shows us the use case of the multipass managed instance as a local cloud or running Linux specific tool. You can install multipass from their [website](https://multipass.run/).

## Create a new instance

```bash
multipass launch --name ubuntu --disk 50G
```

Above the command will launch ubuntu named ubuntu instances with 50 G of storage.

Once the cloud image is downloaded, multipass will use the same image to provision the instance without re-download. which is very quick and time-saving.

## Using cloud-init

Since multipass support cloud-init function. we can pass a cloud-init function to set up the instance as we create the server.

```bash
multipass launch -n ubuntu --cloud-init cloud-config.yaml
```

## Access the shell

To access the shell of created instance:

```bash
multipass shell ubuntu
```

You can either use multipass `shell` command to access the server or use native ssh to multipass.

## Mount folders

Multipass use SSHFS to mount the host folder to a multipass instance which is super easy and very useful to use the same code for execution in the Linux environment.

```bash
multipass mount /host/dir ubuntu:/some/path
```

## Execute commands

Multipass execute the command inside the instance from the host with `exec` command which is super helpful to retrieve the output from the instance.

```bash
multipass exec ubuntu -- git --version
multipass exec ansible -- php -v
```

More info and document about Multipass can found [here](https://discourse.ubuntu.com/c/multipass/doc).
