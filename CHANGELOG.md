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