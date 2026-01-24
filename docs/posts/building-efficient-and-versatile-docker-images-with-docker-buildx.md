---
layout: BookLayout
title: "Building Efficient and Versatile Docker Images with Docker Buildx"
date: 2024-07-27T02:44:12.746Z
---

# Building Efficient and Versatile Docker Images with Docker Buildx

![Docker Buildx](/images/posts/docker-buildx-cover.jpeg)

Docker is an essential tool for modern developers, allowing for the creation, deployment, and management of containerized applications. One of the powerful features of Docker is Docker Buildx, an experimental CLI plugin that extends the functionality of `docker build`. This blog will guide you through an interactive journey of leveraging Docker Buildx to create and manage builders, focusing on the commands:

```shell
docker buildx create --name local_remote_builder --node local_remote_builder --node intelarch --platform linux/amd64,linux/38 --driver-opt env.BUILDKIT_STEP_LOG_MAX_SIZE=10000000 --driver-opt env.BUILDKIT_STEP_LOG_MAX_SPEED=10000000

docker buildx create --name local_remote_builder --node aarch6 --append --platform linux/arm64,linux/riscv64,linux/ppc64le,linux/s390x,linux/mips64le,linux/mips64,linux/arm/v8,linux/arm/v7,linux/arm/v6 ssh://user@xxx.xxx.xxx.xxx --driver-opt env.BUILDKIT_STEP_LOG_MAX_SIZE=10000000 --driver-opt env.BUILDKIT_STEP_LOG_MAX_SPEED=10000000

docker buildx use local_remote_builder
```

## Step-by-Step Guide to Using Docker Buildx

### Step 1: Create a New Builder with Multiple Nodes

Creating a builder with multiple nodes allows you to build images for various platforms simultaneously. Here, we create a builder named `local_remote_builder` with nodes for different architectures.

```shell
docker buildx create --name local_remote_builder --node local_remote_builder --node intelarch --platform linux/amd64,linux/38 --driver-opt env.BUILDKIT_STEP_LOG_MAX_SIZE=10000000 --driver-opt env.BUILDKIT_STEP_LOG_MAX_SPEED=10000000
```

#### Breakdown:

- `--name local_remote_builder`: Names the builder instance.
- `--node local_remote_builder`: Adds a node to the builder.
- `--node intelarch`: Adds another node, targeting Intel architectures.
- `--platform linux/amd64,linux/38`: Specifies the platforms for the build.
- `--driver-opt env.BUILDKIT_STEP_LOG_MAX_SIZE=10000000`: Sets the maximum log size for the build steps.
- `--driver-opt env.BUILDKIT_STEP_LOG_MAX_SPEED=10000000`: Sets the maximum log speed.

### Step 2: Append More Platforms to Your Builder

To support even more platforms, you can append additional nodes to your existing builder. Building ARM architecture images on an AMD CPU can be very time-consuming, so it's more efficient to use an ARM instance and access Docker remotely via SSH.

```shell
docker buildx create --name local_remote_builder --node aarch6 --append --platform linux/arm64,linux/riscv64,linux/ppc64le,linux/s390x,linux/mips64le,linux/mips64,linux/arm/v8,linux/arm/v7,linux/arm/v6 ssh://user@xxx.xxx.xxx.xxx --driver-opt env.BUILDKIT_STEP_LOG_MAX_SIZE=10000000 --driver-opt env.BUILDKIT_STEP_LOG_MAX_SPEED=10000000
```

#### Breakdown:

- `--append`: Appends new platforms to the existing builder.
- `ssh://user@xxx.xxx.xxx.xxx`: Specifies the remote SSH endpoint for the build node.

### Step 3: Use the Newly Created Builder

After setting up your builder, you need to specify it as the active builder.

```shell
docker buildx use local_remote_builder
```

This command activates the `local_remote_builder` for subsequent build operations.

## Conclusion

Docker Buildx is a powerful tool that enhances the standard `docker build` command, enabling efficient multi-platform builds. By following the steps outlined above, you can create versatile builders that cater to various architectures and platforms, ensuring your applications are robust and widely deployable. Utilizing ARM instances for ARM builds ensures efficiency and saves time, allowing for a smoother development process.

## Interactive Component

To further understand these commands, you can run them in a Docker-enabled environment and observe how each step contributes to the build process. Feel free to tweak the parameters and explore different configurations to see how they affect your builds.

### Additional Resources

- [Docker Buildx Documentation](https://docs.docker.com/buildx/working-with-buildx/)
- [Docker Multi-platform Builds](https://www.docker.com/blog/multi-platform-docker-builds/)
- [Advanced Build Cache Management](https://docs.docker.com/buildx/working-with-buildx/#build-cache)

Happy building!
