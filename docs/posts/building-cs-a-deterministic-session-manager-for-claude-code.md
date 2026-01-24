---
layout: BookLayout
title: "Building cs: A Deterministic Session Manager for Claude Code"
date: 2025-01-24T10:00:00.000Z
---

# Building cs: A Deterministic Session Manager for Claude Code

If you've been using Claude Code extensively, you've probably encountered a familiar frustration: you're deep in a coding session, switch terminals, and suddenly you're starting fresh instead of resuming your previous context. The native `--resume` flag opens an interactive picker, and `--session-id` requires manually tracking UUIDs. This friction inspired me to build **cs** (Claude Code Session Manager) — a lightweight CLI tool that creates deterministic sessions based on your current folder and git branch.

In this post, I'll walk you through why I built this tool and dive deep into the technical implementation.

## The Problem

When working with Claude Code across multiple terminal windows or over several days, I found myself constantly losing context. The existing options weren't ideal:

1. **`--resume` flag**: Opens an interactive picker if no session exists — not great for automation
2. **`--session-id`**: Requires manually tracking UUIDs somewhere
3. **No session management**: Starting fresh every time wastes context and time

What I wanted was simple: **the same folder + same branch should always resume the same session**. No configuration, no manual tracking — just deterministic behavior.

## The Solution: Deterministic UUIDs

The core insight was to use **UUID v5** (RFC 4122) to generate deterministic identifiers. Unlike UUID v4 (random) or UUID v1 (time-based), UUID v5 uses SHA-1 hashing to produce the same output for the same input every time.

```
folder_name + branch_name → SHA-1 hash → UUID v5
```

This means running `cs` in `my-project` on branch `main` will always produce the same session UUID, regardless of which terminal, machine, or time of day.

## Technical Implementation

I chose **Rust** for this project for several reasons:

- **Instant startup**: Native binary with no runtime overhead
- **Small binary size**: ~330KB after optimization
- **Cross-platform**: Single codebase for macOS, Linux, Windows, and more
- **No dependencies at runtime**: Just the binary

### UUID v5 Generation

The heart of the tool is the UUID v5 generation function:

```rust
fn generate_uuid5(name: &str) -> String {
    let namespace = get_namespace();

    // RFC 4122 UUID v5: SHA-1 hash of namespace + name
    let mut hasher = Sha1::new();
    hasher.update(&namespace);
    hasher.update(name.as_bytes());
    let hash = hasher.finalize();

    // Extract UUID components from hash
    let time_low = u32::from_be_bytes([hash[0], hash[1], hash[2], hash[3]]);
    let time_mid = u16::from_be_bytes([hash[4], hash[5]]);
    let time_hi = u16::from_be_bytes([hash[6], hash[7]]);
    let clock_seq = u16::from_be_bytes([hash[8], hash[9]]);

    // Set version (5) and variant bits per RFC 4122
    let time_hi_version = (time_hi & 0x0FFF) | 0x5000;
    let clock_seq_variant = (clock_seq & 0x3FFF) | 0x8000;

    format!(
        "{:08x}-{:04x}-{:04x}-{:04x}-{:02x}{:02x}{:02x}{:02x}{:02x}{:02x}",
        time_low, time_mid, time_hi_version, clock_seq_variant,
        hash[10], hash[11], hash[12], hash[13], hash[14], hash[15]
    )
}
```

The namespace defaults to the RFC 4122 DNS namespace but can be customized via the `CS_NAMESPACE` environment variable — useful if you want separate session pools for work and personal projects.

### Session Persistence

Sessions are tracked in a simple database at `~/.cs/sessions`:

```rust
fn load_sessions() -> HashSet<String> {
    let path = get_db_path();
    if !path.exists() {
        return HashSet::new();
    }

    fs::read_to_string(&path)
        .unwrap_or_default()
        .lines()
        .filter(|line| !line.is_empty())
        .map(|s| s.to_string())
        .collect()
}

fn save_session(uuid: &str) {
    let path = get_db_path();
    if let Some(parent) = path.parent() {
        let _ = fs::create_dir_all(parent);
    }

    let mut sessions = load_sessions();
    if sessions.insert(uuid.to_string()) {
        let content = sessions.into_iter().collect::<Vec<_>>().join("\n");
        let _ = fs::write(&path, content);
    }
}
```

Using a `HashSet` provides O(1) lookups, making session checks instant even with hundreds of saved sessions.

### Platform-Specific Process Handling

