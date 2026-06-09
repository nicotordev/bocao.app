# Licensing

Bocao.app uses a **dual licensing** model so the project can be sold on CodeCanyon while remaining open to the community.

## Editions

| Edition | Where | License | Who it is for |
| --- | --- | --- | --- |
| **Community** | This GitHub repository | [AGPL-3.0](../../LICENSE) | Developers, contributors, self-hosters, evaluators |
| **Commercial** | [CodeCanyon](https://codecanyon.net) (planned) | Envato Regular / Extended + [Commercial License](../../COMMERCIAL-LICENSE.md) | Buyers who need proprietary terms without copyleft obligations |

## Why AGPL-3.0 for the community edition?

Bocao.app is a hosted restaurant operating system (SaaS-style). **AGPL-3.0** is a strong copyleft license that:

- Lets anyone use, study, modify, and redistribute the source code.
- Requires sharing modifications when you distribute the software.
- Extends copyleft to **network use** — if you run a modified version as a public service, you must offer corresponding source to users interacting with it over a network.

This protects the project from competitors taking the community codebase, improving it privately, and selling a competing hosted product without contributing back.

## Why dual licensing?

As the copyright holder, the author may license the same codebase under different terms:

1. **Free / open** via AGPL-3.0 on GitHub — community contributions welcome.
2. **Paid / proprietary** via CodeCanyon — buyers receive Envato license terms without AGPL obligations.

This is the same pattern used by Qt, MongoDB (historically), and many Envato authors who publish a "split license" or community edition.

## CodeCanyon compatibility

Envato supports three licensing modes for code items:

| Mode | Description | Bocao.app plan |
| --- | --- | --- |
| **Standard Envato** | Regular / Extended License only | Used for Commercial edition buyers |
| **Split license** | Part GPL, part Envato | Optional if bundling GPL-only dependencies |
| **100% GPL** | Entire item under GPL | **Not used** — would remove commercial exclusivity |

Bocao.app will be listed on CodeCanyon under **standard Envato licensing** (not "100% GPL"). The public GitHub repo remains AGPL-3.0 under the community edition.

> **Important:** CodeCanyon buyers and GitHub clone users receive **different licenses**. Purchasing on CodeCanyon does not grant AGPL exemptions; cloning from GitHub does not grant commercial redistribution rights.

## Choosing the right edition

### Use the Community Edition (AGPL-3.0) if you:

- Want to self-host for your own restaurant.
- Plan to contribute improvements back.
- Are evaluating the stack before buying a commercial license.
- Accept AGPL obligations for any public/hosted deployment.

### Buy the Commercial Edition if you:

- Want to resell or white-label without AGPL copyleft.
- Need to keep modifications private in a hosted product.
- Require Envato support and update channels.
- Want a license that does not require source disclosure.

## Contributing

By contributing to this repository, you agree that your contributions are licensed under AGPL-3.0. See [CONTRIBUTING.md](../../.github/CONTRIBUTING.md).

## Third-party dependencies

Dependencies in `package.json` have their own licenses (MIT, Apache-2.0, etc.). The AGPL-3.0 applies to Bocao.app source code in this repository, not to upstream packages.

## Questions

- Community / AGPL questions: open a [GitHub Discussion](https://github.com/nicotordev/bocao.app/discussions) or Issue.
- Commercial licensing: contact via CodeCanyon item page (when published).
