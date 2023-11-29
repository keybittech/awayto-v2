---
title: "Installation"
weight: 1
---

### [&#128279;](#installation) Installation

Clone [the repo](https://github.com/jcmccormick/wc).

```shell
git clone https://github.com/jcmccormick/wc.git && cd wc
```

Set the awayto binary to be executable.

```shell
chmod +x ./awayto
```

Run the first-time developer setup. This will generate the necessary configurations and artifacts to run the stack locally.

```shell
./awayto dev first-run
```

After this process completes, the platform will be running on a number of docker containers spawned locally on your system. If you visit https://localhost in your browser, you should see this page you're reading!