One interesting challenge was launching Claude Code correctly across platforms. On Unix systems, we use the `exec()` syscall to replace the current process entirely — this is more efficient than spawning a child. On Windows, we spawn a child process and wait for completion since the process model works differently.

```rust
#[cfg(unix)]
fn launch_claude(args: &[&str]) -> ! {
    use std::os::unix::process::CommandExt;

    let mut cmd = Command::new("claude");
    cmd.args(args);

    // Replace current process with claude
    let err = cmd.exec();
    eprintln!("Failed to launch claude: {}", err);
    std::process::exit(1);
}

#[cfg(windows)]
fn launch_claude(args: &[&str]) -> ! {
    let status = Command::new("claude")
        .args(args)
        .status()
        .expect("Failed to launch claude");

    std::process::exit(status.code().unwrap_or(1));
}
```

## Build Optimization

To achieve the smallest possible binary, I configured aggressive optimizations in `Cargo.toml`:

```toml
[profile.release]
strip = true          # Remove debug symbols
lto = true            # Link-time optimization
opt-level = "z"       # Optimize for size
codegen-units = 1     # Better optimization at cost of compile time
```

This brings the binary from several megabytes down to ~330KB — small enough that downloads and updates are instant.

## Cross-Platform Support

One of my goals was to support as many platforms as possible. The current build matrix includes:

| Platform | Architectures |
|----------|---------------|
| macOS | Intel (x86_64), Apple Silicon (aarch64) |
| Linux | x64, ARM64 (glibc), x64, i686 (musl) |
| Windows | x64, ARM64 |
| FreeBSD | x64 |
| Android | ARM64, ARM32, x64 (Termux) |
| iOS | via iSH app |

The GitHub Actions workflow builds all 14 target triples in parallel, making releases quick and consistent.

## Usage

Using `cs` is straightforward:

```bash
# Start or resume session for current folder + branch
cs

# Force new session (ignore database)
cs --force    # or: cs -f

# Remove stale session and start fresh
cs --reset

# Use Claude's picker if session not found
cs --resume   # or: cs -R

# See session info without launching
cs --dry-run  # or: cs -n

# List all tracked sessions
cs --list     # or: cs -l

# Clear entire session database
cs --clear

# Update to latest version
cs upgrade    # or: cs -U
```

### Claude Code CLI Passthrough

All Claude Code CLI options are passed through automatically:

```bash
# Enable Chrome integration
cs --chrome

# Use a specific model
cs --model opus

# Combine cs flags with Claude flags
cs -f --verbose

# Run Claude subcommands (bypass session logic)
cs doctor
cs mcp
```

The output provides clear feedback:

```
┌─────────────────────────────────────────────
│ Session: my-project+feature-auth
│ UUID:    a1b2c3d4-e5f6-5789-abcd-ef0123456789
│ Status:  resumed
└─────────────────────────────────────────────

Resuming session...
```

## Installation

The tool is available through multiple channels:

**Homebrew (macOS/Linux):**
```bash
brew install bikramtuladhar/cs/cs
```

**Direct Installation:**
```bash
curl -fsSL https://raw.githubusercontent.com/bikramtuladhar/claude-code-resumer/main/install.sh | bash
```

**From Source:**
```bash
cargo install --git https://github.com/bikramtuladhar/claude-code-resumer
```

## Lessons Learned

Building this tool taught me several things:

1. **Simple solutions win**: UUID v5 gave me determinism without any external state synchronization
2. **Platform abstraction is tricky**: The process launching differences between Unix and Windows required careful handling
3. **Rust's conditional compilation is powerful**: `#[cfg(...)]` attributes made cross-platform code clean
4. **GitHub Actions matrix builds are amazing**: 14 platforms from a single workflow
5. **CLI wrapper ergonomics matter**: Passing through all underlying CLI options transparently makes the tool feel native rather than restrictive

## What's Next

Some features I'm considering for future versions:

- Session naming/aliasing for easier identification
- Integration with shell prompts to show current session
- Session statistics and usage tracking

## Conclusion

**cs** solves a real workflow friction point for Claude Code users. By using deterministic UUIDs and simple file-based persistence, it provides instant session management with zero configuration. The entire tool is around 800 lines of Rust — small enough to understand completely, yet powerful enough to handle real-world usage. It also passes through all Claude Code CLI options, so you can use `cs --chrome --model opus` just like you would with the native CLI.

If you're a Claude Code user frustrated by session management, give it a try. And if you find bugs or have feature suggestions, contributions are welcome on [GitHub](https://github.com/bikramtuladhar/claude-code-resumer).

Happy coding!
