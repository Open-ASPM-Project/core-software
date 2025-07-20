Open-ASPM - Open Source Application Security Posture Management Platform
-------------------------------------------
<img align="right" alt="logo" src="./static/logos/logo.png"/> 

Open-ASPM is an open source Application Security Platform that provides comprehensive visibility and control, enabling developers to build securely and security teams to manage risk effectively.

The Open-ASPM project aims to democratize cybersecurity by providing enterprise-grade, easy-to-deploy, and intuitive security solutions. Our objective is to make state-of-the-art protection accessible to every business, regardless of size or budget.

  &nbsp;&nbsp;&#x25CF;&nbsp;&nbsp;<a href="#core-functions">Core functions</a>
  &nbsp;&nbsp;&#x25CF;&nbsp;&nbsp;<a href="#website--support">Website / Support</a>
  &nbsp;&nbsp;&#x25CF;&nbsp;&nbsp;<a href="#installation">Installation</a>
  &nbsp;&nbsp;&#x25CF;&nbsp;&nbsp;<a href="#documentation">Documentation</a>
  &nbsp;&nbsp;&#x25CF;&nbsp;&nbsp;<a href="#development">Development</a>
  &nbsp;&nbsp;&#x25CF;&nbsp;&nbsp;<a href="#contributing">Contributing</a><br>
  &nbsp;&nbsp;&#x25CF;&nbsp;&nbsp;<a href="#license">License</a>


