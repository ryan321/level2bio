# Spec-First Development Kit for Claude Code

A complete workflow for spec-first development where specifications are the source of truth and code is generated from them.

## Philosophy

1. **Spec before code**: Define what you're building before you build it
2. **Documentation is primary**: Code is derived from specs, not vice versa
3. **Verify continuously**: AI agents check alignment, security, performance, and quality
4. **Small iterations**: Build incrementally, commit often, review always

## Quick Start

### Starting a New Project

```bash
# Copy this kit to your project
cp -r spec-first-kit/. your-project/

# Initialize git
cd your-project
git init

# Start Claude Code and run the project interview
claude
> /interview-project
```

The interview will ask you questions and generate:
- `CLAUDE.md` - Project overview for Claude
- `docs/vision.md` - Why this exists
- `docs/spec.md` - What it does
- `docs/constraints.md` - Hard limits

### Defining Architecture

```
> /interview-architecture
```

This generates `docs/architecture.md` and scaffolds your project structure.

### Building Features

```
> /implement [feature from spec]
```

This implements features according to the spec, following architecture patterns.

### Committing Changes

```
> /commit
```

This runs all review agents (alignment, security, performance, best practices), generates a commit message, and commits.

## Available Commands

### Discovery & Planning

| Command | Purpose |
|---------|---------|
| `/interview-project` | Start a new project—generates vision, spec, constraints |
| `/interview-architecture` | Design technical architecture |
| `/interview-feature` | Add a new feature to the spec |

### Implementation

| Command | Purpose |
|---------|---------|
| `/implement [feature]` | Build a feature from spec |
| `/research [topic]` | Look up technical information |

### Review

| Command | Purpose |
|---------|---------|
| `/review-alignment` | Check changes against vision/spec |
| `/review-security` | Security vulnerability scan |
| `/review-performance` | Performance issue detection |
| `/review-best-practices` | Code quality review |

### Workflow

| Command | Purpose |
|---------|---------|
| `/commit` | Full review + commit |
| `/commit --quick` | Quick commit with minimal checks |
| `/audit` | Comprehensive project health check |
| `/sync-docs` | Update docs to match code reality |

## Workflow

### Typical Development Session

```
# Start your day
> /audit                          # Check project health

# Add a feature
> /interview-feature              # Define it in the spec
> /implement [feature]            # Build it
> /commit                         # Review and commit

# Continue
> /implement [next feature]
> /commit

# End of sprint
> /audit                          # Full health check
> /sync-docs                      # Ensure docs are current
```

### Before Major Releases

```
> /audit                          # Comprehensive review
> /sync-docs                      # Documentation current
> /review-security                # Full security scan
```

## File Structure

```
your-project/
├── CLAUDE.md                     # Project overview for Claude
├── .claude/
│   └── commands/                 # All the slash commands
│       ├── interview-project.md
│       ├── interview-architecture.md
│       ├── interview-feature.md
│       ├── implement.md
│       ├── research.md
│       ├── review-alignment.md
│       ├── review-security.md
│       ├── review-performance.md
│       ├── review-best-practices.md
│       ├── commit.md
│       ├── audit.md
│       └── sync-docs.md
├── docs/
│   ├── vision.md                 # Why this exists
│   ├── spec.md                   # What it does
│   ├── constraints.md            # Hard limits
│   └── architecture.md           # How it's built
└── [your code here]
```

## Customization

### Adding Domain-Specific Research

Create specialized research commands:

```markdown
# .claude/commands/research-swift.md

You are a Swift/iOS research agent. Prioritize:
1. Apple developer documentation
2. WWDC sessions
3. Swift evolution proposals
4. Swift forums

[rest of research template]
```

### Adding Custom Review Checks

Create project-specific review agents:

```markdown
# .claude/commands/review-accessibility.md

You are an accessibility auditor. Check for:
- VoiceOver support
- Dynamic Type support
- Color contrast
- Touch target sizes
[etc.]
```

### Adjusting Commit Strictness

Edit `.claude/commands/commit.md` to change what blocks commits vs. what's just noted.

## Tips

1. **Run `/interview-project` thoroughly**: Better specs = better code
2. **Commit often**: Small commits are easier to review and revert
3. **Use `/research` liberally**: Better to look things up than guess
4. **Run `/audit` weekly**: Catch drift before it accumulates
5. **Keep specs updated**: When requirements change, update docs first

## Why This Works

- **AI needs clear specs**: Ambiguity leads to wrong implementations
- **Review catches AI mistakes**: Adversarial agents find issues
- **Documentation stays fresh**: Docs are part of the workflow, not afterthought
- **Human stays in control**: You define what to build; AI helps build it

## License

MIT - Use this however you want.
