## 1.0.0 (2025-05-23)


### 🐛 Bug Fixes

* **ci:** correct GitHub App token action parameter names ([74171f2](https://github.com/lerianstudio/midaz-mcp-server/commit/74171f2436094e9986021f4a393885a4a19b0aa5))
* **ci:** import GPG key before git config and use action's git setup ([98fd3e2](https://github.com/lerianstudio/midaz-mcp-server/commit/98fd3e23f3148b8b5d9bba9f1e391eb7edef4183))
* **ci:** remove Alpine variant build from workflow ([9b5d8b1](https://github.com/lerianstudio/midaz-mcp-server/commit/9b5d8b1f1df81d18ccc4707bb9d5af4106acea46))
* **ci:** update workflows to use Lerian Studio standard secrets ([19267c9](https://github.com/lerianstudio/midaz-mcp-server/commit/19267c9243c971621b26ad6a2d029277efbdd92a))
* **ci:** use lowercase repository name for GitHub Container Registry ([b8837c6](https://github.com/lerianstudio/midaz-mcp-server/commit/b8837c641be9cb5fe58a5b06ac58e59646319422))
* **docker:** resolve build issues in GitHub Actions pipeline ([c2d773c](https://github.com/lerianstudio/midaz-mcp-server/commit/c2d773cd30b69e74903039507016e5394df9a73e))
* **docker:** skip prepare script during npm ci to prevent build failures ([731ce5e](https://github.com/lerianstudio/midaz-mcp-server/commit/731ce5ed5979a02786540f14bbbfb1bc65375a74))


### 👷 CI/CD

* add comprehensive CI/CD workflows for consistency with Midaz project ([4033911](https://github.com/lerianstudio/midaz-mcp-server/commit/40339118c170b8746e9462a95010e202737b56ee))

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Dynamic documentation discovery from llms.txt
- Security enhancements (input validation, audit logging, rate limiting)
- MCP protocol compliance (subscriptions, pagination, content types)
- Docker support with multi-stage builds
- Comprehensive CI/CD pipelines
- Code quality and security scanning
- Automated dependency updates
- Release automation with semantic versioning

### Changed
- Documentation now fetched from docs.lerian.studio instead of local files
- Improved error handling with proper MCP error codes
- Enhanced TypeScript type safety

### Security
- Added input validation with Zod schemas
- Implemented injection attack prevention
- Added audit logging with automatic rotation
- Enforced localhost-only connections
- Secure configuration file handling

## [0.1.0] - 2024-05-22

### Added
- Initial release of Midaz MCP Server
- Educational content and model information
- Read-only API tools for Midaz interaction
- Support for Claude Desktop integration
- Comprehensive documentation resources
- Fallback mode with stub data
- Configuration management system

[Unreleased]: https://github.com/lerianstudio/midaz-mcp-server/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/lerianstudio/midaz-mcp-server/releases/tag/v0.1.0
