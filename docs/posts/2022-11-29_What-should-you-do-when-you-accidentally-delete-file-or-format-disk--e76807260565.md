---
layout: BookLayout
title: "What should you do when you accidentally delete file or format disk"
date: 2022-11-29T00:00:00.000Z
---

# What should you do when you accidentally delete file or format disk

This week Bikram Tuladhar shared his experience when he accidentally deleted his hard disk and steps how he recovered.

## Local Recovery Steps

1. First of all, shut down the system gracefully.
2. Mount formatted disk as read-only or avoid read operation to disk.
3. Use TestDisk for formatted disk which recovers partition table.
4. Use PhotoRec for recover deleted files.

> **Note:** Be aware it doesn't always recover file name.

5. If you prefer GUI use R-Studio disk recovery which does pretty much good job.
6. Don't dump recovered file in a deleted partition if you have not to mount it in read-only mode.

## Remote Server Recovery

What if you formatted or delete remote server's partition?

1. Mount formatted or file deleted partition in read-only mode if possible.
2. Use TestDisk or PhotoRec as your requirement.
3. If it is mounted root disk then prepare another server with sufficient disk for storing dump of deleted partition.
4. Use dd command like this:

```bash
sudo dd if=/dev/sdX | ssh username@server sudo dd of=/dev/sdY
```

> **Note:** sdX is deleted disk block, sdY is a new disk for storing block

5. I know it takes time to dump every bit of block.
6. Now follow the instruction of software as your need.

## Resources

- [TestDisk](https://www.cgsecurity.org/wiki/TestDisk)
- [PhotoRec](https://www.cgsecurity.org/wiki/PhotoRec)
- [R-Studio](https://www.r-tt.com)
