-----

# Contributing to the Open-ASPM Project

The Open-ASPM project is a growing open-source initiative supported by contributors who are passionate about democratizing cybersecurity. We fully support to foster an open, collaborative, and inclusive environment for everyone involved.

Our roadmap is heavily influenced by the needs of our user community, including small to medium businesses, security professionals, developers, and organizations seeking accessible enterprise-grade security.

Participating in the Open-ASPM project is straightforward, and there are many ways to contribute regardless of your skill level. 

-----

## Reporting Bugs, Suggesting Features, and Asking Questions

The most common ways to contribute are by reporting bugs, suggesting new features, or simply asking questions.

Each core component of Open-ASPM has its own dedicated issue tracker. For now, the primary place for all issues related to the core software is the **[Open-ASPM Core Software Issues](https://github.com/open-aspm-project/core-software/issues)**.

Feel free to **create [issues](https://github.com/open-aspm-project/core-software/issues)** if you have questions, remarks, or bug reports.

Provide as much detail as possible, including the version of Open-ASPM you're using, clear steps to reproduce a bug, screenshots with annotations, or thorough descriptions for feature suggestions. You can also comment on existing issues to provide more context or indicate the importance of a particular feature or bug.

### Following Up Afterward

If an Open-ASPM developer makes a code change that resolves your issue, your GitHub issue will typically be closed. We primarily maintain a `main` branch, considered stable, with frequent hotfixes. New features are developed in separate branches and merged regularly.

If, after testing a fix, you find it doesn't resolve your bug, please comment on your existing issue. This will notify us to re-examine or reopen it. Please do not create a duplicate issue.

Issues may also be closed with specific resolutions (e.g., `R: invalid`, `R: duplicate`, `R: wontfix`) along with an explanation. If an issue is closed without a specific resolution, it generally means the reported bug was fixed or the enhancement implemented.

-----

## Reporting Security Vulnerabilities

Please view our [Security Policy](security.md) for details on how to responsibly disclose security vulnerabilities.

-----

## Contributing to Open-ASPM Core


  * First, **fork the [Open-ASPM core project repository](https://github.com/open-aspm-project/core-software)**.
  * **Branch off from `main`** (the `main` branch is our primary development branch): `git checkout main`.
  * Then, **create a new branch** for your specific contribution (e.g., bug fix, enhancement, new feature) by typing `git checkout -b fix-new-dashboard-bug`.
  * **Work on your fix or feature.** Focus solely on the task; avoid committing debug functionalities, testing code, or unrelated changes.
  * **Commit your fix or feature** with a meaningful commit message. We recommend following conventions like `fix: [description]`, `feat: [description]`, or `chg: [description]` for clear changelog generation.
  * **Push your branch and [open a pull request](https://docs.github.com/en/github/collaborating-with-issues-and-pull-requests/creating-a-pull-request)** via the GitHub interface.

To increase the likelihood of your pull request being merged quickly:

  * **Prefer small, gradual changes** over large, complex ones.
  * **Provide a clear and concise commit message** that fully describes your changes.
  * **Avoid committing sensitive information, debugging code, or unrelated code** in your pull request.

-----

## Writing Documentation

We highly appreciate new documentation or improvements to existing documentation. If you're interested in helping with our user guides, API documentation, or project explanations, please let us know by opening an **[issue](https://github.com/open-aspm-project/core-software/issues)** to discuss.

-----

## Automatic Integration and Testing

Most repositories within the Open-ASPM GitHub organization include automatic integration with CI/CD pipelines (e.g., GitHub Actions). We welcome feedback and patches related to our testing infrastructure. For example, you can propose new tests or suggest additional automatic tests, including unit tests for the Open-ASPM core software. Please explain the expected benefits of your work to Open-ASPM developers and users to help us prioritize.

-----

## Testing New Releases and Updates

Testing new Open-ASPM releases and updates is a valuable contribution. However, please only attempt this if you are comfortable with technical environments and understand that **code in testing should never be used for critical production work**. Your feedback via GitHub issues after testing is greatly appreciated.

-----

## Translating Open-ASPM

We aim to make Open-ASPM accessible to a global audience\! If you're interested in helping translate the platform or its documentation into your native language, please **[contact us or create an issue](https://github.com/open-aspm-project/core-software/issues)** to discuss how you can contribute.

-----

## Improving the Open-ASPM Experience

As an Open-ASPM user, your insights are invaluable. If you have ideas to improve the user experience (UX) or usability of Open-ASPM, please create **[issues with your suggestions](https://github.com/open-aspm-project/core-software/issues)**. Even if you don't implement the suggestions yourself, your ideas can guide future development.

