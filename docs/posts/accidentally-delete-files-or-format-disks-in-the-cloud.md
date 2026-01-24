---
layout: BookLayout
title: "Disaster Strikes: What to Do When You Accidentally Delete Files or Format Disks in the Cloud"
date: 2023-03-28T04:28:17.261Z
---

# Disaster Strikes: What to Do When You Accidentally Delete Files or Format Disks in the Cloud

![Disaster Recovery](/images/posts/disaster-recovery-cover.jpeg)

Recovering lost files or formatted disks in a cloud server can be a daunting task, especially if you're not familiar with the recovery process. Unlike physical computers, where you can simply remove the disk and attempt to recover the data, cloud servers require a more complicated approach.

---

## Steps to recover your lost data

1. Gracefully shut down the system. This will prevent any further damage to the disk and improve the chances of recovering lost data.

2. Mount the **formatted disk as read-only**. It is essential to mount the formatted disk as read-only or avoid any read operations to the disk if possible.

3. **Recover the partition table of a formatted disk**.

   Use [**TestDisk**](https://www.cgsecurity.org/wiki/TestDisk), a powerful tool that can analyze and recover lost partition tables.

   **Follow the Steps:**

   - Install TestDisk on your cloud server.
   - Launch TestDisk and select the formatted disk.
   - Select "Analyse" and wait for the tool to scan the disk.
   - Select "Quick Search" to search for lost partitions.
   - If Quick Search doesn't find the lost partition, select "Deeper Search" to search for more partitions.
   - Select the lost partition and choose "Write" to save the partition table.

### PhotoRec: Media file recovery tool

Use [PhotoRec](https://www.cgsecurity.org/wiki/PhotoRec), which can recover files (especially media files) from a formatted disk or a deleted partition.

**Follow the steps:**

- Install PhotoRec on your cloud server.
- Launch PhotoRec and select the disk where the deleted files were located.
- Select the file system type of the disk.
- Choose the partition where the deleted files were located.
- Select "Search" and wait for the tool to scan the disk.
- Select the files you want to recover and choose "Copy" to save them to a safe location.

### R-Studio disk recovery: powerful GUI recovery tool

If you prefer GUI Tool then use, [R-Studio disk recovery](https://www.r-studio.com/) is an excellent tool that does a great job of recovering lost files or formatted disks.

**Follow the steps:**

- Install R-Studio on your cloud server.
- Launch R-Studio and select the formatted or deleted disk.
- Select "Scan" and wait for the tool to scan the disk.
- Select the files you want to recover and choose "Recover" to save them to a safe location.

---

## Recovering lost files from boot partitions from the cloud server

1. Create a new instance to store boot partition data in a separate disk.

2. Prepare another disk to mount with sufficient disk space to store the dump of the deleted partition.

3. Use the dd command to transfer the data from a deleted instance to a newly created disk in a new server.

   Use the following command to copy the data from the deleted disk block to a new disk for storing the block:

```bash
# Cloning boot disk remotely
# run this command from server where file was deleted

sudo dd if=/dev/sdX | ssh username@server sudo dd of=/dev/sdY
```

- Replace "sdX" with the deleted disk block and "sdY" with a new disk for storing the block.
- Use any tools mentioned above to start recovery.

---

## Conclusion

Follow the Instructions Carefully While the recovery process begins, it can be time-consuming, so be patient.

### Links

- [R-studio](https://www.r-studio.com/)
- [Test-disk](https://www.cgsecurity.org/wiki/TestDisk)
- [Photo-rec](https://www.cgsecurity.org/wiki/PhotoRec)

Feel free to share your thoughts and opinions and leave me a comment if you have any problems or questions.

Till then, Keep on Hacking, Cheers