[![CLA FREE initiative](https://raw.githubusercontent.com/ossbase-org/ossbase.org/main/logos/cla-free-small.png)](https://ossbase.org/initiatives/cla-free/)

Core functions
------------------
- A **complete and robust application security posture management platform** that can be deployed on-premise, in the cloud, or as a SaaS solution, suitable for organizations of all sizes. 
- **Secret Scanning**, Platform utilises open source tools gitleaks and truffle-hog for detecting hardcoded secrets in the code.
- **Software Composition Analysis (SCA)**, Platform utilises open source tools grype and syft for detecting vulnerabilities on dependencies in the code.
- **Post-commit scanning**, Automatically scans code and dependencies for vulnerabilities and secrets immediately after changes are committed to the repository, acting as a critical safety net in the development pipeline.
- **Integrates seamlessly** with your existing workflows, supporting GitHub, Bitbucket, and GitLab. Get critical alerts via Slack and Jira, ensuring your teams stay informed.
- **Centralized Incident Management**, Provides a unified, real-time overview of all cybersecurity incidents across diverse version control systems, repositories, teams, and projects, displaying status, priority, assignments, and resolution timelines.
- **Comprehensive Asset Inventory**, Provides a detailed and continuously updated catalog of all repositories, discovered secrets, and identified vulnerabilities across your entire ecosystem, offering a crucial foundation for risk assessment and management.
- Easily deploy Open-ASPM using **Docker Compose** for local or self-hosted environments, or through **cloud marketplaces** for streamlined integration with your existing cloud infrastructure.
- Empower your organization to define custom roles and manage access with precision using **Authentication, Role-Based Access Control (RBAC), and simplified user authentication via Single Sign-On (SSO)**.
- **Asset Grouping**, Organize and monitor related assets collectively to streamline security monitoring, track group-level security scores, and simplify management for large-scale deployments or team-based security tracking.
- **Dynamic Scoring and Risk-Based Prioritization**, Open-ASPM automatically prioritizes security issues using an intelligent scoring engine that considers multiple risk factors, enabling security teams to focus on the most critical remediation tasks first.
- **False Positive Management**, Streamline your workflow and accelerate business-critical releases by easily managing false positives through one-click allowlisting at organizational or version control system levels, minimizing unnecessary delays.
- **Rich API Support for Custom Automations**, Our platform provides extensive API capabilities, empowering users to build custom automations and integrate Open-ASPM seamlessly into their unique security workflows.
- Gain a comprehensive, real-time overview of your security posture through intuitive **dashboards**, enabling effective **tracking of security incidents, monitoring of all assets, and efficient management of remediation efforts**.
- **Open-source commitment:** With Open-ASPM, you get an unwavering commitment to open source. Our license ensures no single company can ever change its open model or license, guaranteeing the tool will always remain free and open, never becoming proprietary or semi-open.

## Main advantages

The main benefit of using Open-ASPM is its ability to serve as a **comprehensive and robust platform for application security**, enabling organizations of all sizes to:

- **Unified AppSec:** A single platform to manage and streamline all application security efforts across your entire software development lifecycle.
- **Cut Costs:** Ditch expensive AppSec licenses.
- **Lower Risk:** Build secure from day one, reducing vulnerabilities.
- **Boost Efficiency:** Streamline security and empower your developers.
- **Total Trust:** Open-source code means full transparency and auditability.
- **No Vendor Lock-In:** Stay in control of your security infrastructure.
- **Community Powered:** Benefit from global expert contributions.


Website / Support
------------------

Checkout the [website](https://www.open-aspm.org) for more information about Open-ASPM software, tools and communities.

Information, news and updates are also regularly posted on the Open-ASPM project [Discord server](https://discord.gg/jD2cEy2ugg), [Linkedin account](https://www.linkedin.com/company/open-aspm) and [news page](https://www.open-aspm.org/news/).

Installation
-------------

```bash
git clone https://github.com/Open-ASPM-Project/core-software.git
cd core-software
```

### Environment Setup

Create a `.env` file in the project root directory.

```
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_DB=postgres

BACKEND_DIR=./src/backend
FRONTEND_DIR=./src/frontend
FRONTEND_PORT=5173

BACKEND_URL=http://localhost:80
FRONTEND_URL=http://localhost:5173
```

### Starting the Application

To start all services:

```bash
docker-compose up
```

To run the services in detached mode:

```bash
docker-compose up -d
```

The application will be available at `http://localhost:80` through the NGINX reverse proxy.

| Service    | Local URL             | Swagger UI                                 | Description                |
| ---------- | --------------------- | ------------------------------------------ | -------------------------- |
| NGINX      | http://localhost:80   | N/A                                        | Main entry point           |
| User Auth  | http://localhost:3000 | http://localhost:3000/v2/user-auth/swagger | Authentication services    |
| Assets     | http://localhost:3002 | http://localhost:3002/v2/assets/swagger    | Asset management           |
| PostgreSQL | localhost:5432        | N/A                                        | Database (requires client) |

Documentation
-------------

[Documentation](https://docs.thefirewall.org) 
[Youtube](https://youtube.com/playlist?list=PLcA3BglulRz-Cyr7U_wZ1XkU50J3fV-YL&si=IhhEKSSVClZqPhIw)
[API](https://docs.thefirewall.org/api-reference) 

Development
-------------

### Viewing Logs

To view logs for all services:

```bash
docker-compose logs -f
```

To view logs for a specific service:

```bash
docker-compose logs -f [service-name]
```

Example:

```bash
docker-compose logs -f assets
```

### Stopping the Application

To stop all services:

```bash
docker-compose down
```

To stop and remove volumes (this will delete all data):

```bash
docker-compose down -v
```

### Rebuilding Services

If you make changes to the code, you'll need to rebuild the services:

```bash
docker-compose build
```

Or to rebuild a specific service:

```bash
docker-compose build [service-name]
```

Contributing
------------

Want to help build Open-ASPM? We welcome all contributions!

Check out our [contributing page](CONTRIBUTING.md) to see the many ways you can get involved. Please also review our [Code of conduct](code_of_conduct.md).

Feel free to fork our code, experiment, create patches, and send us pull requests through GitHub [issues](https://github.com/open-aspm-project/core-software/issues).

For any questions, remarks, or bug reports, don't hesitate to contact us or create an [issue](https://github.com/open-aspm-project/core-software/issues).

License
-------

This software is licensed under [GNU Affero General Public License version 3](http://www.gnu.org/licenses/agpl-3.0.html)

