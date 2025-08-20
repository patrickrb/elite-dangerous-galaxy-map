# Elite Dangerous Galaxy Map - Next.js

A modern 3D galaxy map visualization for Elite Dangerous, rebuilt with Next.js, React, and Three.js.

## 🚀 Migration Complete!

This project has been successfully modernized from Angular.js 1.x to **Next.js 15** with:
- ✅ React 19 + TypeScript
- ✅ Three.js 3D visualization 
- ✅ Modern build system
- ✅ Responsive UI with Tailwind CSS

## Features

- **Interactive 3D Galaxy Map**: Navigate through 1000+ star systems with smooth camera controls
- **System Information**: Click on systems to view detailed information including economy, allegiance, government, and population
- **Color Coding**: Systems color-coded by economy type for easy identification
- **Responsive Design**: Modern UI that works on desktop and mobile devices
- **Real-time Data**: API-driven system data with support for future database integration

## Getting Started

### Prerequisites
- Node.js 18.0.0 or higher
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/patrickrb/edGalaxyMap.git
cd edGalaxyMap
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **3D Graphics**: Three.js with WebGL
- **Styling**: Tailwind CSS
- **API**: Next.js API Routes
- **Build System**: Next.js/Webpack (replaces legacy Grunt)

## Legacy Migration

This project was migrated from:
- Angular.js 1.x → React 19
- Grunt + Bower → Next.js build system  
- ES5 + Babel → Modern TypeScript
- Express.js → Next.js API routes
- Legacy dependencies → Modern packages

The original Angular.js codebase and server are preserved in the repository for reference.

---

## Original Angular.js Documentation (Legacy)

[![Join the chat at https://gitter.im/patrickrb/edGalaxyMap](https://badges.gitter.im/patrickrb/edGalaxyMap.svg)](https://gitter.im/patrickrb/edGalaxyMap?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![Dependency Status](https://gemnasium.com/patrickrb/edGalaxyMap.svg)](https://gemnasium.com/patrickrb/edGalaxyMap)
[ ![Codeship Status for patrickrb/edGalaxyMap](https://codeship.com/projects/8f486ba0-bd50-0133-2548-2a1d867cc1c8/status?branch=develop)](https://codeship.com/projects/136539)
[![Stories in Ready](https://badge.waffle.io/patrickrb/edGalaxyMap.png?label=ready&title=Ready)](http://waffle.io/patrickrb/edGalaxyMap)
[![Code Climate](https://codeclimate.com/github/patrickrb/edGalaxyMap/badges/gpa.svg)](https://codeclimate.com/github/patrickrb/edGalaxyMap)

Built with [Angular][1] and [Three.js][2]

### Legacy Prerequisites (for Angular.js version)

- [Git](https://git-scm.com/)
- [Node.js and NPM](nodejs.org) >= v5.1.0
- [Bower](bower.io) (`npm install --global bower`)
- [Ruby](https://www.ruby-lang.org) and then `gem install sass`
- [Grunt](http://gruntjs.com/) (`npm install --global grunt-cli`)
- [MongoDB](https://www.mongodb.org/) - Keep a running daemon with `mongod`

### Legacy Development (Angular.js)

1. Run `npm install` to install server dependencies.
2. Run `bower install` to install front-end dependencies.
3. Run `mongod` in a separate shell to keep an instance of the MongoDB Daemon running
4. Run `grunt serve` to start the development server. It should automatically open the client in your browser when ready.

## Contributors

[patrickrb][4]

[csvurt][5]

[1]: https://angularjs.org/
[2]: http://threejs.org/
[3]: http://galaxy.burnsforce.com/
[4]: https://github.com/patrickrb
[5]: https://github.com/csvurt

## Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- Elite Dangerous game by Frontier Developments
- Three.js community for excellent 3D graphics library
- Original contributors to the Angular.js version
