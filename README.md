# ChatGPT Downloader

A tool for downloading all your [ChatGPT](https://en.wikipedia.org/wiki/ChatGPT) conversations.

As an official API is not available yet, this tool is a reverse engineering of the ChatGPT AJAX calls.

## Usage

For the time being, you need to clone the repository, install Node.js and run the following commands:

```bash
$ npm i -g pnpm
$ cd <project-dir>
$ pnpm install
$  pnpm run build && pnpm run start -a "Bearer <your-session-token>" -c "<your-session-cookie>"
```

NOTE: Do not share your session token and cookie with anyone.

To obtain your session token and cookie, you can use your browser's developer tools and inspect 
the network calls made by the ChatGPT website.
